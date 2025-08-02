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

const HistoryModule = () => {
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const questions = [
    {
      id: 'q11',
      text: 'Have you been suffering from any unusual tiredness over the past few months?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q12',
      text: 'Have you been suffering from any new backaches over the past months which are not the result of an injury or easily explained?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q13',
      text: 'Have you been suffering from any new joint pains over the past months which are not the result of an injury or easily explained?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q14',
      text: 'If you have been having any new joint pains, please explain where these are and what they are like. Are they constant or do they come and go. Are they sharp or achey. Do certain activities bring them on?',
      type: 'text',
      maxLength: 500
    },
    {
      id: 'q15',
      text: 'Have you been suffering from any new muscle pains which are not the result of an injury or easily explained?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q16',
      text: 'If you have been having new muscle pains, please explain what these are like. When are they worse? What are they like? Are they constant or do they come and go? What makes them feel better?',
      type: 'text',
      maxLength: 500
    },
    {
      id: 'q17',
      text: 'Have you noticed an increase in facial hair over the past few months?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q18',
      text: 'Has your skin felt more dry over the past few months?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q19',
      text: 'Over the past few months have you noticed any new feelings of crawling under the skin or on the skin?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q20',
      text: 'Over the past few months have you felt a reduction in your sex drive? That is, less sexual feelings?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q21',
      text: 'Over the past months have you felt that your vagina is more dry or irritated than previously?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q22',
      text: 'Over the past months have you found intercourse more uncomfortable than previously?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
    },
    {
      id: 'q23',
      text: 'Over the past months has there been an increase in the frequency of urination?',
      type: 'multiple_choice',
      options: ['None', 'Mild', 'Moderate', 'Severe']
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
          .eq('module_name', 'history');

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
        module_name: 'history'
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
          module_name: 'history',
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
    await saveResponses();
    navigate('/consultation/finalizing');
  };

  const handlePrevious = () => {
    navigate('/consultation/symptoms');
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
      currentModule="history"
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSave={saveResponses}
      canGoNext={canGoNext}
      canGoPrevious={true}
    >
      <div className="space-y-8">
        <div className="text-center mb-8">
          <CardDescription>
            Please answer the following questions about your past medical history and other health concerns.
            This information will help provide a complete picture for your healthcare provider.
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

export default HistoryModule;