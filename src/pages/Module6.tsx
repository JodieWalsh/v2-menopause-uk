import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { useToast } from "@/hooks/use-toast";
import { useMarket } from "@/contexts/MarketContext";
import { MARKET_CONTENT } from "@/config/marketContent";
import { useResponses } from "@/contexts/ResponseContext";

export default function Module6() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { market } = useMarket();
  const marketContent = MARKET_CONTENT[market.code];

  useEffect(() => {
    // Mark module as completed since it has no questions to load
    markModuleCompleted();
  }, []);

  const markModuleCompleted = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: progressError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          module_name: 'module_6',
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,module_name',
          ignoreDuplicates: false
        });

      if (progressError) {
        console.error('Error updating progress:', progressError);
      }
    } catch (error) {
      console.error('Error marking module completed:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleNext = () => {
    navigate('/consultation/summary');
  };

  const handlePrevious = () => {
    navigate('/consultation/module-5');
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
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
      <div className="text-sm sm:text-base text-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );

  return (
    <ModuleLayout
      title="Helpful Hints"
      onNext={handleNext}
      onPrevious={handlePrevious}
      isLoading={isLoading}
    >
      <div className="space-y-6 sm:space-y-8">
        <InfoBox>
        <strong>Helpful hint 1:</strong> As well as collecting all this information it is likely that your {marketContent.helpfulHints.terminology.gp} or nurse will also want to measure your height and weight, blood pressure and pulse rate. So wear shoes that are easy to slip off and wear a loose shirt to make this process easier.
        <br /><br />
        <strong>Helpful hint 2:</strong> When booking your {marketContent.helpfulHints.terminology.consultation} please ensure that the medical receptionist knows that this {marketContent.helpfulHints.terminology.consultation} is for a Menopause Health Assessment.
        <br /><br />
        {marketContent.helpfulHints.rebateInfo && (
          <>
            {marketContent.helpfulHints.rebateInfo.text} {marketContent.helpfulHints.rebateInfo.link && (
              <>
                <br />
                <a href={marketContent.helpfulHints.rebateInfo.link} className="text-primary underline" target="_blank" rel="noopener noreferrer">
                  {marketContent.helpfulHints.rebateInfo.link}
                </a>
              </>
            )}
            <br /><br />
          </>
        )}
        <strong>Helpful hint 3:</strong> Please note that if you have not had a cervical screening (what we used to call a pap smear) in the past 5 years then ensure you tell the medical receptionist this at the time of booking the {marketContent.helpfulHints.terminology.consultation} so that they can allow time and resources for this to be done on the day. This will again save you coming back another day!
        <br /><br />
        <strong>Helpful hint 4:</strong> 
        <div 
          className="mt-2"
          dangerouslySetInnerHTML={{ __html: marketContent.helpfulHints.mammogramInfo.text }}
        />
        {marketContent.helpfulHints.mammogramInfo.link && (
          <div className="mt-4">
            <a href={marketContent.helpfulHints.mammogramInfo.link} className="text-primary underline" target="_blank" rel="noopener noreferrer">
              {marketContent.helpfulHints.mammogramInfo.link}
            </a>
          </div>
        )}
        <br />
        <strong>Helpful hint 5:</strong> Print out and bring this document with you to your consultation!
        </InfoBox>
      </div>
    </ModuleLayout>
  );
}