import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { TextQuestion } from "@/components/QuestionComponents";
import { useToast } from "@/hooks/use-toast";
import { useResponses } from "@/contexts/ResponseContext";

interface Responses {
  [key: string]: string;
}

export default function Module2d() {
  const [responses, setResponses] = useState<Responses>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getModuleResponses, saveResponses: saveToContext, isLoading: contextLoading } = useResponses();

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
    // Load responses from context (instant!)
    const moduleResponses = getModuleResponses('module_2d');
    setResponses(moduleResponses);
  }, [getModuleResponses]);


  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveResponses = async () => {
    const success = await saveToContext('module_2d', responses);
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
      navigate('/consultation/module-3');
    }
    setIsLoading(false);
  };

  const handlePrevious = () => {
    navigate('/consultation/module-2c');
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
      <div className="space-y-6 sm:space-y-8">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
          <div className="text-sm sm:text-base text-foreground leading-relaxed">
            <strong>Did you know?</strong> After menopause, women face up to three times the risk of osteoporosis and heart disease.
          </div>
        </div>
        {/* Cardiovascular Health */}
        <div>
          <SectionHeader title="Cardiovascular Health" />
          <div className="space-y-4 sm:space-y-6">
            {questionsBySection["Cardiovascular Health"]?.map((question) => (
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

        {/* Bone Health */}
        <div>
          <SectionHeader title="Bone Health" />
          <div className="space-y-4 sm:space-y-6">
            {questionsBySection["Bone Health"]?.map((question) => (
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

        {/* Mental Health */}
        <div>
          <SectionHeader title="Mental Health" />
          <div className="space-y-4 sm:space-y-6">
            {questionsBySection["Mental Health"]?.map((question) => (
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
      </div>
    </ModuleLayout>
  );
}