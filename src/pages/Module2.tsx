
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/ModuleLayout";
import { TextQuestion, VideoSection } from "@/components/QuestionComponents";
import { useToast } from "@/hooks/use-toast";

interface Responses {
  [key: string]: string;
}

export default function Module2() {
  const [responses, setResponses] = useState<Responses>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const questions = [
    // Section 1: Your health at a top level
    {
      id: "chronic_disease",
      question: "Have you ever been diagnosed with a chronic disease? For example, epilepsy, diabetes, asthma, kidney disease? If so please document the current management for these diseases.",
      section: "Your health at a top level"
    },
    {
      id: "current_medications",
      question: "What medications are you currently taking. Please write down the name of the medication, the dosage and how frequently you take this medication.",
      section: "Your health at a top level"
    },
    {
      id: "supplements",
      question: "Are you taking any supplements? Please note down then name of the supplement, the dose, how often you take it and why you are taking it.",
      section: "Your health at a top level"
    },
    
    // Section 2: Gynaecological History
    {
      id: "last_menstrual_period",
      question: "Do you know the date of the start of your last menstrual period? Please note this down. If not, give an estimate of a month and a year.",
      section: "Gynaecological History"
    },
    {
      id: "period_changes",
      question: "If you are still having periods, have they changed? Are the periods heavier?",
      section: "Gynaecological History"
    },
    {
      id: "contraception",
      question: "What contraception are you currently using? How are you finding it.",
      section: "Gynaecological History"
    },
    {
      id: "last_cervical_screening",
      question: "What is the date of your last cervical screening?",
      section: "Gynaecological History"
    },
    {
      id: "endometriosis",
      question: "Have you ever been diagnosed with endometriosis? If so, what treatment did you receive?",
      section: "Gynaecological History"
    },
    {
      id: "pcos",
      question: "Have you ever been diagnosed with polycystic ovarian syndrome? If so, what treatment did you receive?",
      section: "Gynaecological History"
    },
    {
      id: "gynaecological_procedures",
      question: "Have you had any gynaecological procedures? Hysterectomy? Surgery for fallopian tube removal or ovarian cyst management? Hysteroscopy? For what reasons?",
      section: "Gynaecological History"
    },
    {
      id: "pregnancies",
      question: "How many pregnancies did you have?",
      section: "Gynaecological History"
    },
    {
      id: "delivery_dates",
      question: "What are the dates of your deliveries?",
      section: "Gynaecological History"
    },
    {
      id: "other_gynaecological",
      question: "Any other relevant gynaecological information?",
      section: "Gynaecological History"
    },

    // Section 3: Family and Personal Breast Cancer History
    {
      id: "last_mammogram",
      question: "What is the date of your last mammogram?",
      section: "Family and Personal Breast Cancer History"
    },
    {
      id: "family_breast_cancer",
      question: "Do you have any family history of breast cancer, either in males or females",
      section: "Family and Personal Breast Cancer History"
    },
    {
      id: "breast_cancer_ages",
      question: "How old was each of those relatives when they were diagnosed with breast cancer?",
      section: "Family and Personal Breast Cancer History"
    },

    // Section 4: Bowel cancer history
    {
      id: "family_bowel_cancer",
      question: "Has anyone in your family been diagnosed with bowel cancer?",
      section: "Bowel cancer history"
    },
    {
      id: "bowel_cancer_ages",
      question: "How old was each of those relatives when they were diagnosed with breast cancer?",
      section: "Bowel cancer history"
    },

    // Section 5: Cardiovascular Health
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

    // Section 6: Bone Health
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

    // Section 7: Mental Health
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
        .eq('module_name', 'module_2');

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
            module_name: 'module_2',
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
          module_name: 'module_2',
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
    navigate('/consultation/module-1');
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
      title="Your Health History: Getting to know you"
      onNext={handleNext}
      onPrevious={handlePrevious}
      isLoading={isLoading}
    >
      <VideoSection />
      
      {/* Main intro */}
      <InfoBox>
        <strong>This is the heavy stuff!</strong>
        <br /><br />
        Answer as much or as little as you would like
        <br /><br />
        Please note that if you have not had a cervical screening (what we used to call a pap smear) in the past 5 years then ensure you tell the medical receptionist this at the time of booking the appointment so that they can allow time and resources for this to be done on the day. This will again save you coming back another day!
      </InfoBox>

      <div className="space-y-8">
        {/* Section 1: Your health at a top level */}
        <div>
          <SectionHeader title="Your health at a top level" />
          {questionsBySection["Your health at a top level"]?.map((question) => (
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

        {/* Section 2: Gynaecological History */}
        <div>
          <SectionHeader title="Gynaecological History" />
          {questionsBySection["Gynaecological History"]?.slice(0, 3).map((question) => (
            <TextQuestion
              key={question.id}
              questionId={question.id}
              question={question.question}
              value={responses[question.id] || ''}
              onChange={(value) => handleResponseChange(question.id, value)}
              maxLength={1000}
            />
          ))}
          
          {/* Cervical screening question */}
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

          {questionsBySection["Gynaecological History"]?.slice(4).map((question) => (
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

        {/* Section 3: Family and Personal Breast Cancer History */}
        <div>
          <SectionHeader title="Family and Personal Breast Cancer History" />
          
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
            Use this link to access a booking: <br />
            <a href="https://www.health.gov.au/our-work/breastscreen-australia-program/having-a-breast-screen/who-should-have-a-breast-screen" className="text-primary underline" target="_blank" rel="noopener noreferrer">
              https://www.health.gov.au/our-work/breastscreen-australia-program/having-a-breast-screen/who-should-have-a-breast-screen
            </a>
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
        </div>

        {/* Section 4: Bowel cancer history */}
        <div>
          <SectionHeader title="Bowel cancer history" />
          
          <InfoBox>
            This is not so relevant for the management of your menopausal symptoms, however all GPs will want to know that all screening is up to date.
            <br /><br />
            Before your appointment make sure that you have done your bowelprep kit. If you have not you can request one here: <br />
            <a href="https://www.bowelcanceraustralia.org/screening-colonoscopy/national-bowel-cancer-screening-program/" className="text-primary underline" target="_blank" rel="noopener noreferrer">
              https://www.bowelcanceraustralia.org/screening-colonoscopy/national-bowel-cancer-screening-program/
            </a>
          </InfoBox>

          {questionsBySection["Bowel cancer history"]?.map((question) => (
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

        {/* Section 5: Cardiovascular Health */}
        <div>
          <SectionHeader title="Cardiovascular Health" />
          
          <InfoBox>
            Menopause is linked to an increased risk of cardiovascular disease (CVD) due to declining estrogen levels and related metabolic changes. These changes can lead to increased blood pressure, changes in cholesterol levels, and a higher risk of developing metabolic syndrome. While women generally develop CVD later than men, this gap narrows after menopause, and the risk can increase significantly for women experiencing early menopause.
            <br /><br />
            If you would like a more detailed understanding of the link between menopause and cardiovascular health, watch this video and take a look at this link: <br />
            <a href="https://www.jeanhailes.org.au/news/menopause-and-heart-health" className="text-primary underline" target="_blank" rel="noopener noreferrer">
              https://www.jeanhailes.org.au/news/menopause-and-heart-health
            </a>
          </InfoBox>

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

          <InfoBox>
            <strong>Here's a more detailed explanation:</strong>
            <br /><br />
            <strong>1. Estrogen's Protective Role:</strong><br />
            Estrogen plays a vital role in maintaining healthy blood vessels, regulating cholesterol levels, and potentially reducing inflammation. As estrogen levels decline during menopause, women lose these protective effects, increasing their susceptibility to CVD.
            <br /><br />
            <strong>2. Metabolic Changes:</strong><br />
            <strong>Increased Blood Pressure:</strong> Menopause is often associated with an increase in blood pressure, potentially due to hormonal fluctuations or changes in body composition (e.g., increased BMI).<br />
            <strong>Cholesterol Profile:</strong> Estrogen helps maintain healthy cholesterol levels. With its decline, women may experience an increase in LDL ("bad") cholesterol and a decrease in HDL ("good") cholesterol, contributing to plaque buildup in arteries.<br />
            <strong>Metabolic Syndrome:</strong> Menopause can increase the risk of developing metabolic syndrome, a cluster of conditions (including high blood pressure, high blood sugar, excess abdominal fat, and abnormal cholesterol levels) that significantly elevate the risk of CVD.
            <br /><br />
            <strong>3. Increased Risk of CVD:</strong><br />
            <strong>Higher Incidence:</strong> Studies have shown that women, particularly those with early menopause, experience a higher incidence of CVD events compared to their premenopausal counterparts.<br />
            <strong>Accelerated Risk:</strong> Some research suggests that plaque buildup in arteries may be accelerated in postmenopausal women, potentially leading to a steeper increase in heart problems.<br />
            <strong>Early Menopause:</strong> Women experiencing early menopause (either natural or induced by surgery) are at a greater risk of developing CVD later in life.
            <br /><br />
            <strong>4. Other Factors:</strong><br />
            <strong>Symptoms:</strong> Menopause-related symptoms like hot flashes, sleep disturbances, and mood changes can also indirectly impact CVD risk by affecting overall health and lifestyle choices.<br />
            <strong>Lifestyle:</strong> Factors like diet, exercise, and smoking can significantly influence cardiovascular health and interact with the hormonal changes of menopause.
            <br /><br />
            <strong>5. Addressing the Risk:</strong><br />
            <strong>Lifestyle Modifications:</strong> Adopting a healthy lifestyle, including a balanced diet, regular exercise, and avoiding smoking, is crucial for managing cardiovascular risk during and after menopause.<br />
            <strong>Medical Evaluation:</strong> Women experiencing menopause should discuss their cardiovascular health with their healthcare provider, including any family history of heart disease.<br />
            <strong>Hormone Therapy:</strong> Menopause hormone therapy (MHT), also known as hormone replacement therapy (HRT), may be an option to manage symptoms and potentially reduce CVD risk, but its use should be carefully considered in consultation with a healthcare professional.
          </InfoBox>
        </div>

        {/* Section 6: Bone Health */}
        <div>
          <SectionHeader title="Bone Health" />
          
          <InfoBox>
            Menopause is strongly linked to bone health due to the decline in estrogen levels, which are crucial for maintaining bone strength. This decline accelerates bone loss, increasing the risk of osteoporosis and fractures, particularly in the first five years after menopause.
          </InfoBox>

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

          <InfoBox>
            If you are interested in more information about bone health as we age - take a look at this link: <br />
            <a href="https://www.healthline.com/health/menopause/osteoporosis" className="text-primary underline" target="_blank" rel="noopener noreferrer">
              https://www.healthline.com/health/menopause/osteoporosis
            </a>
          </InfoBox>

          <InfoBox>
            <strong>Here's a more detailed explanation:</strong>
            <br /><br />
            <strong>Estrogen's Role:</strong><br />
            Estrogen plays a vital role in maintaining bone density and strength by regulating bone remodeling, the process where old bone is broken down and new bone is formed.
            <br /><br />
            <strong>Menopause and Bone Loss:</strong><br />
            As women transition through menopause, their ovaries produce less estrogen, leading to a significant drop in estrogen levels. This decrease in estrogen accelerates bone loss, as bone resorption (breakdown) outpaces bone formation.
            <br /><br />
            <strong>Osteoporosis Risk:</strong><br />
            This accelerated bone loss increases the risk of osteoporosis, a condition characterized by weakened, brittle bones that are more susceptible to fractures.
            <br /><br />
            <strong>Fracture Risk:</strong><br />
            Osteoporosis can lead to painful and debilitating fractures, especially in the hip, spine, and wrist.
            <br /><br />
            <strong>Preventing Bone Loss:</strong><br />
            Lifestyle factors like diet, exercise, and avoiding smoking play a crucial role in maintaining bone health during menopause.
            <br /><br />
            <strong>Medical Options:</strong><br />
            In some cases, hormone therapy (HT), also known as hormone replacement therapy (HRT), may be considered to address bone loss, but it's important to discuss the risks and benefits with a healthcare professional.
            <br /><br />
            <strong>Early Intervention:</strong><br />
            Early diagnosis and management of osteoporosis are crucial to prevent fractures and maintain quality of life.
          </InfoBox>
        </div>

        {/* Section 7: Mental Health */}
        <div>
          <SectionHeader title="Mental Health" />
          
          <InfoBox>
            <strong>Menopause: It's Like Puberty, But in Reverse!</strong>
            <br /><br />
            So, you know how puberty can make your emotions feel like a rollercoaster? Well, menopause is kind of like that, but in reverse! It's a totally natural time in a woman's life (usually in her 40s or 50s) when her periods stop. This happens because her ovaries chill out and produce less of the hormones estrogen and progesterone.
            <br /><br />
            Now, these hormones aren't just about periods; they also play a role in mood! As they change, some women might experience mood swings, feeling a bit down, or having trouble sleeping. Think of it like your brain is temporarily adjusting to a new normal.
            <br /><br />
            The good news? It's temporary! Many women find ways to rock this phase by exercising, eating healthy, practicing relaxation techniques like yoga, and connecting with friends. If things get a little overwhelming, talking to a doctor or therapist can provide extra support and strategies. Menopause is just another chapter – embrace the change and keep shining!
          </InfoBox>

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

          <InfoBox>
            <strong>Ok - that is the heavy part over. Congratulations - you are almost there.</strong>
          </InfoBox>
        </div>
      </div>
    </ModuleLayout>
  );
}
