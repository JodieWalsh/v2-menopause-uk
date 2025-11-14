import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { TextQuestion } from "@/components/QuestionComponents";
import { useToast } from "@/hooks/use-toast";
import { useResponses } from "@/contexts/ResponseContext";

interface Responses {
  [key: string]: string;
}

export default function Module2b() {
  const [responses, setResponses] = useState<Responses>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getModuleResponses, saveResponses: saveToContext, isLoading: contextLoading } = useResponses();

  const questions = [
    {
      id: "last_menstrual_period",
      question: "Note: we are going to ask some questions which are sensitive in some cultures and regions. If these answers are too sensitive for you, please just write the answers down on a piece of paper separately and keep it with you, ready for you to give the information to your doctor when they ask.\n\nDo you know the date of the start of your last menstrual period? Please note this down. If not, give an estimate of a month and a year.",
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
    // Load responses from context (instant!)
    const moduleResponses = getModuleResponses('module_2b');
    setResponses(moduleResponses);
  }, [getModuleResponses]);

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveResponses = async () => {
    const success = await saveToContext('module_2b', responses);
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
      navigate('/consultation/module-2c');
    }
    setIsLoading(false);
  };

  const handlePrevious = () => {
    navigate('/consultation/module-2a');
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