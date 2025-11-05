import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { TextQuestion } from "@/components/QuestionComponents";
import { useToast } from "@/hooks/use-toast";
import { useMarket } from "@/contexts/MarketContext";
import { MARKET_CONTENT } from "@/config/marketContent";
import { useResponses } from "@/contexts/ResponseContext";

interface Responses {
  [key: string]: string;
}

export default function Module2c() {
  const [responses, setResponses] = useState<Responses>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { market } = useMarket();
  const marketContent = MARKET_CONTENT[market.code];
  const { getModuleResponses, saveResponses: saveToContext, isLoading: contextLoading } = useResponses();

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
    // Load responses from context (instant!)
    const moduleResponses = getModuleResponses('module_2c');
    setResponses(moduleResponses);
  }, [getModuleResponses]);


  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveResponses = async () => {
    const success = await saveToContext('module_2c', responses);
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
      navigate('/consultation/module-2d');
    }
    setIsLoading(false);
  };

  const handlePrevious = () => {
    navigate('/consultation/module-2b');
  };

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
          <div 
            dangerouslySetInnerHTML={{ __html: marketContent.helpfulHints.mammogramInfo.text }}
          />
          {marketContent.helpfulHints.mammogramInfo.link && (
            <div className="mt-4">
              <strong>Use this link to access a booking:</strong><br />
              <a href={marketContent.helpfulHints.mammogramInfo.link} className="text-primary underline" target="_blank" rel="noopener noreferrer">
                {marketContent.helpfulHints.mammogramInfo.link}
              </a>
            </div>
          )}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
            <strong>Important Note:</strong> Please be aware that having had breast cancer is not always a reason to avoid menopause medications. 
            If you are in this circumstance please speak with your {marketContent.helpfulHints.terminology.gp}. 
            This video may help: <a href="https://www.youtube.com/watch?v=JtLU1FFo8Yw" className="text-primary underline" target="_blank" rel="noopener noreferrer">https://www.youtube.com/watch?v=JtLU1FFo8Yw</a>
          </div>
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
          <div className="space-y-4">
            <div>
              <strong>Take time to talk to your family</strong>
            </div>
            
            <p>
              Do you meet any of these criteria that increase your risk of breast cancer? 
              These may or may not impact your eligibility for hormone replacement therapy.
            </p>

            <div>
              <strong>Standard Risk Factors:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>One first-degree relative diagnosed with breast cancer at age &lt;50 years</li>
                <li>Two first-degree relatives, on the same side of the family, diagnosed with breast cancer</li>
                <li>Two second-degree relatives, on the same side of the family, diagnosed with breast cancer, 
                    at least one at age &lt;50 years</li>
              </ul>
            </div>

            <div>
              <strong>Higher Risk Factors:</strong>
              <p className="text-sm mt-1 mb-2">
                Two first- or second-degree relatives on one side of the family diagnosed with breast or ovarian cancer, 
                plus one or more of the following features on the same side of the family:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Additional relative(s) with breast or ovarian cancer</li>
                <li>Breast cancer diagnosed before age 40 years</li>
                <li>Bilateral breast cancer</li>
                <li>Breast and ovarian cancer in the same woman</li>
                <li>Ashkenazi Jewish ancestry</li>
                <li>Breast cancer in a male relative</li>
                <li>One first- or second-degree relative diagnosed with breast cancer at age &lt;45 years plus another 
                    first- or second-degree relative on the same side of the family with sarcoma (bone/soft tissue) at age &lt;45 years</li>
                <li>Member of a family in which the presence of a high-risk breast cancer gene mutation (eg BRCA1, BRCA2) has been established</li>
              </ul>
            </div>
          </div>
        </InfoBox>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Bowel Cancer History</h3>

          <InfoBox>
            {market.code === 'US' ? (
              <>
                This is not so relevant for the management of your menopausal symptoms, however all doctors will want to know that your screening is up to date.
                <br /><br />
                Depending on your age, family history and other circumstances this may include an at home test, or an in hospital test like a colonoscopy. Please look at this website for what you may expect, and organise in advance what you can, if necessary. <br />
                <a href="https://www.cancer.org/cancer/types/colon-rectal-cancer/detection-diagnosis-staging/acs-recommendations.html" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                  https://www.cancer.org/cancer/types/colon-rectal-cancer/detection-diagnosis-staging/acs-recommendations.html
                </a>
              </>
            ) : (
              <>
                This is not so relevant for the management of your menopausal symptoms, however all GPs will want to know that all screening is up to date.
                <br /><br />
                Before your appointment make sure that you have done your bowel prep kit. If you have not you can request one here: <br />
                <a href="https://www.health.gov.au/our-work/national-bowel-cancer-screening-program" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                  https://www.health.gov.au/our-work/national-bowel-cancer-screening-program
                </a>
              </>
            )}
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