import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQ = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const faqs = [
    {
      id: "what-is-app",
      question: "What exactly does this app do?",
      answer: "Think of us as your menopause consultation prep buddy! We guide you through a comprehensive assessment that covers your symptoms, medical history, and health goals. You'll get a personalized report to share with your doctor, making your appointment more focused and productive. No more forgetting important details or wondering what to ask!"
    },
    {
      id: "how-long",
      question: "How long does the assessment take?",
      answer: "Most people complete it in 30 minutes, but you can take your time! You can save your progress and come back anytime. We'd rather you think through your answers carefully than rush through it. After all, this is about YOUR health journey."
    },
    {
      id: "medical-advice",
      question: "Will you give me medical advice?",
      answer: "Nope! We're like a really good friend who helps you organize your thoughts before seeing the doctor. We provide educational information and help you track your symptoms, but we always encourage you to discuss everything with your healthcare provider. They're the medical experts - we're just here to help you make the most of your time with them."
    },
    {
      id: "data-security",
      question: "Is my personal information safe?",
      answer: "Absolutely! We take your privacy as seriously as you do. Your data is encrypted and stored securely in our database for up to one year to help with follow-up consultations. We won't share your information with anyone unless you ask us to or the law requires it. Your menopause journey is personal, and we respect that completely."
    },
    {
      id: "cost",
      question: "How much does it cost?",
      answer: "The assessment costs £19 in the UK, $25 in the US, and AU$39 in Australia. One payment gives you access to the full assessment and your personalized report. Think of it as the cost of a nice dinner out, but for something that could significantly improve your healthcare experience!"
    },
    {
      id: "after-assessment",
      question: "What happens after I complete the assessment?",
      answer: "You'll get a comprehensive, personalized report that summarizes your symptoms, concerns, and questions. You can download it as a PDF to take to your doctor appointment. Many users find their consultations become much more focused and productive when they have this organized information to reference."
    },
    {
      id: "doctor-reaction",
      question: "Will my doctor be okay with me bringing this report?",
      answer: "Most doctors love it when patients come prepared! Your report helps them understand your experience more quickly and thoroughly. It's like bringing a well-organized summary instead of trying to remember everything on the spot. If your doctor seems hesitant, you can explain that it's just your own organized thoughts to help make the appointment more efficient."
    },
    {
      id: "emergency",
      question: "What if I'm having a medical emergency?",
      answer: "Please contact emergency services immediately! Our app is designed for routine consultation preparation, not emergency situations. If you're experiencing severe symptoms or health concerns that need immediate attention, always seek urgent medical care first."
    },
    {
      id: "regions",
      question: "Do you work in my country?",
      answer: "Currently, we're tailored for the UK, US, and Australia, with region-specific medical information and pricing. The assessment principles work anywhere, but some medical references and guidelines are specific to these countries' healthcare systems."
    },
    {
      id: "technical-issues",
      question: "What if I have technical problems?",
      answer: "Don't worry! You can reach out to us through the Contact Us page, and our support team will help you sort things out. We typically respond within 2 business days. For urgent technical issues, just put 'URGENT' in your message subject line."
    },
    {
      id: "update-info",
      question: "Can I update my information later?",
      answer: "Your data is saved for up to one year, so you can log back in and reference your previous responses. While the current version focuses on creating your initial comprehensive report, we're always working on ways to make the experience even better for return visits."
    },
    {
      id: "results-guarantee",
      question: "Do you guarantee specific results?",
      answer: "We can't promise specific health outcomes (every menopause journey is unique!), but we can promise that you'll be better prepared for your doctor consultation. Most users tell us they feel more confident and organized when discussing their symptoms and concerns with their healthcare provider."
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <HelpCircle className="h-4 w-4" />
            Frequently Asked Questions
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
            FAQ
          </h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about your menopause consultation prep
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Common Questions</CardTitle>
            <CardDescription>
              Click on any question to see the answer. Still have questions? Feel free to contact us!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq) => (
              <Collapsible key={faq.id}>
                <CollapsibleTrigger
                  onClick={() => toggleItem(faq.id)}
                  className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 rounded-lg transition-colors group"
                >
                  <span className="font-medium text-foreground group-hover:text-primary">
                    {faq.question}
                  </span>
                  <ChevronDown 
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      openItems.includes(faq.id) ? 'rotate-180' : ''
                    }`} 
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-4">
                Our support team is here to help! We typically respond within 2 business days.
              </p>
              <a 
                href="/contact" 
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Contact Us
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default FAQ;