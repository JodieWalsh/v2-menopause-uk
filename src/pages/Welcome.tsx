import { useState, useEffect, useRef } from "react";
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
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { market } = useMarket();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const initializePage = async () => {
      // Handle popup window
      if (window.opener && window.opener !== window) {
        try {
          window.opener.postMessage({ type: 'PAYMENT_SUCCESS', timestamp: Date.now() }, window.location.origin);
          setTimeout(() => window.close(), 1000);
          return;
        } catch (error) {
          setTimeout(() => window.close(), 2000);
        }
      }

      // Clean up URL params
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment_verified') === 'true') {
        window.history.replaceState({}, document.title, '/welcome');
      }

      // Simple auth check
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Load progress in background without blocking UI
        setTimeout(() => loadProgress(session.user.id), 0);
      } else {
        // No user found, redirect to auth
        navigate('/auth');
      }
    };

    initializePage();
  }, [navigate]);

  const loadProgress = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);
      
      const completedModules = data?.filter(p => p.completed)?.length || 0;
      const totalModules = 9; // module_1, module_2a, module_2b, module_2c, module_2d, module_3, module_4, module_5, module_6
      const progressPercentage = Math.min((completedModules / totalModules) * 100, 100);
      setProgress(progressPercentage);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleStartAssessment = () => {
    navigate('/consultation/module-1');
  };

  const handleContinueAssessment = () => {
    navigate('/consultation/summary');
  };

  // Set video to show frame at 1 second as the poster/thumbnail
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      // Seek to 1 second to show a better thumbnail frame
      videoRef.current.currentTime = 1;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const userName = user?.user_metadata?.first_name || 'there';
  const hasStartedAssessment = progress > 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Heart className="h-4 w-4" />
            Welcome
          </div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
            Welcome {userName}! 👋
          </h1>
          <p className="text-xl text-muted-foreground">
            You're all set to begin your personalized menopause consultation preparation.
          </p>
        </div>

        {/* Video Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Quick Introduction Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                controls
                preload="metadata"
                onLoadedMetadata={handleVideoLoadedMetadata}
                className="w-full h-full object-cover"
              >
                <source src={market.videos.welcome} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              This quick video will help you understand what to expect during your assessment.
            </p>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Assessment Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
            
            {hasStartedAssessment ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Great progress! You can continue where you left off or review your responses.
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleContinueAssessment} className="flex-1">
                    Continue Assessment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/consultation/summary')}
                    className="flex-1"
                  >
                    Review Responses
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Ready to start? Your comprehensive menopause assessment will take about 30 minutes to complete.
                </p>
                <Button onClick={handleStartAssessment} size="lg" className="w-full">
                  Start Your Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>What to Expect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">📝 Comprehensive Assessment</h3>
                <p className="text-sm text-muted-foreground">
                  We'll ask about your symptoms, medical history, and health goals to create a complete picture.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">📋 Personalized Report</h3>
                <p className="text-sm text-muted-foreground">
                  You'll receive a detailed report to take to your doctor appointment.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">⏰ Take Your Time</h3>
                <p className="text-sm text-muted-foreground">
                  You can save your progress and come back anytime. No need to rush!
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🔒 Secure & Private</h3>
                <p className="text-sm text-muted-foreground">
                  Your information is encrypted and stored securely. We respect your privacy completely.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Welcome;