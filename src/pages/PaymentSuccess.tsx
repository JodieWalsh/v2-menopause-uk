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

  // Debug logging
  console.log("🟢 PaymentSuccess component loaded");
  console.log("🟢 Current URL search params:", searchParams.toString());
  console.log("🟢 Session ID from URL:", searchParams.get('session_id'));
  console.log("🟢 Current window location:", window.location.href);

  useEffect(() => {
    const verifyPayment = async () => {
      console.log("🟢 PaymentSuccess useEffect triggered");
      
      const sessionId = searchParams.get('session_id');
      const paymentIntentId = searchParams.get('payment_intent');
      const freeAccess = searchParams.get('free_access');
      
      console.log("🟢 Payment parameters:", { sessionId, paymentIntentId, freeAccess });
      
      // IMMEDIATE SIGN-IN ATTEMPT for paid users
      if (sessionId) {
        console.log("🟢 Attempting immediate sign-in with stored credentials");
        const storedEmail = localStorage.getItem('temp_user_email');
        const storedPassword = localStorage.getItem('temp_user_password');
        
        if (storedEmail && storedPassword) {
          try {
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
              email: storedEmail,
              password: storedPassword,
            });
            
            if (!signInError && authData.user) {
              console.log("🟢 Immediate sign-in successful:", authData.user.email);
              localStorage.removeItem('temp_user_email');
              localStorage.removeItem('temp_user_password');
              
              // Skip complex polling, just redirect to welcome
              setVerified(true);
              setVerifying(false);
              toast({
                title: "Payment Successful!",
                description: "Welcome! Redirecting to your assessment...",
              });
              
              setTimeout(() => {
                navigate('/welcome');
              }, 1000);
              return;
            } else {
              console.log("🟢 Immediate sign-in failed, proceeding with polling");
            }
          } catch (error) {
            console.log("🟢 Immediate sign-in error, proceeding with polling:", error);
          }
        }
      }
      
      // Handle free access case
      if (freeAccess === 'true') {
        setVerified(true);
        
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
      
      // Handle Stripe Checkout Session - wait for webhook processing
      if (sessionId) {
        try {
          // With create-checkout-v2, users are created by webhook after payment
          // We need to wait for both user creation and subscription creation

          console.log("PaymentSuccess: Waiting for webhook to process payment and create user...");
          
          let attempts = 0;
          const maxAttempts = 40; // 40 seconds max wait (increased)
          
          const pollForSubscription = async (): Promise<{hasSubscription: boolean, userId?: string}> => {
            // First try to find by session ID
            let { data: subscription } = await supabase
              .from('user_subscriptions')
              .select('user_id, stripe_session_id, created_at')
              .eq('stripe_session_id', sessionId)
              .single();
              
            // If not found by session ID, try to find recent subscription for stored email
            if (!subscription) {
              const storedEmail = localStorage.getItem('temp_user_email');
              if (storedEmail) {
                console.log(`PaymentSuccess: No subscription found by session ID, trying email: ${storedEmail}`);
                
                // Look for recent subscription (within last 5 minutes) for this email
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
                
                const { data: userResult } = await supabase.auth.admin.listUsers();
                const user = userResult?.users?.find(u => u.email === storedEmail);
                
                if (user) {
                  const { data: recentSub } = await supabase
                    .from('user_subscriptions')
                    .select('user_id, stripe_session_id, created_at')
                    .eq('user_id', user.id)
                    .gte('created_at', fiveMinutesAgo)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                    
                  subscription = recentSub;
                }
              }
            }
              
            console.log(`PaymentSuccess: Poll attempt ${attempts + 1}, subscription found:`, !!subscription, subscription?.stripe_session_id);
              
            return {
              hasSubscription: !!subscription,
              userId: subscription?.user_id
            };
          };
          
          // Wait longer for webhook to process (5 seconds)
          console.log("PaymentSuccess: Initial wait for webhook processing...");
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          while (attempts < maxAttempts) {
            const {hasSubscription, userId} = await pollForSubscription();
            
            if (hasSubscription && userId) {
              console.log("PaymentSuccess: Found subscription and user ID:", userId);
              
              // Try to get stored credentials from localStorage (from registration)
              const storedEmail = localStorage.getItem('temp_user_email');
              const storedPassword = localStorage.getItem('temp_user_password');
              
              console.log("PaymentSuccess: Stored credentials check:", { 
                hasEmail: !!storedEmail, 
                hasPassword: !!storedPassword,
                email: storedEmail 
              });
              
              if (storedEmail && storedPassword) {
                console.log("PaymentSuccess: Attempting to sign in user:", storedEmail);
                
                try {
                  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: storedEmail,
                    password: storedPassword,
                  });
                  
                  if (!signInError && authData.user) {
                    console.log("PaymentSuccess: User signed in successfully:", authData.user.email);
                    localStorage.removeItem('temp_user_email'); // Clean up
                    localStorage.removeItem('temp_user_password'); // Clean up
                  } else {
                    console.error("PaymentSuccess: Sign in failed:", signInError?.message || "Unknown error");
                    // Don't fail completely - let them continue to welcome page anyway
                  }
                } catch (authError) {
                  console.error("PaymentSuccess: Auth error:", authError);
                  // Don't fail completely - let them continue to welcome page anyway
                }
              } else {
                console.log("PaymentSuccess: No stored credentials found");
                // This might happen if user refreshed page or credentials were lost
                // We can still redirect to welcome page and let them sign in manually
              }
              
              setVerified(true);
              toast({
                title: "Payment Processed!",
                description: "Redirecting to your assessment...",
              });
              
              // Check final auth state before redirect
              const { data: finalAuthCheck } = await supabase.auth.getUser();
              console.log("PaymentSuccess: Final auth check before redirect:", {
                isAuthenticated: !!finalAuthCheck.user,
                userEmail: finalAuthCheck.user?.email
              });
              
              // Auto-redirect to welcome page after 2 seconds
              setTimeout(() => {
                console.log("PaymentSuccess: Redirecting to /welcome");
                navigate('/welcome');
              }, 2000);
              break;
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          }
          
          if (attempts >= maxAttempts) {
            toast({
              title: "Processing Payment",
              description: "Payment is being processed. You can proceed to your assessment.",
            });
            setVerified(true);
            setTimeout(() => {
              navigate('/welcome');
            }, 2000);
          }
        } catch (error) {
          console.error('Payment processing error:', error);
          toast({
            title: "Payment Processing",
            description: "Your payment is being processed. You can proceed to your assessment.",
          });
          setVerified(true);
          setTimeout(() => {
            navigate('/welcome');
          }, 2000);
        }
      }
      // Handle Payment Intent (direct payment without discount)
      else if (paymentIntentId) {
        try {
          const { data, error } = await supabase.functions.invoke('confirm-payment', {
            body: { payment_intent_id: paymentIntentId }
          });

          if (error) throw error;

          if (data?.success) {
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
          console.error('Payment intent verification error:', error);
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