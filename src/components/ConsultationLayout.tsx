import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ConsultationLayout = ({ children, currentModule, onNext, onPrevious, onSave, canGoNext, canGoPrevious }) => {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
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

    loadProgress();
  }, [currentModule]);

  const handleSave = async () => {
    try {
      await onSave();
      toast({
        title: "Progress Saved",
        description: "Your answers have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getModuleTitle = (module) => {
    switch (module) {
      case 'symptoms':
        return 'Module 1: Symptoms';
      case 'history':
        return 'Module 2: Past Medical History & Other Concerns';
      case 'finalizing':
        return 'Module 3: Finalizing';
      default:
        return 'Consultation';
    }
  };

  return (
    <div className="min-h-screen bg-background section-padding relative">
      <div className="container-wellness max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-serif font-semibold text-foreground">
              The Empowered Patient
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            {getModuleTitle(currentModule)}
          </h1>
          
          {/* Progress Indicator */}
          <div className="max-w-md mx-auto mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Overall Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Module Content */}
        <Card className="card-gradient mb-8">
          <CardContent className="p-6">
            {children}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/welcome')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Welcome</span>
            </Button>
            
            {canGoPrevious && (
              <Button
                variant="outline"
                onClick={onPrevious}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
            )}
          </div>

          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={handleSave}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Progress</span>
            </Button>
            
            {canGoNext && (
              <Button
                variant="hero"
                onClick={async () => {
                  try {
                    await onNext();
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to proceed to next step. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationLayout;