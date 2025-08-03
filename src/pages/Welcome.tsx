import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Play, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";

const Welcome = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const checkAuthWithRetry = async () => {
      console.log("Welcome page: checking authentication with retry...");
      
      // First try to get existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        console.log("Welcome page: Found existing session:", session.user.email);
        setUser(session.user);
        await loadProgress();
        setLoading(false);
        return;
      }
      
      // Try multiple times to get the user - sometimes it takes a moment after external redirect
      for (let attempt = 1; attempt <= 8; attempt++) {
        if (!mounted) return;
        
        console.log(`Welcome page: Auth check attempt ${attempt}`);
        
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log(`Welcome page attempt ${attempt}: user data:`, user, "error:", error);
        
        if (user && !error && mounted) {
          console.log("Welcome page: User authenticated:", user.email);
          setUser(user);
          await loadProgress();
          setLoading(false);
          return;
        }
        
        // Wait a bit before retrying (except on last attempt)
        if (attempt < 8) {
          console.log(`Welcome page: Waiting before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      if (mounted) {
        console.log("Welcome page: No authenticated user after retries, redirecting to login");
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
        await loadProgress();
        setLoading(false);
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
              <source src="https://oconnpquknkpxmcoqvmo.supabase.co/storage/v1/object/public/videos-tep//Welcome%20Menopause%20Australia%20descript%20video.mp4" type="video/mp4" />
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