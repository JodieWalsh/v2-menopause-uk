import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Initialize Stripe with your live publishable key
const stripePromise = loadStripe("pk_live_51RlQthATHqCGypnRfAeJWQpjmMYpyjfqSvaad1SJadYKtWIrBsPyY4h0CFJ3E2K9YO3WSitqNn8jThNxsBqPnKcU00hQc5hKAU");

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}

function PaymentForm({ clientSecret, amount, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        console.error("Payment failed:", error);
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded' && !hasConfirmed) {
        setHasConfirmed(true); // Prevent double confirmation
        console.log("Payment succeeded:", paymentIntent.id);
        
        // Only confirm payment on our backend - this will handle subscription creation and welcome email
        const { data, error: confirmError } = await supabase.functions.invoke('confirm-payment', {
          body: { payment_intent_id: paymentIntent.id }
        });

        if (confirmError) {
          console.error("Payment confirmation error:", confirmError);
          setHasConfirmed(false); // Allow retry on error
          toast({
            title: "Payment Verification Failed",
            description: "Payment succeeded but verification failed. Please contact support.",
            variant: "destructive",
          });
        } else if (data?.verified) {
          console.log("Payment successful - redirecting to welcome page");
          toast({
            title: "Payment Successful!",
            description: "Your subscription has been activated. Redirecting to your assessment...",
          });
          
          // Small delay to let the user see the success message
          setTimeout(() => {
            navigate('/welcome');
            onSuccess();
          }, 1500);
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement 
          options={{
            layout: "tabs",
            paymentMethodOrder: ['card', 'paypal'],
          }}
        />
      </div>
      
      <div className="pt-4 border-t">
        <Button 
          type="submit" 
          disabled={!stripe || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay £{(amount / 100).toFixed(2)} GBP
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
        <Shield className="h-5 w-5 text-primary" />
        <span className="text-sm text-muted-foreground">
          Secure 256-bit SSL encryption
        </span>
      </div>
    </form>
  );
}

interface StripePaymentFormProps {
  amount: number;
  discountCode?: string;
  onSuccess: () => void;
}

export function StripePaymentForm({ amount, discountCode, onSuccess }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    createPaymentIntent();
  }, [amount, discountCode]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error("User not authenticated");
      }

      // Handle free access
      if (amount === 0) {
        toast({
          title: "Free Access Granted!",
          description: "You have been granted free access. Redirecting to your assessment...",
        });
        setTimeout(() => {
          navigate('/welcome');
          onSuccess();
        }, 1500);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount,
          email: user.email,
          discountCode: discountCode || "",
        },
      });

      if (error) throw error;

      if (data?.free_access) {
        toast({
          title: "Free Access Granted!",
          description: "You have been granted free access. Redirecting to your assessment...",
        });
        setTimeout(() => {
          navigate('/welcome');
          onSuccess();
        }, 1500);
        return;
      }

      // If using Checkout Session (discount codes)
      if (data?.checkout_session && data?.url) {
        toast({
          title: "Redirecting to Payment",
          description: "Opening secure payment window...",
        });
        
        // Open Stripe checkout in new tab - Stripe will handle redirect back to success page
        window.open(data.url, '_blank');
        return;
      }

      // PaymentIntent flow (no discount)
      if (data?.client_secret) {
        setClientSecret(data.client_secret);
      } else {
        throw new Error("No client secret received");
      }
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      setError(error.message || "Failed to initialize payment");
      toast({
        title: "Payment Setup Error",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="card-gradient">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-y-4 flex-col">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Setting up secure payment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="text-destructive">Payment Setup Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={createPaymentIntent} variant="outline" className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return null;
  }

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: 'hsl(var(--primary))',
        colorBackground: 'hsl(var(--background))',
        colorText: 'hsl(var(--foreground))',
        colorDanger: 'hsl(var(--destructive))',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '6px',
      },
    },
  };

  return (
    <Card className="card-gradient">
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Secure Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={stripeOptions}>
          <PaymentForm 
            clientSecret={clientSecret} 
            amount={amount} // Amount in pounds, will be converted to pence for display
            onSuccess={onSuccess}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}