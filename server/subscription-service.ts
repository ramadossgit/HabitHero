import Stripe from 'stripe';
import { storage } from './storage';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '../shared/subscription-plans';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export class SubscriptionService {
  // Create Stripe customer
  static async createCustomer(userId: string, email: string, name: string) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId }
      });
      
      await storage.updateStripeCustomerId(userId, customer.id);
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Create subscription
  static async createSubscription(userId: string, planId: string) {
    try {
      const user = await storage.getUserById(userId);
      if (!user) throw new Error('User not found');

      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await this.createCustomer(userId, user.email, `${user.firstName} ${user.lastName}`);
      }

      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      // Create price if it doesn't exist (in production, create these manually in Stripe)
      const priceId = await this.getOrCreatePrice(plan);

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: user.subscriptionStatus === 'trial' ? 0 : undefined,
      });

      // Update user subscription info
      await storage.updateUserSubscription(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status === 'trialing' || subscription.status === 'active' ? 'active' : 'cancelled',
        subscriptionPlan: planId,
        subscriptionEndDate: new Date(subscription.current_period_end * 1000)
      });

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        status: subscription.status
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Get or create Stripe price for plan
  private static async getOrCreatePrice(plan: SubscriptionPlan) {
    // In production, you should create these prices manually in Stripe dashboard
    // This is a simplified version for development
    const priceId = `price_${plan.id}_${Math.floor(plan.price * 100)}`;
    
    try {
      const existingPrice = await stripe.prices.retrieve(priceId);
      return existingPrice.id;
    } catch {
      // Price doesn't exist, create it
      const price = await stripe.prices.create({
        unit_amount: Math.floor(plan.price * 100),
        currency: plan.currency,
        recurring: {
          interval: plan.interval,
          interval_count: plan.intervalCount
        },
        product_data: {
          name: `Habit Heroes - ${plan.name}`,
          description: plan.features.join(', ')
        },
        metadata: { planId: plan.id }
      });
      return price.id;
    }
  }

  // Cancel subscription
  static async cancelSubscription(userId: string) {
    try {
      const user = await storage.getUserById(userId);
      if (!user?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      await storage.updateUserSubscription(userId, {
        subscriptionStatus: 'cancelled',
        subscriptionEndDate: new Date(subscription.current_period_end * 1000)
      });

      return subscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Check subscription status and update if needed
  static async syncSubscriptionStatus(userId: string) {
    try {
      const user = await storage.getUserById(userId);
      if (!user?.stripeSubscriptionId) return user;

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      const status = subscription.status === 'active' || subscription.status === 'trialing' ? 'active' 
                   : subscription.status === 'canceled' ? 'cancelled' 
                   : 'expired';

      if (status !== user.subscriptionStatus) {
        await storage.updateUserSubscription(userId, {
          subscriptionStatus: status,
          subscriptionEndDate: new Date(subscription.current_period_end * 1000)
        });
      }

      return await storage.getUserById(userId);
    } catch (error) {
      console.error('Error syncing subscription status:', error);
      return user;
    }
  }

  // Check if user has access to premium features
  static hasFeatureAccess(user: any, feature: string): boolean {
    if (!user) return false;
    
    // Trial users get limited access
    if (user.subscriptionStatus === 'trial') {
      const now = new Date();
      const trialEnd = new Date(user.trialEndDate);
      if (now > trialEnd) return false;
      
      // Limited trial features
      const trialFeatures = ['avatar_builder', 'balloon_pop', 'basic_habits'];
      return trialFeatures.includes(feature);
    }

    // Active subscribers get full access
    return user.subscriptionStatus === 'active';
  }

  // Get subscription status for user
  static getSubscriptionInfo(user: any) {
    const now = new Date();
    const trialEnd = user.trialEndDate ? new Date(user.trialEndDate) : null;
    const subscriptionEnd = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;

    return {
      status: user.subscriptionStatus || 'trial',
      plan: user.subscriptionPlan || 'trial',
      isTrialActive: user.subscriptionStatus === 'trial' && trialEnd && now <= trialEnd,
      isSubscriptionActive: user.subscriptionStatus === 'active' && subscriptionEnd && now <= subscriptionEnd,
      trialEndsAt: trialEnd,
      subscriptionEndsAt: subscriptionEnd,
      trialDaysLeft: trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0
    };
  }
}