import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { TextQuestion } from "@/components/QuestionComponents";
import { useToast } from "@/hooks/use-toast";
import { useResponses } from "@/contexts/ResponseContext";

interface Responses {
  [key: string]: string;
}

export default function Module3() {
  const [responses, setResponses] = useState<Responses>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getModuleResponses, saveResponses: saveToContext, isLoading: contextLoading } = useResponses();

  const questions = [
    {
      id: "investigation_questions",
      question: "Do you have any specific questions for your doctor about investigations? If so, please write them here.",
      section: "Investigations"
    }
  ];

  useEffect(() => {
    // Load responses from context (instant!)
    const moduleResponses = getModuleResponses('module_3');
    setResponses(moduleResponses);
  }, [getModuleResponses]);


  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveResponses = async () => {
    const success = await saveToContext('module_3', responses);
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
      navigate('/consultation/module-4');
    }
    setIsLoading(false);
  };

  const handlePrevious = () => {
    navigate('/consultation/module-2d');
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
      title="Investigations"
      onNext={handleNext}
      onPrevious={handlePrevious}
      isLoading={isLoading}
    >
      {/* Information about investigations */}
      <InfoBox>
        <strong>Many women come to the consultation expecting a blood test to diagnose menopause.</strong> It is important to understand that we use the symptom score sheet - the questions we asked in the first part of this tool, rather than a blood test in establishing a diagnosis. The blood tests of FSH and oestradiol can fluctuate on a daily basis and therefore are not useful or necessary. It is especially unhelpful to do hormone blood tests while women are on hormone replacement therapy or the oral contraceptive pill. <strong>Symptoms, not blood levels, guide therapy. We treat the symptoms, not the biochemistry.</strong>
        <br /><br />
        Blood test measurement of FSH is indicated in women under 40 and 40-45 with menopausal symptoms as they may be experiencing premature menopause. Premature menopause is diagnosed by elevated FSH levels on two occasions, 4-6 weeks apart.
        <br /><br />
        <strong>If it's not menopause, what is it?</strong>
        <br /><br />
        Depression, anaemia and thyroid disorders are the most common conditions that may occur concurrently. Unstable diabetes and hyperthyroidism may cause hot flushes. Medication, such as the SSRI family of anti-depressants, may also cause hot flushes. Doing a blood count, ferritin and/or a TSH (thyroid) level will usually establish the diagnosis. However, if a woman presents with low mood or anxiety, there is a need to evaluate whether this is a primary anxiety/depression or one aggravated by the lack of oestrogen. A previous history of depression or an elevated FSH may help to differentiate between the two. Hair loss may be a sign of iron deficiency or hypothyroidism rather than Menopause.
        <br /><br />
        Your doctor therefore may choose to perform some blood tests including a full blood count and a thyroid panel - just to ensure that nothing is missed.
        <br /><br />
        If you have had any recent blood tests, please bring these results to your consultation.
      </InfoBox>

      <div className="space-y-6 sm:space-y-8">
        {questionsBySection["Investigations"]?.map((question) => (
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
