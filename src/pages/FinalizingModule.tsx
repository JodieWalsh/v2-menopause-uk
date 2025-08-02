import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ConsultationLayout from "@/components/ConsultationLayout";
import { Edit, FileText, Mail } from "lucide-react";

const FinalizingModule = () => {
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const allQuestions = [
    // Module 1 Questions
    { id: 'hot_flushes', text: 'Hot flushes over the past few months', module: 'Module 1' },
    { id: 'light_headedness', text: 'Feelings of light headedness', module: 'Module 1' },
    { id: 'headaches', text: 'More headaches than normal', module: 'Module 1' },
    { id: 'irritability', text: 'More irritable than normal', module: 'Module 1' },
    { id: 'depression', text: 'More depressed than before', module: 'Module 1' },
    { id: 'feeling_unloved', text: 'Feeling more unloved than previously', module: 'Module 1' },
    { id: 'anxiety', text: 'More anxious than normal', module: 'Module 1' },
    { id: 'mood_fluctuations', text: 'Mood fluctuations more than normal', module: 'Module 1' },
    { id: 'sleeplessness', text: 'Sleeplessness more than normal', module: 'Module 1' },
    { id: 'sleeplessness_details', text: 'Sleeplessness details', module: 'Module 1' },
    { id: 'tiredness', text: 'Unusual tiredness', module: 'Module 1' },
    { id: 'backaches', text: 'New backaches', module: 'Module 1' },
    { id: 'joint_pains', text: 'New joint pains', module: 'Module 1' },
    { id: 'joint_pains_details', text: 'Joint pains details', module: 'Module 1' },
    { id: 'muscle_pains', text: 'New muscle pains', module: 'Module 1' },
    { id: 'muscle_pains_details', text: 'Muscle pains details', module: 'Module 1' },
    { id: 'facial_hair', text: 'Increase in facial hair', module: 'Module 1' },
    { id: 'dry_skin', text: 'Skin feeling more dry', module: 'Module 1' },
    { id: 'crawling_skin', text: 'Crawling feelings under/on skin', module: 'Module 1' },
    { id: 'sex_drive', text: 'Reduction in sex drive', module: 'Module 1' },
    { id: 'vaginal_dryness', text: 'Vaginal dryness or irritation', module: 'Module 1' },
    { id: 'intercourse_comfort', text: 'Intercourse discomfort', module: 'Module 1' },
    { id: 'urination_frequency', text: 'Increased urination frequency', module: 'Module 1' },
    
    // Module 2 Questions  
    { id: 'current_medications', text: 'Current medications', module: 'Module 2' },
    { id: 'last_menstrual_period', text: 'Last menstrual period', module: 'Module 2' },
    { id: 'contraception', text: 'Current contraception', module: 'Module 2' },
    { id: 'pregnancies', text: 'Pregnancies', module: 'Module 2' },
    { id: 'last_mammogram', text: 'Last mammogram', module: 'Module 2' },
    
    // Module 3 Questions
    { id: 'investigation_questions', text: 'Questions about investigations', module: 'Module 3' },
    
    // Module 4 Questions
    { id: 'family_history', text: 'Family history', module: 'Module 4' },
    
    // Module 5 Questions
    { id: 'additional_questions', text: 'Additional questions for doctor', module: 'Module 5' }
  ];

  useEffect(() => {
    const loadAllResponses = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data, error } = await supabase
          .from('user_responses')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        const responseMap = {};
        data?.forEach(response => {
          responseMap[response.question_id] = response.response_value;
        });
        setResponses(responseMap);
      } catch (error) {
        console.error('Error loading responses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllResponses();
  }, [navigate]);

  const handleEdit = (module) => {
    if (module === 'Module 1') {
      navigate('/consultation/module-1');
    } else if (module === 'Module 2') {
      navigate('/consultation/module-2');
    } else if (module === 'Module 3') {
      navigate('/consultation/module-3');
    } else if (module === 'Module 4') {
      navigate('/consultation/module-4');
    } else if (module === 'Module 5') {
      navigate('/consultation/module-5');
    }
  };

  const handlePrevious = () => {
    navigate('/consultation/module-6');
  };

  const handleGenerateDocument = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call the document generation function
      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: { responses }
      });

      if (error) throw error;

      // Mark finalizing module as completed
      const { error: progressError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          module_name: 'finalizing',
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,module_name',
          ignoreDuplicates: false
        });

      if (progressError) throw progressError;

      toast({
        title: "Document Generated!",
        description: "Your consultation document has been generated and sent to your email.",
      });

      navigate('/consultation/complete');
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Error",
        description: "Failed to generate document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const groupedResponses = allQuestions.reduce((acc, question) => {
    const response = responses[question.id];
    if (response) {
      if (!acc[question.module]) {
        acc[question.module] = [];
      }
      acc[question.module].push({
        question: question.text,
        answer: response
      });
    }
    return acc;
  }, {});

  const totalResponses = Object.keys(responses).length;
  const canGenerate = totalResponses > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background section-padding flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your consultation...</p>
        </div>
      </div>
    );
  }

  return (
    <ConsultationLayout
      currentModule="finalizing"
      onNext={() => {}}
      onPrevious={handlePrevious}
      onSave={async () => {}}
      canGoNext={false}
      canGoPrevious={true}
    >
      <div className="space-y-8">
        <div className="text-center mb-8">
          <CardDescription>
            Please review all your responses below. You can edit any section by clicking the "Edit" button.
            Once you're satisfied with your answers, click "Generate Document" to create your consultation report.
          </CardDescription>
        </div>

        <div className="grid gap-6">
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Response Summary</CardTitle>
                <Badge variant="outline">
                  {totalResponses} Responses Provided
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {Object.keys(groupedResponses).length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Modules Completed
                  </div>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {totalResponses}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Responses
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.entries(groupedResponses).map(([module, moduleResponses]: [string, any]) => (
            <Card key={module} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{module} Module</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(module)}
                    className="flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {moduleResponses.map((response, index) => (
                    <div key={index}>
                      <div className="font-medium text-sm text-muted-foreground mb-1">
                        {response.question}
                      </div>
                      <div className="text-foreground">
                        {response.answer.length > 100 ? (
                          <div className="bg-muted p-3 rounded-md text-sm">
                            {response.answer}
                          </div>
                        ) : (
                          <Badge variant="secondary">{response.answer}</Badge>
                        )}
                      </div>
                      {index < moduleResponses.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-2 border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="text-xl text-center">Ready to Generate Your Document?</CardTitle>
            <CardDescription className="text-center">
              Your responses will be compiled into a comprehensive document that you can share with your healthcare provider.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={handleGenerateDocument}
              disabled={!canGenerate || generating}
              variant="hero"
              size="lg"
              className="w-full max-w-md mx-auto flex items-center space-x-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating Document...</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>Generate Document</span>
                </>
              )}
            </Button>
            {!canGenerate && (
              <p className="text-sm text-muted-foreground mt-4">
                Please complete at least one module before generating your document.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </ConsultationLayout>
  );
};

export default FinalizingModule;