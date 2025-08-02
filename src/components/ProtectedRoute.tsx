import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CreditCard, Clock } from "lucide-react";

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
    const checkAuthAndSubscription = async () => {
      try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          navigate('/login');
          return;
        }

        setUser(user);

        // If subscription is required, check subscription status
        if (requiresSubscription) {
          const { data: subscription, error: subError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (subError) {
            console.error('Error checking subscription:', subError);
            setHasValidSubscription(false);
          } else if (!subscription) {
            setHasValidSubscription(false);
          } else {
            // Check if subscription is active and not expired
            const isActive = subscription.status === 'active';
            const isNotExpired = !subscription.expires_at || new Date(subscription.expires_at) > new Date();
            setHasValidSubscription(isActive && isNotExpired);
          }
        } else {
          setHasValidSubscription(true);
        }
      } catch (error) {
        console.error('Error checking authentication/subscription:', error);
        toast({
          title: "Error",
          description: "Unable to verify access. Please try again.",
          variant: "destructive",
        });
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndSubscription();
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