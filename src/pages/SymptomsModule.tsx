import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ConsultationLayout from "@/components/ConsultationLayout";

const SymptomsModule = () => {
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const questions = [
    {
      id: 'q1',
      text: 'Have you been experiencing any hot flushes over the past few months?',
      type: 'multiple_choice',
      options: [
        'No hot flushes at all',
        'Some occasional hot flushes with only a very mild impact on my life',
        'Regular hot flushes with a moderate impact on my life',
        'Severe hot flushes that are having a serious impact on my life'
      ]
    },
    {
      id: 'q2',
      text: 'Have you been experiencing any feelings of light-headedness over the past months?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q3',
      text: 'Have you been experiencing any more headaches than normal over the past months?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q4',
      text: 'Have you been more irritable over the past few months than normal?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q5',
      text: 'Have you felt more depressed over the past few months than before?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q6',
      text: 'Have you felt more unloved over the past few months than previously?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q7',
      text: 'Have you felt more anxious over the past few months than you normally would?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q8',
      text: 'Has your mood fluctuated more over the past few months than normal? Have you had more mood changes?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q9',
      text: 'Have you been suffering from sleeplessness more over the past few months than normal?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q10',
      text: 'If you have been having more sleeplessness than normal, please explain what this is like for you. Do you have trouble falling asleep? Do you wake up earlier in the morning? Are you waking up for no reason in the middle of the night and having trouble falling back to sleep?',
      type: 'text',
      maxLength: 500
    }
  ];

  useEffect(() => {
    const loadResponses = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data, error } = await supabase
          .from('user_responses')
          .select('*')
          .eq('user_id', user.id)
          .eq('module_name', 'symptoms');

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

    loadResponses();
  }, [navigate]);

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveResponses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const responsesToSave = Object.entries(responses).map(([questionId, value]) => ({
        user_id: user.id,
        question_id: questionId,
        response_value: String(value),
        response_type: questions.find(q => q.id === questionId)?.type || 'multiple_choice',
        module_name: 'symptoms'
      }));

      const { error } = await supabase
        .from('user_responses')
        .upsert(responsesToSave, {
          onConflict: 'user_id,question_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      // Update progress
      const { error: progressError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          module_name: 'symptoms',
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,module_name',
          ignoreDuplicates: false
        });

      if (progressError) throw progressError;

    } catch (error) {
      console.error('Error saving responses:', error);
      throw error;
    }
  };

  const handleNext = async () => {
    try {
      await saveResponses();
      navigate('/consultation/history');
    } catch (error) {
      console.error('Error saving responses:', error);
      toast({
        title: "Error",
        description: "Failed to save your responses. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canGoNext = Object.keys(responses).length > 0;

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
      currentModule="symptoms"
      onNext={handleNext}
      onPrevious={() => {}}
      onSave={saveResponses}
      canGoNext={canGoNext}
      canGoPrevious={false}
    >
      <div className="space-y-8">
        <div className="text-center mb-8">
          <CardDescription>
            Please answer the following questions about your symptoms over the past few months.
            Your responses will help create a comprehensive report for your doctor.
          </CardDescription>
        </div>

        {questions.map((question, index) => (
          <Card key={question.id} className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Question {index + 1} of {questions.length}
              </CardTitle>
              <CardDescription>{question.text}</CardDescription>
            </CardHeader>
            <CardContent>
              {question.type === 'multiple_choice' ? (
                <RadioGroup
                  value={responses[question.id] || ''}
                  onValueChange={(value) => handleResponseChange(question.id, value)}
                >
                  {question.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                      <Label htmlFor={`${question.id}-${option}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Please provide your detailed response..."
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    maxLength={question.maxLength}
                    className="min-h-[100px]"
                  />
                  <div className="text-sm text-muted-foreground text-right">
                    {(responses[question.id] || '').length}/{question.maxLength} characters
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ConsultationLayout>
  );
};

export default SymptomsModule;