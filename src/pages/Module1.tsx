import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { MultipleChoiceQuestion, TextQuestion } from "@/components/QuestionComponents";
import { useToast } from "@/hooks/use-toast";
import { useResponses } from "@/contexts/ResponseContext";

interface Responses {
  [key: string]: string;
}

export default function Module1() {
  const [responses, setResponses] = useState<Responses>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getModuleResponses, saveResponses: saveToContext, isLoading: contextLoading } = useResponses();

  const questions = [
    {
      id: "top_three_symptoms",
      type: "text",
      question: "What are your top three symptoms that you desperately need help with?",
      maxLength: 500
    },
    {
      id: "hot_flushes",
      type: "multiple_choice",
      question: "Have you been experiencing any hot flushes over the past few months?",
      options: [
        "No hot flushes at all",
        "Some occasional hot flushes with only a very mild impact on my life",
        "Regular hot flushes with a moderate impact on my life",
        "Severe hot flushes that are having a serious impact on my life"
      ]
    },
    {
      id: "light_headedness",
      type: "multiple_choice",
      question: "Have you been experiencing any feelings of light headedness over the past months?",
      options: [
        "No, I have not been experiencing any new feeling of light headedness",
        "Yes I have experienced some mild new light headedness",
        "I have been experiencing light headedness that is having a moderate impact on my life",
        "I have been experiencing new light headedness which is severe"
      ]
    },
    {
      id: "headaches",
      type: "multiple_choice",
      question: "Have you been experiencing more headaches than normal over the past months?",
      options: [
        "No, I have not had more headaches than normal",
        "I have had some extra headaches - a mild amount more than normal",
        "I have had a moderate number of extra headaches with a moderate impact on my life",
        "I have been having quite a few extra headaches"
      ]
    },
    {
      id: "irritability",
      type: "multiple_choice",
      question: "Have you been more irritable over the past few months than normal?",
      options: [
        "No - just my usual amount of irritability",
        "I have been mildly more irritable",
        "I have been moderately more irritable",
        "Yes, I have been severely more irritable"
      ]
    },
    {
      id: "depression",
      type: "multiple_choice",
      question: "Have you felt more depressed over the past few months than before?",
      options: [
        "No, I have not felt any extra depression",
        "Yes I have been mildly more depressed",
        "I have been moderately more depressed than previously",
        "My depression is much more severe than previously"
      ]
    },
    {
      id: "unloved",
      type: "multiple_choice",
      question: "Have you felt more unloved over the past few months than previously?",
      options: [
        "No, I have felt as loved as normal",
        "I have felt mildly more unloved than previously",
        "I have felt moderately more unloved than previously",
        "I have felt severely more unloved than previously"
      ]
    },
    {
      id: "anxiety",
      type: "multiple_choice",
      question: "Have you felt more anxious over the past few months than you normally would?",
      options: [
        "No - my anxiety level has been the same",
        "Yes I am a small amount more anxious than previously. Mild",
        "I am moderately more anxious than previously",
        "I am severely more anxious than previously"
      ]
    },
    {
      id: "mood_fluctuations",
      type: "multiple_choice",
      question: "Has your mood fluctuated more over the past few months than normal? Have you had more mood changes?",
      options: [
        "No, my mood fluctuates as normal",
        "I have a mild increase in mood fluctuations",
        "My mood is fluctuating quite a bit more than normal",
        "I am having severe mood fluctuations compared to normal"
      ]
    },
    {
      id: "sleeplessness",
      type: "multiple_choice",
      question: "Have you been suffering from sleeplessness more over the past few months than normal?",
      options: [
        "No, my sleep is the same as normal",
        "I am having a mild amount of extra sleeplessness compared to normal",
        "I am having a moderate amount of extra sleeplessness compared to normal",
        "My sleep has been severely affected"
      ]
    },
    {
      id: "sleeplessness_details",
      type: "text",
      question: "If you have been having more sleeplessness than normal, please explain what this is like for you. Do you have trouble falling asleep? Do you wake up earlier in the morning? Are you waking up for no reason in the middle of the night and having trouble falling back to sleep?",
      maxLength: 500
    },
    {
      id: "tiredness",
      type: "multiple_choice",
      question: "Have you been suffering from any unusual tiredness over the past few months?",
      options: [
        "No, I am experiencing the same amount of tiredness as before",
        "I have been mildly more tired than previously",
        "I have been moderately more tired than previously",
        "I have been severely more tired than previously"
      ]
    },
    {
      id: "backaches",
      type: "multiple_choice",
      question: "Have you been suffering from any new backaches over the past months which are not the result of an injury or easily explained?",
      options: [
        "No, I have not been experiencing any new backaches",
        "I have been experiencing some mild new backaches compared to normal",
        "I have been having moderately more back aches than usual",
        "I have been having many more backaches than normal which are affecting my life"
      ]
    },
    {
      id: "joint_pains",
      type: "multiple_choice",
      question: "Have you been suffering from any new joint pains over the past months which are not the result of an injury or easily explained?",
      options: [
        "No, I have not been experiencing any new joint pains",
        "I have had some mild new joint pains",
        "I have had some joint pains which are moderately affecting my life",
        "I have had new joint pains which are severely affecting my life"
      ]
    },
    {
      id: "joint_pains_details",
      type: "text",
      question: "If you have been having any new joint pains, please explain where these are and what they are like. Are they constant or do they come and go. Are they sharp of achey. Do certain activities bring them on?",
      maxLength: 500
    },
    {
      id: "muscle_pains",
      type: "multiple_choice",
      question: "Have you been suffering from any new muscle pains which are not the result of an injury or easily explained?",
      options: [
        "No, I have not been suffering from any new muscle pains",
        "I have been experiencing some new mild muscle pains",
        "I have been experiencing some new muscle pains which are having a moderate impact on my life",
        "I have been experiencing some muscle pains which are having a severe impact on my life"
      ]
    },
    {
      id: "muscle_pains_details",
      type: "text",
      question: "If you have been having new muscle pains, please explain what these are like. When are they worse? What are they like? Are they constant or do they come and go? What makes them feel better?",
      maxLength: 500
    },
    {
      id: "facial_hair",
      type: "multiple_choice",
      question: "Have you noticed an increase in facial hair over the past few months?",
      options: [
        "No, I have not noticed any new facial hair",
        "I have noticed a mild increase in facial hair",
        "I have noticed a moderate increase in facial hair",
        "I have noticed a severe increase in facial hair"
      ]
    },
    {
      id: "skin_dryness",
      type: "multiple_choice",
      question: "Has your skin felt more dry over the past few months?",
      options: [
        "No, my skin has felt the same as it normally does",
        "My skin is experiencing some mild extra dryness",
        "My skin is moderately more dry than previously",
        "My skin is severely more dry than previously"
      ]
    },
    {
      id: "crawling_skin",
      type: "multiple_choice",
      question: "Over the past few months have you noticed any new feelings of crawling under the skin or on the skin?",
      options: [
        "No, I have not noticed any new feelings a crawling under or on my skin",
        "I have had some new mild feelings of crawling under my skin",
        "I have had some moderate feelings of crawling under my skin",
        "I have been experiencing some severe feelings of crawling under my skin"
      ]
    },
    {
      id: "sex_drive",
      type: "multiple_choice",
      question: "Over the past few months have you felt a reduction in your sex drive? That is, less sexual feelings?",
      options: [
        "No, my sex drive is the same a normal",
        "I have had a mild reduction in my sex drive",
        "I have experienced a moderate reduction in my sex drive",
        "I have experienced a severe reduction in my sex drive"
      ]
    },
    {
      id: "vaginal_dryness",
      type: "multiple_choice",
      question: "Over the past months have you felt that your vagina is more dry or irritated than previously?",
      options: [
        "No, my vagina feels the same as normal",
        "I have been experiencing some mild vaginal dryness or irritation",
        "My vagina is moderately more irritated or dry than normal",
        "My vagina is severely more dry or irritated than normal"
      ]
    },
    {
      id: "intercourse_comfort",
      type: "multiple_choice",
      question: "Over the past months have you found intercourse more uncomfortable than previously?",
      options: [
        "No, intercourse is the same level of comfort as always",
        "Intercourse is mildly more uncomfortable than normal",
        "Intercourse is moderately more uncomfortable than normal",
        "Intercourse is severely more uncomfortable than normal"
      ]
    },
    {
      id: "urination_frequency",
      type: "multiple_choice",
      question: "Over the past months has there been an increase in the frequency of urination?",
      options: [
        "No, my urine frequency is the same as it normally is",
        "I have had a mild increase in the frequency of urination",
        "My urine frequency has increased moderately",
        "My urine frequency has increased severely"
      ]
    },
    {
      id: "brain_fog",
      type: "multiple_choice",
      question: "Over the past months has there been an increase in brain fog?",
      options: [
        "No, I do not feel any more foggy than normal",
        "I have had a mild increase in brain fog",
        "My brain fog has increased moderately",
        "My brain fog has increased severely"
      ]
    }
  ];

  useEffect(() => {
    // Load responses from context (no async needed!)
    const moduleResponses = getModuleResponses('module_1');
    setResponses(moduleResponses);
  }, [getModuleResponses]);

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveResponses = async () => {
    const success = await saveToContext('module_1', responses);
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to save responses. Please try again.",
        variant: "destructive"
      });
    }
    return success;
  };

  const validateMultipleChoiceAnswers = () => {
    const multipleChoiceQuestions = questions.filter(q => q.type === 'multiple_choice');
    const unansweredQuestions = multipleChoiceQuestions.filter(q => !responses[q.id] || responses[q.id].trim() === '');
    
    if (unansweredQuestions.length > 0) {
      toast({
        title: "Please Complete All Multiple Choice Questions",
        description: "At the end of the process you will need to have given an answer to all the multiple choice questions in this section. Please go back and give an answer to all the multiple choice questions. You will be able to review and change your answers later if you wish.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    // First validate that all multiple choice questions are answered
    if (!validateMultipleChoiceAnswers()) {
      return;
    }

    setIsLoading(true);
    const success = await saveResponses();
    if (success) {
      navigate('/consultation/module-2a');
    }
    setIsLoading(false);
  };

  // Only show loading during the initial context load
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

  return (
    <ModuleLayout
      title="Your Symptom Snapshot"
      onNext={handleNext}
      isFirstModule={true}
      isLoading={isLoading}
    >
      <div className="space-y-8">
        {questions.map((question) => (
          question.type === 'multiple_choice' ? (
            <MultipleChoiceQuestion
              key={question.id}
              questionId={question.id}
              question={question.question}
              options={question.options || []}
              value={responses[question.id] || ''}
              onChange={(value) => handleResponseChange(question.id, value)}
            />
          ) : (
            <TextQuestion
              key={question.id}
              questionId={question.id}
              question={question.question}
              value={responses[question.id] || ''}
              onChange={(value) => handleResponseChange(question.id, value)}
              maxLength={question.maxLength}
            />
          )
        ))}
      </div>
    </ModuleLayout>
  );
}