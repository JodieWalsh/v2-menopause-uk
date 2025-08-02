import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/ModuleLayout";
import { TextQuestion } from "@/components/QuestionComponents";
import { useToast } from "@/hooks/use-toast";

interface Responses {
  [key: string]: string;
}

export default function Module2c() {
  const [responses, setResponses] = useState<Responses>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const questions = [
    {
      id: "last_mammogram",
      question: "What is the date of your last mammogram?",
    },
    {
      id: "family_breast_cancer",
      question: "Do you have any family history of breast cancer, either in males or females",
    },
    {
      id: "breast_cancer_ages",
      question: "How old was each of those relatives when they were diagnosed with breast cancer?",
    },
    {
      id: "family_bowel_cancer",
      question: "Has anyone in your family been diagnosed with bowel cancer?",
    },
    {
      id: "bowel_cancer_ages",
      question: "How old was each of those relatives when they were diagnosed with bowel cancer?",
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
        .eq('module_name', 'module_2c');

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
            module_name: 'module_2c',
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
          module_name: 'module_2c',
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
      navigate('/consultation/module-2d');
    }
    setIsLoading(false);
  };

  const handlePrevious = () => {
    navigate('/consultation/module-2b');
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
      title="Family and Personal Cancer History"
      onNext={handleNext}
      onPrevious={handlePrevious}
      isLoading={isLoading}
    >
      <div className="space-y-6">
        <TextQuestion
          questionId="last_mammogram"
          question="What is the date of your last mammogram?"
          value={responses["last_mammogram"] || ''}
          onChange={(value) => handleResponseChange("last_mammogram", value)}
          maxLength={1000}
        />

        <InfoBox>
          If you are aged over 40 in Australia then you eligible for a free mammogram. If you are over 50 your GP will encourage you to have one as part of normal screening, so book in for it before you even have your consultation with your GP for your menopause symptoms.
          <br /><br />
          Use this link to access a booking:<br />
          <a href="https://www.health.gov.au/our-work/breastscreen-australia-program/having-a-breast-screen/who-should-have-a-breast-screen" className="text-primary underline" target="_blank" rel="noopener noreferrer">
            https://www.health.gov.au/our-work/breastscreen-australia-program/having-a-breast-screen/who-should-have-a-breast-screen
          </a>
          <br /><br />
          Please be aware that having had breast cancer is not always a reason to avoid menopause medications. 
          If you are in this circumstance please speak with your doctor. 
          This video may help. <a href="https://www.youtube.com/watch?v=JtLU1FFo8Yw" className="text-primary underline" target="_blank" rel="noopener noreferrer">https://www.youtube.com/watch?v=JtLU1FFo8Yw</a>
        </InfoBox>

        <TextQuestion
          questionId="family_breast_cancer"
          question="Do you have any family history of breast cancer, either in males or females"
          value={responses["family_breast_cancer"] || ''}
          onChange={(value) => handleResponseChange("family_breast_cancer", value)}
          maxLength={1000}
        />

        <TextQuestion
          questionId="breast_cancer_ages"
          question="How old was each of those relatives when they were diagnosed with breast cancer?"
          value={responses["breast_cancer_ages"] || ''}
          onChange={(value) => handleResponseChange("breast_cancer_ages", value)}
          maxLength={1000}
        />

        <InfoBox>
          <strong>Take time to talk to your family</strong>
          <br /><br />
          Do you meet any of these criteria that increase your risk of breast cancer? These may or may not impact on your eligibility to have hormone replacement therapy.
          <br /><br />
          • One first-degree relative diagnosed with breast cancer at age &lt;50 years (without the additional features of the potentially high-risk group)<br />
          • Two first-degree relatives, on the same side of the family, diagnosed with breast cancer (without the additional features of the potentially high-risk group)<br />
          • Two second-degree relatives, on the same side of the family, diagnosed with breast cancer, at least one at age &lt;50 years (without the additional features of the potentially high risk group)<br />
          <br />
          Two first- or second-degree relatives on one side of the family diagnosed with breast or ovarian cancer, plus one or more of the following features on the same side of the family:<br />
          • additional relative(s) with breast or ovarian cancer<br />
          • breast cancer diagnosed before age 40 years<br />
          • bilateral breast cancer<br />
          • breast and ovarian cancer in the same woman<br />
          • Ashkenazi Jewish ancestry<br />
          • breast cancer in a male relative<br />
          • One first- or second-degree relative diagnosed with breast cancer at age &lt;45 years plus another first- or second-degree relative on the same side of the family with sarcoma (bone/soft tissue) at age &lt;45 years<br />
          • Member of a family in which the presence of a high-risk breast cancer gene mutation (eg BRCA1, BRCA2) has been established
        </InfoBox>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Bowel Cancer History</h3>
          
          <InfoBox>
            This is not so relevant for the management of your menopausal symptoms, however all GPs will want to know that all screening is up to date.
            <br /><br />
            Before your appointment make sure that you have done your bowel prep kit. If you have not you can request one here: <br />
            <a href="https://www.health.gov.au/our-work/national-bowel-cancer-screening-program" className="text-primary underline" target="_blank" rel="noopener noreferrer">
              https://www.health.gov.au/our-work/national-bowel-cancer-screening-program
            </a>
          </InfoBox>

          <TextQuestion
            questionId="family_bowel_cancer"
            question="Has anyone in your family been diagnosed with bowel cancer?"
            value={responses["family_bowel_cancer"] || ''}
            onChange={(value) => handleResponseChange("family_bowel_cancer", value)}
            maxLength={1000}
          />

          <TextQuestion
            questionId="bowel_cancer_ages"
            question="How old was each of those relatives when they were diagnosed with bowel cancer?"
            value={responses["bowel_cancer_ages"] || ''}
            onChange={(value) => handleResponseChange("bowel_cancer_ages", value)}
            maxLength={1000}
          />
        </div>
      </div>
    </ModuleLayout>
  );
}