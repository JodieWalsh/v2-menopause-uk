import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit } from "lucide-react";

interface Response {
  question_id: string;
  response_value: string;
  module_name: string;
}

interface ModuleQuestions {
  [key: string]: {
    title: string;
    questions: { [key: string]: string };
  };
}

export default function Summary() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const moduleQuestions: ModuleQuestions = {
    module_1: {
      title: "Your Symptom Snapshot",
      questions: {
        "hot_flushes": "Have you been experiencing any hot flushes over the past few months?",
        "light_headedness": "Have you been experiencing any feelings of light headedness over the past months?",
        "headaches": "Have you been experiencing more headaches than normal over the past months?",
        "irritability": "Have you been more irritable over the past few months than normal?",
        "depression": "Have you felt more depressed over the past few months than before?",
        "unloved": "Have you felt more unloved over the past few months than previously?",
        "anxiety": "Have you felt more anxious over the past few months than you normally would?",
        "mood_fluctuations": "Has your mood fluctuated more over the past few months than normal? Have you had more mood changes?",
        "sleeplessness": "Have you been suffering from sleeplessness more over the past few months than normal?",
        "sleeplessness_details": "If you have been having more sleeplessness than normal, please explain what this is like for you.",
        "tiredness": "Have you been suffering from any unusual tiredness over the past few months?",
        "backaches": "Have you been suffering from any new backaches over the past months which are not the result of an injury or easily explained?",
        "joint_pains": "Have you been suffering from any new joint pains over the past months which are not the result of an injury or easily explained?",
        "joint_pains_details": "If you have been having any new joint pains, please explain where these are and what they are like.",
        "muscle_pains": "Have you been suffering from any new muscle pains which are not the result of an injury or easily explained?",
        "muscle_pains_details": "If you have been having new muscle pains, please explain what these are like.",
        "facial_hair": "Have you noticed an increase in facial hair over the past few months?",
        "skin_dryness": "Has your skin felt more dry over the past few months?",
        "crawling_skin": "Over the past few months have you noticed any new feelings of crawling under the skin or on the skin?",
        "sex_drive": "Over the past few months have you felt a reduction in your sex drive? That is, less sexual feelings?",
        "vaginal_dryness": "Over the past months have you felt that your vagina is more dry or irritated than previously?",
        "intercourse_comfort": "Over the past months have you found intercourse more uncomfortable than previously?",
        "urination_frequency": "Over the past months has there been an increase in the frequency of urination?",
        "brain_fog": "Over the past months has there been an increase in brain fog?"
      }
    },
    module_2: {
      title: "Your Health History: Getting to know you",
      questions: {
        "chronic_disease": "Have you ever been diagnosed with a chronic disease? For example, epilepsy, diabetes, asthma, kidney disease?",
        "current_medications": "What medications are you currently taking.",
        "supplements": "Are you taking any supplements?",
        "last_menstrual_period": "Do you know the date of the start of your last menstrual period?",
        "period_changes": "If you are still having periods, have they changed? Are the periods heavier?",
        "contraception": "What contraception are you currently using? How are you finding it.",
        "last_cervical_screening": "What is the date of your last cervical screening?",
        "endometriosis": "Have you ever been diagnosed with endometriosis? If so, what treatment did you receive?",
        "pcos": "Have you ever been diagnosed with polycystic ovarian syndrome? If so, what treatment did you receive?",
        "gynaecological_procedures": "Have you had any gynaecological procedures? Hysterectomy? Surgery for fallopian tube removal or ovarian cyst management?",
        "pregnancies": "How many pregnancies did you have?",
        "delivery_dates": "What are the dates of your deliveries?",
        "other_gynaecological": "Any other relevant gynaecological information?",
        "last_mammogram": "What is the date of your last mammogram?",
        "family_breast_cancer": "Do you have any family history of breast cancer, either in males or females",
        "breast_cancer_ages": "How old was each of those relatives when they were diagnosed with breast cancer?",
        "family_bowel_cancer": "Has anyone in your family been diagnosed with bowel cancer?",
        "bowel_cancer_ages": "How old was each of those relatives when they were diagnosed with breast cancer?",
        "blood_clot_history": "Have you ever had a blood clot? If so, please give details.",
        "cardiovascular_conditions": "Have you ever been diagnosed with high blood pressure, high cholesterol or had a stroke?",
        "family_heart_disease": "Do you or any of your family have a history of heart disease? If so, please give details.",
        "osteoporosis_diagnosis": "Have you been diagnosed with osteoporosis?",
        "bone_fractures": "Have you ever had a bone fracture which occurred without a serious accident or fall?",
        "bone_density_screening": "Have you ever had a bone density screening?",
        "family_osteoporosis": "Do you have a family history of osteoporosis?",
        "mental_health": "How is your mental health at the moment? Is there anything you would like the doctor to know about your personal or family history of mental health?"
      }
    },
    module_3: {
      title: "Investigations",
      questions: {
        "investigation_questions": "Do you have any specific questions for your doctor about investigations? If so, please write them here."
      }
    },
    module_4: {
      title: "Menopause Medical Treatments: Your Guide to Feeling Fantastic!",
      questions: {
        "doctor_questions": "Do you have any specific questions for your doctor or thoughts that you wish to discuss? If so, please write them here."
      }
    },
    module_5: {
      title: "Your questions",
      questions: {
        "other_questions": "Do you have any other questions that you would like to ask the doctor? Here is a good place to record them."
      }
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      setEmail(user.email || "");

      const { data: userResponses, error } = await supabase
        .from('user_responses')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setResponses(userResponses || []);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your responses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to continue",
          variant: "destructive"
        });
        return;
      }

      // Transform responses into the format expected by the generate-document function
      const responseMap = {};
      responses.forEach(response => {
        responseMap[response.question_id] = response.response_value;
      });

      // Add email to the response map
      responseMap['user_email'] = email;

      // Generate the document and send email
      const { data, error: generateError } = await supabase.functions.invoke('generate-document', {
        body: { responses: responseMap, email }
      });

      if (generateError) throw generateError;

      toast({
        title: "Document Generated!",
        description: "Your consultation document has been generated and sent to your email.",
      });

      // Navigate to completion page
      navigate('/consultation/complete');
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Error",
        description: "Failed to generate document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getModuleRoute = (moduleName: string) => {
    return `/consultation/${moduleName.replace('_', '-')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your responses...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/consultation/module-6')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Module 6
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Assessment Summary
          </h1>
          <p className="text-muted-foreground">
            Thank you for completing your comprehensive menopause assessment! 
            Please review all your responses below. You can go back and change any of your answers if needed.
          </p>
        </div>

        {/* Display responses by module */}
        <div className="space-y-6 mb-8">
          {Object.entries(moduleQuestions).map(([moduleKey, moduleData]) => {
            const moduleResponses = responses.filter(r => r.module_name === moduleKey);
            
            return (
              <Card key={moduleKey}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">{moduleData.title}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(getModuleRoute(moduleKey))}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Responses
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(moduleData.questions).map(([questionId, questionText]) => {
                      const userResponse = moduleResponses.find(r => r.question_id === questionId);
                      return (
                        <div key={questionId} className="border-b border-border pb-2 last:border-b-0">
                          <p className="font-medium text-sm text-muted-foreground mb-1">
                            {questionText}
                          </p>
                          <p className="text-foreground">
                            {userResponse?.response_value || 'No answer provided yet'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Email section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Email Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Please review and confirm the email address where you'd like to receive your consultation document:
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                If you can't find the email, please check your email spam inbox.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleSendEmail}
            disabled={!email || isSending}
            size="lg"
            className="w-full sm:w-auto"
            variant="hero"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                Generating Your Document...
              </>
            ) : (
              <>
                📧 Send My Consultation Document
                <span className="ml-2 text-sm opacity-80">(Takes ~30 seconds)</span>
              </>
            )}
          </Button>
        </div>
        
        {/* Additional info */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border">
            💡 <strong>Pro tip:</strong> Print your document or save it to your phone to bring to your doctor's appointment. 
            This will help ensure you cover all important topics during your consultation.
          </p>
        </div>
      </div>
    </Layout>
  );
}