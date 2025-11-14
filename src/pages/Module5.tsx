import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { TextQuestion } from "@/components/QuestionComponents";
import { useToast } from "@/hooks/use-toast";
import { useResponses } from "@/contexts/ResponseContext";

interface Responses {
  [key: string]: string;
}

export default function Module5() {
  const [responses, setResponses] = useState<Responses>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getModuleResponses, saveResponses: saveToContext, isLoading: contextLoading } = useResponses();

  const questions = [
    {
      id: "other_questions",
      question: "Do you have any other questions that you would like to ask the doctor? Here is a good place to record them.",
      section: "Questions"
    }
  ];

  useEffect(() => {
    // Load responses from context (instant!)
    const moduleResponses = getModuleResponses('module_5');
    setResponses(moduleResponses);
  }, [getModuleResponses]);


  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveResponses = async () => {
    const success = await saveToContext('module_5', responses);
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
      navigate('/consultation/module-6');
    }
    setIsLoading(false);
  };

  const handlePrevious = () => {
    navigate('/consultation/module-4');
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
      title="Your questions"
      onNext={handleNext}
      onPrevious={handlePrevious}
      isLoading={isLoading}
    >
      <div className="space-y-6 sm:space-y-8">
        <div>
          {questionsBySection["Questions"]?.map((question) => (
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
      </div>
    </ModuleLayout>
  );
}
