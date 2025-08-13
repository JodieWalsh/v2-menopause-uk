import { useState, useEffect } from "react";
  import { Button } from "@/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Loader2, CreditCard, Shield } from "lucide-react";
  import { useToast } from "@/hooks/use-toast";
  import { supabase } from "@/integrations/supabase/client";

  interface StripePaymentFormProps {
    amount: number;
    discountCode?: string;
    onSuccess: () => void;
  }

  export function StripePaymentForm({ amount, discountCode, onSuccess }: StripePaymentFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handlePayment = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Starting payment process...");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          throw new Error("User not authenticated");
        }

        console.log("Creating payment session...");

        // Create Stripe Checkout Session
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            discountCode: discountCode || "",
          },
        });

        if (error) {
          console.error("Payment session error:", error);
          throw error;
        }

        console.log("Payment session response:", data);

        if (data?.checkout_session && data?.url) {
          console.log("Redirecting to Stripe Checkout:", data.url);

          toast({
            title: "Redirecting to Payment",
            description: "Opening secure payment window...",
          });

          // Redirect in the same window for professional experience
          setTimeout(() => {
            window.location.href = data.url;
          }, 1000);


          return;
        }

        throw new Error("Failed to create payment session");

      } catch (error: any) {
        console.error("Payment error:", error);
        setError(error.message || "Payment setup failed");

        toast({
          title: "Payment Error",
          description: error.message || "Failed to start payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    // Auto-start payment when component loads
    useEffect(() => {
      console.log("StripePaymentForm loaded, starting payment...");
      handlePayment();
    }, []);

    if (loading) {
      return (
        <Card className="card-gradient">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-y-4 flex-col">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-center">
                Setting up secure payment...
                <br />
                <small className="text-xs">You'll be redirected to Stripe in a moment</small>
              </p>
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
            <Button onClick={handlePayment} variant="outline" className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Fallback UI (shouldn't normally be seen since we auto-redirect)
    return (
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            Click below to proceed to secure payment
          </p>

          <Button
            onClick={handlePayment}
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Continue to Payment
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              Secure 256-bit SSL encryption
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }