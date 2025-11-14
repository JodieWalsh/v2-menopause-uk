import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { TextQuestion } from "@/components/QuestionComponents";
import { useToast } from "@/hooks/use-toast";
import { useResponses } from "@/contexts/ResponseContext";

interface Responses {
  [key: string]: string;
}

export default function Module2a() {
  const [responses, setResponses] = useState<Responses>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getModuleResponses, saveResponses: saveToContext, isLoading: contextLoading } = useResponses();

  const questions = [
    {
      id: "chronic_disease",
      question: "Have you ever been diagnosed with a chronic disease? For example, epilepsy, diabetes, asthma, kidney disease? If so please document the current management for these diseases.",
    },
    {
      id: "current_medications",
      question: "What medications are you currently taking. Please write down the name of the medication, the dosage and how frequently you take this medication.",
    },
    {
      id: "supplements",
      question: "Are you taking any supplements? Please note down then name of the supplement, the dose, how often you take it and why you are taking it.",
    },
    {
      id: "medication_allergies",
      question: "Do you have any allergies or reactions to medications?",
    }
  ];

  useEffect(() => {
    // Load responses from context (instant!)
    const moduleResponses = getModuleResponses('module_2a');
    setResponses(moduleResponses);
  }, [getModuleResponses]);

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveResponses = async () => {
    const success = await saveToContext('module_2a', responses);
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to save responses. Please try again.",
        variant: "destructive"
      });
    }
    return success;
  };

  const handleNext = async () => {
    setIsLoading(true);
    const success = await saveResponses();
    if (success) {
      navigate('/consultation/module-2b');
    }
    setIsLoading(false);
  };

  const handlePrevious = () => {
    navigate('/consultation/module-1');
  };

  // Only show loading during initial context load
  if (contextLoading) {
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
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
      <div className="text-sm sm:text-base text-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );

  return (
    <ModuleLayout
      title="Your Health History: Getting to know you"
      onNext={handleNext}
      onPrevious={handlePrevious}
      isLoading={isLoading}
    >
      <InfoBox>
        <strong>This is the heavy stuff!</strong>
        <br /><br />
        Answer as much or as little as you would like
      </InfoBox>

      <div className="space-y-6 sm:space-y-8">
        {questions.map((question) => (
          <div key={question.id} className="bg-white/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <TextQuestion
              questionId={question.id}
              question={question.question}
              value={responses[question.id] || ''}
              onChange={(value) => handleResponseChange(question.id, value)}
              maxLength={1000}
            />
          </div>
        ))}
      </div>
    </ModuleLayout>
  );
}