import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Clock, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      const freeAccess = searchParams.get('free_access');
      
      // Handle free access case
      if (freeAccess === 'true') {
        setVerified(true);
        
        // Send welcome email for free access users
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              email: 'guest@example.com', // Default for free access, or get from auth if available
              firstName: '',
              isPaid: false
            }
          });
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
        }
        
        toast({
          title: "Free Access Granted!",
          description: "Redirecting to your assessment...",
        });
        setVerifying(false);
        
        // Auto-redirect to welcome page after 2 seconds
        setTimeout(() => {
          navigate('/welcome');
        }, 2000);
        return;
      }
      
      if (sessionId) {
        try {
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: { session_id: sessionId }
          });

          if (error) throw error;

          if (data?.verified) {
            setVerified(true);
            toast({
              title: "Payment Verified!",
              description: "Redirecting to your assessment...",
            });
            
            // Auto-redirect to welcome page after 2 seconds
            setTimeout(() => {
              navigate('/welcome');
            }, 2000);
          } else {
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support if payment was completed.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          toast({
            title: "Verification Error",
            description: "Unable to verify payment. Please contact support.",
            variant: "destructive",
          });
        }
      }
      
      setVerifying(false);
    };

    verifyPayment();
  }, [searchParams, toast, navigate]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center py-8">
            <Clock className="h-16 w-16 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground text-center">
              Please wait while we verify your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background section-padding">
      <div className="container-wellness max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-serif font-semibold text-foreground">
              The Empowered Patient
            </span>
          </div>
        </div>

        <Card className="card-gradient">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-serif font-bold text-foreground mb-2">
              Payment Successful!
            </CardTitle>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your account has been activated.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>You now have 12 months access to the assessment tool</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>A confirmation email has been sent to your email address</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>You can begin your assessment immediately</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={() => navigate('/welcome')}
                variant="hero" 
                size="lg" 
                className="w-full"
              >
                Start Your Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
                variant="outline" 
                size="lg" 
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;