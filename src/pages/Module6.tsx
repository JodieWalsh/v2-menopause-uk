import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/ModuleLayout";

import { useToast } from "@/hooks/use-toast";

export default function Module6() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

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
    <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6">
      <div className="text-sm text-foreground leading-relaxed">
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
      {/* Helpful hints content */}
      <InfoBox>
        <strong>Helpful hint 1:</strong> As well as collecting all this information it is likely that your GP or nurse will also want to measure your height and weight, blood pressure and pulse rate. So wear shoes that are easy to slip off and wear a loose shirt to make this process easier.
        <br /><br />
        <strong>Helpful hint 2:</strong> When booking your appointment please ensure that the medical receptionist knows that this appointment is for a Menopause Health Assessment.
        <br /><br />
        If you are in Australia you will most likely be eligible for a special menopause consultation rebate. The Menopause and Perimenopause Health Assessment has a rebate of $101.90 as at July 2025. For more information please refer to this link: <br />
        <a href="https://www.mbsonline.gov.au/internet/mbsonline/publishing.nsf/Content/Factsheet-Menopause+and+perimenopause+health+assessment+services" className="text-primary underline" target="_blank" rel="noopener noreferrer">
          https://www.mbsonline.gov.au/internet/mbsonline/publishing.nsf/Content/Factsheet-Menopause+and+perimenopause+health+assessment+services
        </a>
        <br /><br />
        <strong>Helpful hint 3:</strong> Please note that if you have not had a cervical screening (what we used to call a pap smear) in the past 5 years then ensure you tell the medical receptionist this at the time of booking the appointment so that they can allow time and resources for this to be done on the day. This will again save you coming back another day!
        <br /><br />
        <strong>Helpful hint 4:</strong> If you are aged over 40 in Australia then you eligible for a free mammogram. If you are over 50 your GP will encourage you to have one as part of normal screening, so book in for it before you even have your consultation with your GP for your menopause symptoms.
        <br /><br />
        <a href="https://www.health.gov.au/our-work/breastscreen-australia-program/having-a-breast-screen/who-should-have-a-breast-screen" className="text-primary underline" target="_blank" rel="noopener noreferrer">
          https://www.health.gov.au/our-work/breastscreen-australia-program/having-a-breast-screen/who-should-have-a-breast-screen
        </a>
        <br /><br />
        <strong>Helpful hint 5:</strong> Print out and bring this document with you to your consultation!
      </InfoBox>
    </ModuleLayout>
  );
}