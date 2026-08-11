import Stripe from 'stripe';
import { storage } from './storage';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '../shared/subscription-plans';

// Make Stripe optional for local development
const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;

if (!stripeEnabled) {
  console.log("⚠️  STRIPE_SECRET_KEY not set - Subscription features will be disabled in local development");
}

const stripe = stripeEnabled ? new Stripe(process.env.STRIPE_SECRET_KEY!) : null;

// Without a Stripe key, non-production environments simulate the flow so
// the app stays fully testable locally; production fails loudly instead.
const devSimulation = !stripeEnabled && process.env.NODE_ENV !== 'production';

export class StripeNotConfiguredError extends Error {
  constructor() {
    super('Payments are not configured. Set STRIPE_SECRET_KEY to enable subscriptions.');
    this.name = 'StripeNotConfiguredError';
  }
}

export class SubscriptionService {
  static isStripeEnabled() {
    return stripeEnabled;
  }

  // Helper to check if Stripe is enabled
  private static checkStripeEnabled() {
    if (!stripe || !stripeEnabled) {
      throw new StripeNotConfiguredError();
    }
  }

  // Create Stripe customer
  static async createCustomer(userId: string, email: string, name: string) {
    this.checkStripeEnabled();
    try {
      const customer = await stripe!.customers.create({
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
    const planDef = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!planDef) throw new Error('Plan not found');

    // Local development without a Stripe key: activate directly (simulated)
    if (devSimulation) {
      const user = await storage.getUserById(userId);
      if (!user) throw new Error('User not found');
      await storage.updateUserSubscription(userId, {
        subscriptionStatus: 'active',
        subscriptionPlan: planId,
        subscriptionEndDate: this.calculateEndDate(planDef),
      });
      console.log(`🧪 Dev mode: simulated subscription "${planId}" activated for ${user.email}`);
      return {
        devMode: true,
        subscriptionId: `dev_${Date.now()}`,
        clientSecret: null,
        status: 'active',
        paymentIntentId: null,
      };
    }

    this.checkStripeEnabled();
    try {
      const user = await storage.getUserById(userId);
      if (!user) throw new Error('User not found');

      // Check if user already has an active subscription for this plan
      if (user.stripeSubscriptionId && user.subscriptionStatus === 'active' && user.subscriptionPlan === planId) {
        throw new Error(`You already have an active ${planId} subscription`);
      }

      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await this.createCustomer(userId, user.email, `${user.firstName} ${user.lastName}`);
      }

      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      // Only cancel existing subscription if switching to different plan
      if (user.stripeSubscriptionId && user.subscriptionPlan !== planId) {
        try {
          const existingSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
            await stripe.subscriptions.cancel(user.stripeSubscriptionId);
            console.log('Cancelled existing subscription:', user.stripeSubscriptionId);
          }
        } catch (error) {
          console.warn('Could not cancel existing subscription:', error);
          // Continue anyway - it might already be cancelled
        }
      }

      // Create price if it doesn't exist (in production, create these manually in Stripe)
      const priceId = await this.getOrCreatePrice(plan);

      // Create subscription requiring immediate payment - NO trial period.
      // The client confirms the subscription's OWN invoice PaymentIntent, so
      // paying it activates the subscription (a detached PaymentIntent would
      // charge the card while the subscription stayed incomplete and lapsed).
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId,
          planId: planId
        }
      });

      const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
      const paymentIntent = (latestInvoice as any)?.payment_intent as Stripe.PaymentIntent | null;
      if (!paymentIntent?.client_secret) {
        throw new Error('Stripe did not return a payment intent for the subscription invoice');
      }

      // Tag the invoice PaymentIntent so completeSubscription can identify it
      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: { userId, planId, type: 'subscription_payment' }
      });

      // Update user subscription info  
      const currentPeriodEnd = (subscription as any).current_period_end;
      const subscriptionEndDate = currentPeriodEnd && typeof currentPeriodEnd === 'number' 
        ? new Date(currentPeriodEnd * 1000) 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days from now
        
      await storage.updateUserSubscription(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: 'incomplete', // Will be updated after successful payment
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
    this.checkStripeEnabled();
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

      // Paying the invoice PaymentIntent activates the subscription on
      // Stripe's side; just verify and mirror the state in our database.
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

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
    if (devSimulation) {
      const user = await storage.getUserById(userId);
      if (!user || user.subscriptionStatus !== 'active') {
        throw new Error('No active subscription found');
      }
      // In dev simulation the "paid period" isn't real, so access ends now;
      // the real Stripe path keeps access until the period the user paid for
      await storage.updateUserSubscription(userId, {
        subscriptionStatus: 'cancelled',
        subscriptionEndDate: new Date(),
      });
      console.log(`🧪 Dev mode: simulated subscription cancelled for ${user.email}`);
      return { id: user.stripeSubscriptionId ?? 'dev_subscription', status: 'canceled', devMode: true } as any;
    }

    this.checkStripeEnabled();
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
    if (!stripe || !stripeEnabled) {
      // Return user without syncing if Stripe is not configured
      return await storage.getUserById(userId);
    }
    try {
      const user = await storage.getUserById(userId);
      if (!user?.stripeSubscriptionId) return user;

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      const status = subscription.status === 'active' ? 'active' 
                   : subscription.status === 'canceled' ? 'cancelled' 
                   : subscription.status === 'trialing' ? 'pending'
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
    
    // Trial users get limited access (schema field is trialEndsAt)
    if (user.subscriptionStatus === 'trial') {
      const now = new Date();
      const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
      if (!trialEnd || now > trialEnd) return false;
      
      // Limited trial features
      const trialFeatures = ['avatar_builder', 'balloon_pop', 'basic_habits'];
      return trialFeatures.includes(feature);
    }

    // Active subscribers get full access
    if (user.subscriptionStatus === 'active') return true;

    // Cancelled subscribers keep access only until the period they paid for
    if (user.subscriptionStatus === 'cancelled') {
      const end = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;
      return !!end && new Date() < end;
    }

    return false;
  }

  // Get subscription status for user
  static getSubscriptionInfo(user: any) {
    const now = new Date();
    const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
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