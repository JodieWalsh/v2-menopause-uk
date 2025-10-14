import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Play, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { useMarket } from "@/contexts/MarketContext";

const Welcome = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Start with false for instant loading
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { market } = useMarket();

  useEffect(() => {
    const quickAuthCheck = async () => {
      // Handle popup window (fast path)
      if (window.opener && window.opener !== window) {
        try {
          window.opener.postMessage({
            type: 'PAYMENT_SUCCESS',
            timestamp: Date.now()
          }, window.location.origin);
          
          setTimeout(() => window.close(), 1000);
          return;
        } catch (error) {
          setTimeout(() => window.close(), 2000);
        }
      }
      
      // Clean up URL params quickly
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment_verified') === 'true') {
        window.history.replaceState({}, document.title, '/welcome');
      }
      
      // Simple auth check - no retry, no delays
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Load progress in background (non-blocking)
        loadProgress();
      }
      // If no user found, that's OK - the page can still load
      console.log("Welcome page: Quick auth check completed");
                });
              } else {
                console.log("Welcome page: No subscription found after retries");
                setLoading(false);
                
                toast({
                  title: "Payment Processing",
                  description: "Your payment is being processed. Please refresh in a moment or contact support if this persists.",
                  variant: "default",
                });
              }
              return;
            } else {
              console.log("Welcome page: Session restoration failed:", signInError);
              // Clear invalid credentials
              localStorage.removeItem('payment_user_email');
              localStorage.removeItem('payment_user_password');
            }
          } catch (restoreError) {
            console.log("Welcome page: Session restoration error:", restoreError);
            // Clear credentials on error
            localStorage.removeItem('payment_user_email');
            localStorage.removeItem('payment_user_password');
          }
        }
        
        console.log("Welcome page: No authenticated user after retries, redirecting to auth");
        navigate('/auth');
      }
    };

    // Set up auth state listener to handle session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log("Welcome page: Auth state changed:", event, session?.user?.email);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log("Welcome page: User signed out, redirecting to auth");
        navigate('/auth');
      } else if (event === 'SIGNED_IN' && session.user) {
        console.log("Welcome page: User signed in:", session.user.email);
        setUser(session.user);
        
        // Check if this might be a post-payment sign-in
        const isPostPayment = localStorage.getItem('payment_user_email') === session.user.email;
        
        if (isPostPayment) {
          console.log("Welcome page: Post-payment sign-in detected, checking subscription...");
          const subscription = await checkSubscriptionWithRetry(session.user.id);
          
          if (subscription) {
            console.log("Welcome page: Subscription confirmed for signed-in user");
            await loadProgress();
            setLoading(false);
            
            toast({
              title: "Welcome! 🎉",
              description: "Your subscription is active. You can start your assessment.",
              variant: "default",
            });
          } else {
            console.log("Welcome page: No subscription found for signed-in user");
            setLoading(false);
          }
        } else {
          // Normal sign-in, load progress normally
          await loadProgress();
          setLoading(false);
        }
      } else if (event === 'TOKEN_REFRESHED' && session.user) {
        console.log("Welcome page: Token refreshed:", session.user.email);
        setUser(session.user);
        setLoading(false);
      }
    });

    checkAuthWithRetry();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const loadProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (error) throw error;
      
      const completedModules = data?.filter(p => p.completed)?.length || 0;
      const totalModules = 3;
      setProgress((completedModules / totalModules) * 100);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const checkSubscriptionWithRetry = async (userId: string, maxAttempts: number = 10) => {
    console.log(`🔍 Checking subscription for user: ${userId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📋 Attempt ${attempt}: Querying user_subscriptions table...`);
        
        // First, let's check ALL subscriptions for this user (not just active ones)
        const { data: allSubs, error: allError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId);

        console.log(`📊 All subscriptions for user ${userId}:`, allSubs);
        console.log(`❌ Query error (if any):`, allError);

        // Check for active subscriptions
        const { data: activeSub, error: activeError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        console.log(`✅ Active subscription query result:`, activeSub);
        console.log(`❌ Active subscription error:`, activeError);

        if (activeSub && !activeError) {
          console.log(`🎉 Active subscription found on attempt ${attempt}:`, activeSub);
          return activeSub;
        }

        // TEMPORARY FIX: Also accept pending subscriptions that are recent (within last 10 minutes)
        // This handles the case where webhook hasn't processed the payment yet
        const { data: recentPendingSub, error: recentPendingError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
          .single();

        console.log(`⏳ Recent pending subscription:`, recentPendingSub);

        if (recentPendingSub && !recentPendingError) {
          console.log(`🎉 Recent pending subscription found on attempt ${attempt} - granting access:`, recentPendingSub);
          
          // Grant access but show a note about processing
          toast({
            title: "Payment Received! 🎉",
            description: "Your payment is being processed. You have full access to the assessment.",
            variant: "default",
          });
          
          return recentPendingSub;
        }

        // Also check for pending subscriptions that might exist
        const { data: pendingSub, error: pendingError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .single();

        console.log(`⏳ Pending subscription:`, pendingSub);
        if (pendingSub) {
          console.log(`⏳ Found pending subscription, continuing to wait for activation...`);
        }

        if (activeError && activeError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error(`❌ Subscription check error on attempt ${attempt}:`, activeError);
        } else {
          console.log(`🔍 No active subscription found on attempt ${attempt}`);
        }

        // Wait before retrying (progressive backoff)
        if (attempt < maxAttempts) {
          const waitTime = Math.min(attempt * 1000, 5000); // Max 5 seconds
          console.log(`⏰ Waiting ${waitTime}ms before subscription retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

      } catch (error) {
        console.error(`💥 Subscription check failed on attempt ${attempt}:`, error);
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    console.log(`❌ No subscription found after ${maxAttempts} attempts`);
    return null;
  };

  const handleStartConsultation = () => {
    navigate('/consultation/module-1');
  };

  if (loading) {
    return (
      <Layout>
        <div className="section-padding flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your consultation...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-padding">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
            Welcome, {user?.user_metadata?.first_name || user?.email}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            You're now ready to start your journey to an empowered doctor's visit. 
            We'll guide you through a series of questions to help you prepare.
          </p>
        </div>

        {/* Welcome Video Placeholder */}
        <Card className="card-gradient mb-6 sm:mb-8">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-serif text-center text-lg sm:text-xl">Welcome Message</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <video
              className="w-full rounded-lg aspect-video"
              controls
              preload="metadata"
              playsInline
              onLoadedMetadata={(e) => {
                const video = e.target as HTMLVideoElement;
                video.currentTime = 0.2;
              }}
            >
              <source src={market.videos.welcome} type="video/mp4" />
              <p className="text-center p-8 text-muted-foreground">
                Your browser does not support the video tag.
              </p>
            </video>
          </CardContent>
        </Card>

        {/* Introductory Text */}
        <Card className="card-gradient mb-6 sm:mb-8">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-serif text-center text-lg sm:text-xl">
              Menopause Basics
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none p-4 sm:p-6">
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              For more information on menopause, here are three dependable sources.
            </p>

            <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
              <div className="bg-primary/10 p-4 sm:p-6 rounded-lg">
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">Balance Menopause</h4>
                <p className="text-sm sm:text-base text-muted-foreground mb-2">
                  This is a British site with a great layout and easy to read information.
                </p>
                <a 
                  href="https://www.balance-menopause.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline text-sm sm:text-base"
                >
                  www.balance-menopause.com
                </a>
              </div>
              
              <div className="bg-primary/10 p-4 sm:p-6 rounded-lg">
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">Jean Hailles</h4>
                <p className="text-sm sm:text-base text-muted-foreground mb-2">
                  An Australian based site with strong evidence based ethos.
                </p>
                <a 
                  href="https://www.jeanhailes.org.au" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline text-sm sm:text-base"
                >
                  www.jeanhailes.org.au
                </a>
              </div>
              
              <div className="bg-primary/10 p-4 sm:p-6 rounded-lg">
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">Australian Menopause Society</h4>
                <p className="text-sm sm:text-base text-muted-foreground mb-2">
                  Also Australian and very evidence based organisation. They even have studies that you can join!
                </p>
                <a 
                  href="https://www.menopause.org.au" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline text-sm sm:text-base"
                >
                  www.menopause.org.au
                </a>
              </div>
            </div>

            <div className="bg-muted p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
              <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2">Fun Facts About Menopause</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>• Did you know some women don't even notice they've hit menopause?</li>
                <li>• The term "menopause" comes from Greek—"men" meaning month and "pause" meaning stop.</li>
                <li>• Some animals don't experience menopause at all—like elephants or whales!</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Button 
            onClick={handleStartConsultation}
            variant="hero" 
            size="lg" 
            className="w-full sm:w-auto sm:min-w-80 touch-target"
          >
            Start Your Consultation
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-xs sm:text-sm text-muted-foreground mt-4">
            This guided assessment will take approximately 45 minutes to complete
          </p>
        </div>
        </div>
      </div>
    </Layout>
  );
};

export default Welcome;