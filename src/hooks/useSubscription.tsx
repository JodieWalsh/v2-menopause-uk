import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  subscription_type: string;
  status: string;
  expires_at: string | null;
  discount_code: string | null;
  amount_paid: number | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasValidSubscription, setHasValidSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setSubscription(null);
          setHasValidSubscription(false);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking subscription:', error);
          setSubscription(null);
          setHasValidSubscription(false);
        } else if (!data) {
          setSubscription(null);
          setHasValidSubscription(false);
        } else {
          setSubscription(data);
          // Check if subscription is active and not expired
          const isActive = data.status === 'active';
          const isNotExpired = !data.expires_at || new Date(data.expires_at) > new Date();
          setHasValidSubscription(isActive && isNotExpired);
        }
      } catch (error) {
        console.error('Error in subscription check:', error);
        setSubscription(null);
        setHasValidSubscription(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    subscription,
    hasValidSubscription,
    loading,
    refetch: () => {
      setLoading(true);
      // Re-run the subscription check
      const checkSubscription = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            setSubscription(null);
            setHasValidSubscription(false);
            setLoading(false);
            return;
          }

          const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error checking subscription:', error);
            setSubscription(null);
            setHasValidSubscription(false);
          } else if (!data) {
            setSubscription(null);
            setHasValidSubscription(false);
          } else {
            setSubscription(data);
            const isActive = data.status === 'active';
            const isNotExpired = !data.expires_at || new Date(data.expires_at) > new Date();
            setHasValidSubscription(isActive && isNotExpired);
          }
        } catch (error) {
          console.error('Error in subscription check:', error);
          setSubscription(null);
          setHasValidSubscription(false);
        } finally {
          setLoading(false);
        }
      };

      checkSubscription();
    }
  };
}