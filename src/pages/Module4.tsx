import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { TextQuestion } from "@/components/QuestionComponents";
import { useToast } from "@/hooks/use-toast";
import { useResponses } from "@/contexts/ResponseContext";

interface Responses {
  [key: string]: string;
}

export default function Module4() {
  const [responses, setResponses] = useState<Responses>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getModuleResponses, saveResponses: saveToContext, isLoading: contextLoading } = useResponses();

  const questions = [
    {
      id: "doctor_questions",
      question: "Do you have any specific questions for your doctor or thoughts that you wish to discuss? If so, please write them here.",
      section: "Questions for Doctor"
    }
  ];

  useEffect(() => {
    // Load responses from context (instant!)
    const moduleResponses = getModuleResponses('module_4');
    setResponses(moduleResponses);
  }, [getModuleResponses]);


  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveResponses = async () => {
    const success = await saveToContext('module_4', responses);
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
      navigate('/consultation/module-5');
    }
    setIsLoading(false);
  };

  const handlePrevious = () => {
    navigate('/consultation/module-3');
  };

  // Only show loading during initial context load
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
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
      <div className="text-sm sm:text-base text-foreground leading-relaxed">
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

      <div className="space-y-6 sm:space-y-8">
        <div>
          {questionsBySection["Questions for Doctor"]?.map((question) => (
            <div key={question.id} className="bg-white/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <TextQuestion
                questionId={question.id}
                question={question.question}
                value={responses[question.id] || ''}
                onChange={(value) => handleResponseChange(question.id, value)}
                maxLength={1000}
              />
            </div>
          ))}
        </div>
      </div>
    </ModuleLayout>
  );
}
