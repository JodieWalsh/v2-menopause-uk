import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/ModuleLayout";
import { TextQuestion } from "@/components/QuestionComponents";
import { useToast } from "@/hooks/use-toast";

interface Responses {
  [key: string]: string;
}

export default function Module4() {
  const [responses, setResponses] = useState<Responses>({});
  const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const questions = [
    {
      id: "doctor_questions",
      question: "Do you have any specific questions for your doctor or thoughts that you wish to discuss? If so, please write them here.",
      section: "Questions for Doctor"
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
        .eq('module_name', 'module_4');

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
            module_name: 'module_4',
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
          module_name: 'module_4',
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
      navigate('/consultation/module-5');
    }
    setIsLoading(false);
  };

  const handlePrevious = () => {
    navigate('/consultation/module-3');
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
      title="Menopause Medical Treatments: Your Guide to Feeling Fantastic!"
      onNext={handleNext}
      onPrevious={handlePrevious}
      isLoading={isLoading}
    >
      {/* Main content text box */}
      <InfoBox>
        <strong>So, your body's going through the change, and while it's a totally natural process, sometimes it brings along some unwanted guests like hot flashes, mood swings, or sleep troubles. Luckily, there are some awesome medical tools we can use to feel like your amazing self again!</strong>
        <br /><br />
        <strong>Hormone Therapy (HT): Think of it as Hormone Replenishment!</strong>
        <br /><br />
        The star player in menopause treatments is often Hormone Therapy (HT). Remember those hormones estrogen and progesterone that we talked about? When menopause hits, your body makes less of them, and that can cause some of those not-so-fun symptoms. HT is like giving your body a little boost of these hormones to help balance things out.
        <br /><br />
        <strong>Estrogen: The Queen of Calm</strong>
        <br /><br />
        Estrogen is super important for so many things in your body, from keeping your bones strong to helping you sleep soundly. During menopause, a drop in estrogen can cause hot flashes (sudden waves of heat), vaginal dryness, and even impact your mood. Estrogen therapy can help relieve these symptoms and keep you feeling cool and comfortable. It comes in different forms like pills, patches, creams, or even vaginal rings, so you can choose what works best for you!
        <br /><br />
        <strong>Progesterone: Estrogen's Trusty Sidekick</strong>
        <br /><br />
        Now, if you still have your uterus (the place where babies grow), your doctor will likely prescribe estrogen along with progesterone. Why? Because estrogen alone can sometimes cause the lining of the uterus to thicken too much, which isn't ideal. Progesterone helps keep everything in balance and protects your uterus. It's like the responsible friend who makes sure everyone's playing fair! Progesterone comes in a variety of forms that can be taken orally, topically or through IUD insertion.
        <br /><br />
        <strong>Other Hormone Helpers:</strong>
        <br /><br />
        <strong>Testosterone: Not Just for the Guys!</strong>
        <br /><br />
        You might think of testosterone as a "male" hormone, but guess what? Women have it too! It plays a role in energy levels, muscle strength, and even sex drive. During menopause, some women experience a drop in testosterone, which can lead to fatigue or decreased libido. In some cases, doctors might prescribe a low dose of testosterone to help boost these areas. However, it's important to note that testosterone therapy for women is still being researched, and it's not right for everyone.
        <br /><br />
        <strong>Tibolone: The All-in-One Option</strong>
        <br /><br />
        Tibolone is a synthetic hormone that acts like estrogen, progesterone, and even a little bit of testosterone in the body. It can help with hot flashes, vaginal dryness, bone health, and mood – all in one! It's like a multi-tasking superhero for menopause symptoms. However, like all medications, tibolone has potential risks and benefits, so it's important to discuss it with your doctor to see if it's the right choice for you.
        <br /><br />
        <strong>Important Things to Remember:</strong>
        <br /><br />
        <strong>Everyone's Different:</strong> Menopause affects everyone differently, and so will the treatments! What works for one person might not work for another. It's all about finding the right approach for you.
        <br /><br />
        <strong>Talk to Your Doctor:</strong> Before starting any treatment, have an open and honest conversation with your doctor. They can help you weigh the pros and cons of each option and create a personalized plan that fits your needs.
        <br /><br />
        <strong>Lifestyle Matters:</strong> Don't forget that healthy lifestyle choices can make a big difference too! Eating a balanced diet, exercising regularly, managing stress, and getting enough sleep can all help you feel your best during menopause. There is evidence that CBT (Cognitive Behavioural Therapy) can significantly positively impact on your ability to cope with menopausal symptoms. Lifestyle choices are very important.
        <br /><br />
        Menopause is a natural part of life, and with the right tools and support, you can navigate this change with confidence and feel fantastic!
      </InfoBox>

      <div className="space-y-8">
        <div>
          {questionsBySection["Questions for Doctor"]?.map((question) => (
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
      </div>
    </ModuleLayout>
  );
}
