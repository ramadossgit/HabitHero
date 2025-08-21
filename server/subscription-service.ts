import Stripe from 'stripe';
import { storage } from './storage';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '../shared/subscription-plans';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

      // Cancel any existing subscription first
      if (user.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(user.stripeSubscriptionId);
          console.log('Cancelled existing subscription:', user.stripeSubscriptionId);
        } catch (error) {
          console.warn('Could not cancel existing subscription:', error);
          // Continue anyway - it might already be cancelled
        }
      }

      // Create a PaymentIntent directly instead of relying on subscription invoice
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.floor(plan.price * 100), // Convert to cents
        currency: plan.currency,
        customer: customer.id,
        automatic_payment_methods: {
          enabled: true,
        },
        setup_future_usage: 'off_session', // Allow saving payment method for future use
        metadata: {
          userId: userId,
          planId: planId,
          type: 'subscription_payment'
        }
      });

      // Create price if it doesn't exist (in production, create these manually in Stripe)
      const priceId = await this.getOrCreatePrice(plan);

      // Create subscription but don't trigger immediate payment (will be completed via PaymentIntent)
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        // Start with trial to prevent immediate charge, we'll handle payment separately
        trial_period_days: 1,
        metadata: {
          userId: userId,
          planId: planId,
          paymentIntentId: paymentIntent.id
        }
      });

      // Update user subscription info  
      const currentPeriodEnd = (subscription as any).current_period_end;
      const subscriptionEndDate = currentPeriodEnd && typeof currentPeriodEnd === 'number' 
        ? new Date(currentPeriodEnd * 1000) 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days from now
        
      await storage.updateUserSubscription(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: 'pending', // Will be updated after successful payment
        subscriptionPlan: planId,
        subscriptionEndDate: subscriptionEndDate
      });

      console.log('Subscription and PaymentIntent created:', {
        subscriptionId: subscription.id,
        paymentIntentId: paymentIntent.id,
        status: subscription.status,
        clientSecret: paymentIntent.client_secret
      });
      
      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        status: subscription.status,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Complete subscription after successful payment
  static async completeSubscription(paymentIntentId: string) {
    try {
      // Retrieve the PaymentIntent to get metadata
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment not completed');
      }

      const userId = paymentIntent.metadata.userId;
      const planId = paymentIntent.metadata.planId;
      
      if (!userId || !planId) {
        throw new Error('Missing payment metadata');
      }

      // Get the user and their current subscription
      const user = await storage.getUserById(userId);
      if (!user?.stripeSubscriptionId) {
        throw new Error('No subscription found for user');
      }

      // Update the subscription to remove trial and activate immediately
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        trial_end: 'now', // End trial immediately
        proration_behavior: 'none', // Don't prorate since we already charged
      });

      // Update subscription status in database
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      const subscriptionEndDate = plan ? this.calculateEndDate(plan) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      await storage.updateUserSubscription(userId, {
        subscriptionStatus: 'active',
        subscriptionEndDate: subscriptionEndDate
      });

      console.log('Subscription activated successfully:', {
        userId,
        subscriptionId: subscription.id,
        planId,
        status: subscription.status
      });

      return subscription;
    } catch (error) {
      console.error('Error completing subscription:', error);
      throw error;
    }
  }

  // Calculate subscription end date based on plan
  private static calculateEndDate(plan: SubscriptionPlan): Date {
    const now = new Date();
    const result = new Date(now);
    
    switch (plan.interval) {
      case 'month':
        result.setMonth(result.getMonth() + (plan.intervalCount || 1));
        break;
      case 'quarter':
        result.setMonth(result.getMonth() + 3);
        break;
      case 'year':
        result.setFullYear(result.getFullYear() + (plan.intervalCount || 1));
        break;
      default:
        result.setMonth(result.getMonth() + 1); // Default to 1 month
    }
    
    return result;
  }

  // Get or create Stripe price for plan
  private static async getOrCreatePrice(plan: SubscriptionPlan) {
    // First, try to find existing price by metadata
    try {
      const prices = await stripe.prices.list({
        limit: 100,
        expand: ['data.product']
      });
      
      const existingPrice = prices.data.find(price => 
        price.metadata?.planId === plan.id && 
        price.unit_amount === Math.floor(plan.price * 100) &&
        price.currency === plan.currency
      );
      
      if (existingPrice) {
        return existingPrice.id;
      }
    } catch (error) {
      console.error('Error searching for existing prices:', error);
    }

    // Price doesn't exist, create it
    try {
      // First create the product
      const product = await stripe.products.create({
        name: `Habit Heroes - ${plan.name}`,
        description: `${plan.name} subscription plan for Habit Heroes`,
        metadata: { planId: plan.id }
      });

      // Then create the price
      const price = await stripe.prices.create({
        unit_amount: Math.floor(plan.price * 100),
        currency: plan.currency,
        recurring: {
          interval: plan.interval === 'quarter' ? 'month' : plan.interval as 'month' | 'year',
          interval_count: plan.interval === 'quarter' ? 3 : plan.intervalCount
        },
        product: product.id,
        metadata: { planId: plan.id }
      });
      
      return price.id;
    } catch (error) {
      console.error('Error creating price:', error);
      throw error;
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

      const currentPeriodEnd = (subscription as any).current_period_end;
      const subscriptionEndDate = currentPeriodEnd && typeof currentPeriodEnd === 'number' 
        ? new Date(currentPeriodEnd * 1000) 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
      await storage.updateUserSubscription(userId, {
        subscriptionStatus: 'cancelled',
        subscriptionEndDate: subscriptionEndDate
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
        const currentPeriodEnd = (subscription as any).current_period_end;
        const subscriptionEndDate = currentPeriodEnd && typeof currentPeriodEnd === 'number' 
          ? new Date(currentPeriodEnd * 1000) 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          
        await storage.updateUserSubscription(userId, {
          subscriptionStatus: status,
          subscriptionEndDate: subscriptionEndDate
        });
      }

      return await storage.getUserById(userId);
    } catch (error) {
      console.error('Error syncing subscription status:', error);
      return await storage.getUserById(userId);
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