import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, CreditCard } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Please check your payment details and try again.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Payment succeeded without redirect
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful!",
          description: "Completing your subscription activation...",
        });
        
        // Complete subscription activation
        try {
          const response = await apiRequest("POST", "/api/subscription/complete", { 
            paymentIntentId: paymentIntent.id 
          });
          
          if (response.ok) {
            // Navigate to success page programmatically
            setLocation('/premium-success?payment_intent=' + paymentIntent.id + '&redirect_status=succeeded');
          } else {
            throw new Error('Failed to complete subscription');
          }
        } catch (completionError) {
          console.error('Failed to complete subscription:', completionError);
          toast({
            title: "Payment Succeeded",
            description: "But there was an issue activating your subscription. Please contact support.",
            variant: "destructive",
          });
        }
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error", 
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-4 border-coral">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-coral rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-fredoka text-2xl text-gray-800 mb-2">Complete Your Payment</h1>
            <p className="text-gray-600 text-sm">Secure payment powered by Stripe</p>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <PaymentElement />
            </div>
            
            <div className="flex gap-3">
              <Link href="/subscription" className="flex-1">
                <Button 
                  type="button" 
                  className="w-full super-button"
                  disabled={isProcessing}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={!stripe || !elements || isProcessing}
                className="flex-1 super-button"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Complete Payment"
                )}
              </Button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              🔒 Your payment information is secure and encrypted
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function PremiumCheckout() {
  const [clientSecret, setClientSecret] = useState<string>("");
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const secret = urlParams.get('client_secret');
    
    if (secret) {
      setClientSecret(secret);
    }
  }, []);

  if (!clientSecret) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="font-fredoka text-xl mb-4">Payment session not found</h2>
          <Link href="/subscription">
            <Button className="bg-coral hover:bg-coral/80 text-white">
              Back to Subscription Plans
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  );
}