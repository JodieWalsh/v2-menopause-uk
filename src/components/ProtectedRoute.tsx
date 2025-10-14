import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CreditCard, Clock } from "lucide-react";

// Simple cache to avoid repeated subscription checks
const subscriptionCache = new Map<string, { hasValid: boolean; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

interface ProtectedRouteProps {
  children: ReactNode;
  requiresSubscription?: boolean;
}

export function ProtectedRoute({ children, requiresSubscription = true }: ProtectedRouteProps) {
  const [user, setUser] = useState(null);
  const [hasValidSubscription, setHasValidSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const checkAuthAndSubscription = async () => {
      try {
        // Use faster getSession instead of getUser
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        const user = session?.user;
        
        console.log("🔵 ProtectedRoute: Auth check result:", {
          hasUser: !!user,
          userEmail: user?.email,
          authError: authError?.message,
          currentPath: window.location.pathname
        });
        
        if (authError || !user) {
          console.log("🔴 ProtectedRoute: No authenticated user, redirecting to /login");
          if (mounted) {
            navigate('/login');
          }
          return;
        }

        if (mounted) {
          setUser(user);
        }

        // If subscription is required, check subscription status with caching
        if (requiresSubscription && mounted) {
          const cacheKey = `sub_${user.id}`;
          const cached = subscriptionCache.get(cacheKey);
          
          // Use cached result if available and fresh
          if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            console.log('Using cached subscription status:', cached.hasValid);
            setHasValidSubscription(cached.hasValid);
          } else {
            // Fetch fresh subscription data
            const { data: subscription, error: subError } = await supabase
              .from('user_subscriptions')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();

            if (subError) {
              console.error('Error checking subscription:', subError);
            }

            if (mounted) {
              if (!subscription) {
                console.log('No subscription found for user:', user.id);
                setHasValidSubscription(false);
              } else {
                // Check if subscription is active and not expired
                const isActive = subscription.status === 'active';
                const isNotExpired = !subscription.expires_at || new Date(subscription.expires_at) > new Date();
                
                // TEMPORARY FIX: Also accept recent pending subscriptions (within last 10 minutes)
                // This handles the case where webhook hasn't processed the payment yet
                const isPendingRecent = subscription.status === 'pending' && 
                  subscription.created_at && 
                  new Date(subscription.created_at) > new Date(Date.now() - 10 * 60 * 1000);
                
                const hasValidAccess = (isActive || isPendingRecent) && isNotExpired;
                
                console.log('Subscription check:', { 
                  isActive, 
                  isPendingRecent, 
                  isNotExpired, 
                  hasValidAccess, 
                  subscription 
                });
                
                setHasValidSubscription(hasValidAccess);
                
                // Cache the result
                subscriptionCache.set(cacheKey, {
                  hasValid: hasValidAccess,
                  timestamp: Date.now()
                });
                
                // Show toast for pending subscriptions
                if (isPendingRecent && !isActive) {
                  toast({
                    title: "Payment Received! 🎉",
                    description: "Your payment is being processed. You have full access to the assessment.",
                    variant: "default",
                  });
                }
              }
            }
          }
        } else if (mounted) {
          setHasValidSubscription(true);
        }
      } catch (error) {
        console.error('Error checking authentication/subscription:', error);
        if (mounted) {
          toast({
            title: "Error",
            description: "Unable to verify access. Please try again.",
            variant: "destructive",
          });
          navigate('/login');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuthAndSubscription();

    return () => {
      mounted = false;
    };
  }, [navigate, requiresSubscription, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Clock className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (requiresSubscription && !hasValidSubscription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Subscription Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You need an active subscription to access the consultation modules. 
              Please complete your payment to get started.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/payment')} 
                className="w-full"
                size="lg"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Complete Payment
              </Button>
              <Button 
                onClick={() => navigate('/welcome')} 
                variant="outline"
                className="w-full"
              >
                Back to Welcome
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}