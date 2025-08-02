import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/ModuleLayout";
import { TextQuestion } from "@/components/QuestionComponents";
import { useToast } from "@/hooks/use-toast";

interface Responses {
  [key: string]: string;
}

export default function Module3() {
  const [responses, setResponses] = useState<Responses>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const questions = [
    {
      id: "investigation_questions",
      question: "Do you have any specific questions for your doctor about investigations? If so, please write them here.",
      section: "Investigations"
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
        .eq('module_name', 'module_3');

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
            module_name: 'module_3',
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
          module_name: 'module_3',
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
      navigate('/consultation/module-4');
    }
    setIsLoading(false);
  };

  const handlePrevious = () => {
    navigate('/consultation/module-2d');
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

      <div className="space-y-8">
        {questionsBySection["Investigations"]?.map((question) => (
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
