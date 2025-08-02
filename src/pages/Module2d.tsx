import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/ModuleLayout";
import { TextQuestion } from "@/components/QuestionComponents";
import { useToast } from "@/hooks/use-toast";

interface Responses {
  [key: string]: string;
}

export default function Module2d() {
  const [responses, setResponses] = useState<Responses>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const questions = [
    {
      id: "blood_clot_history",
      question: "Have you ever had a blood clot? If so, please give details.",
      section: "Cardiovascular Health"
    },
    {
      id: "cardiovascular_conditions",
      question: "Have you ever been diagnosed with high blood pressure, high cholesterol or had a stroke?",
      section: "Cardiovascular Health"
    },
    {
      id: "family_heart_disease",
      question: "Do you or any of your family have a history of heart disease? If so, please give details.",
      section: "Cardiovascular Health"
    },
    {
      id: "osteoporosis_diagnosis",
      question: "Have you been diagnosed with osteoporosis?",
      section: "Bone Health"
    },
    {
      id: "bone_fractures",
      question: "Have you ever had a bone fracture which occurred without a serious accident or fall?",
      section: "Bone Health"
    },
    {
      id: "bone_density_screening",
      question: "Have you ever had a bone density screening?",
      section: "Bone Health"
    },
    {
      id: "family_osteoporosis",
      question: "Do you have a family history of osteoporosis?",
      section: "Bone Health"
    },
    {
      id: "mental_health",
      question: "How is your mental health at the moment? Is there anything you would like the doctor to know about your personal or family history of mental health?",
      section: "Mental Health"
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
        .eq('module_name', 'module_2d');

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
            module_name: 'module_2d',
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
          module_name: 'module_2d',
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
      navigate('/consultation/module-3');
    }
    setIsLoading(false);
  };

  const handlePrevious = () => {
    navigate('/consultation/module-2c');
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

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="mb-6 mt-8 first:mt-0">
      <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
        {title}
      </h2>
    </div>
  );

  // Group questions by section
  const questionsBySection = questions.reduce((acc, question) => {
    if (!acc[question.section]) {
      acc[question.section] = [];
    }
    acc[question.section].push(question);
    return acc;
  }, {} as Record<string, typeof questions>);

  return (
    <ModuleLayout
      title="Cardiovascular, Bone and Mental Health"
      onNext={handleNext}
      onPrevious={handlePrevious}
      isLoading={isLoading}
    >
      <div className="space-y-8">
        <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6">
          <div className="text-sm text-foreground leading-relaxed">
            Did you know that after menopause, women face up to three times the risk of osteoporosis and heart disease?
          </div>
        </div>
        {/* Cardiovascular Health */}
        <div>
          <SectionHeader title="Cardiovascular Health" />
          {questionsBySection["Cardiovascular Health"]?.map((question) => (
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

        {/* Bone Health */}
        <div>
          <SectionHeader title="Bone Health" />
          {questionsBySection["Bone Health"]?.map((question) => (
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

        {/* Mental Health */}
        <div>
          <SectionHeader title="Mental Health" />
          {questionsBySection["Mental Health"]?.map((question) => (
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
      </div>
    </ModuleLayout>
  );
}