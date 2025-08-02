import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/ModuleLayout";
import { TextQuestion } from "@/components/QuestionComponents";
import { useToast } from "@/hooks/use-toast";

interface Responses {
  [key: string]: string;
}

export default function Module2b() {
  const [responses, setResponses] = useState<Responses>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const questions = [
    {
      id: "last_menstrual_period",
      question: "Do you know the date of the start of your last menstrual period? Please note this down. If not, give an estimate of a month and a year.",
    },
    {
      id: "period_changes",
      question: "If you are still having periods, have they changed? Are the periods heavier?",
    },
    {
      id: "contraception",
      question: "What contraception are you currently using? How are you finding it.",
    },
    {
      id: "last_cervical_screening",
      question: "What is the date of your last cervical screening?",
    },
    {
      id: "endometriosis",
      question: "Have you ever been diagnosed with endometriosis? If so, what treatment did you receive?",
    },
    {
      id: "pcos",
      question: "Have you ever been diagnosed with polycystic ovarian syndrome? If so, what treatment did you receive?",
    },
    {
      id: "gynaecological_procedures",
      question: "Have you had any gynaecological procedures? Hysterectomy? Surgery for fallopian tube removal or ovarian cyst management? Hysteroscopy? For what reasons?",
    },
    {
      id: "pregnancies",
      question: "How many pregnancies did you have?",
    },
    {
      id: "delivery_dates",
      question: "What are the dates of your deliveries?",
    },
    {
      id: "other_gynaecological",
      question: "Any other relevant gynaecological information?",
    },
    {
      id: "menopause_family_history",
      question: "Do you know the age at which your mother or sisters started their menopause journey?",
    }
  ];

  useEffect(() => {
    loadExistingResponses();
  }, []);

  const loadExistingResponses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_responses')
        .select('question_id, response_value')
        .eq('user_id', user.id)
        .eq('module_name', 'module_2b');

      if (error) {
        console.error('Error loading responses:', error);
        return;
      }

      const existingResponses: Responses = {};
      data?.forEach((response) => {
        existingResponses[response.question_id] = response.response_value || '';
      });
      setResponses(existingResponses);
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveResponses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to continue",
          variant: "destructive"
        });
        return false;
      }

      // Save each response
      for (const [questionId, value] of Object.entries(responses)) {
        if (!value) continue; // Skip empty responses

        const { error } = await supabase
          .from('user_responses')
          .upsert({
            user_id: user.id,
            module_name: 'module_2b',
            question_id: questionId,
            response_value: value,
            response_type: 'text'
          }, {
            onConflict: 'user_id,question_id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('Error saving response:', error);
          toast({
            title: "Error",
            description: "Failed to save some responses. Please try again.",
            variant: "destructive"
          });
          return false;
        }
      }

      // Mark module as completed
      const { error: progressError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          module_name: 'module_2b',
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,module_name',
          ignoreDuplicates: false
        });

      if (progressError) {
        console.error('Error updating progress:', progressError);
      }

      return true;
    } catch (error) {
      console.error('Error saving responses:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleNext = async () => {
    setIsLoading(true);
    const success = await saveResponses();
    if (success) {
      navigate('/consultation/module-2c');
    }
    setIsLoading(false);
  };

  const handlePrevious = () => {
    navigate('/consultation/module-2a');
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const InfoBox = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6">
      <div className="text-sm text-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );

  return (
    <ModuleLayout
      title="Gynaecological History"
      onNext={handleNext}
      onPrevious={handlePrevious}
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {questions.slice(0, 3).map((question) => (
          <TextQuestion
            key={question.id}
            questionId={question.id}
            question={question.question}
            value={responses[question.id] || ''}
            onChange={(value) => handleResponseChange(question.id, value)}
            maxLength={1000}
          />
        ))}
        
        <TextQuestion
          questionId="last_cervical_screening"
          question="What is the date of your last cervical screening?"
          value={responses["last_cervical_screening"] || ''}
          onChange={(value) => handleResponseChange("last_cervical_screening", value)}
          maxLength={1000}
        />
        
        <InfoBox>
          Please note that if you have not had a cervical screening (what we used to call a pap smear) in the past 5 years then ensure you tell the medical receptionist this at the time of booking the appointment so that they can allow time and resources for this to be done on the day. This will again save you coming back another day!
        </InfoBox>

        {questions.slice(4).map((question) => (
          <TextQuestion
            key={question.id}
            questionId={question.id}
            question={question.question}
            value={responses[question.id] || ''}
            onChange={(value) => handleResponseChange(question.id, value)}
            maxLength={1000}
          />
        ))}
      </div>
    </ModuleLayout>
  );
}