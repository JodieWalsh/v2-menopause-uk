-- Create user_subscriptions table to track payment status
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_type TEXT NOT NULL DEFAULT 'paid',
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'cancelled'
  stripe_customer_id TEXT,
  stripe_session_id TEXT,
  discount_code TEXT,
  amount_paid INTEGER, -- amount in cents
  currency TEXT DEFAULT 'usd',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_subscription UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Edge functions can insert subscriptions" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Edge functions can update subscriptions" 
ON public.user_subscriptions 
FOR UPDATE 
USING (true);

-- Create trigger to update updated_at column
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user has valid subscription
CREATE OR REPLACE FUNCTION public.user_has_valid_subscription(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions
    WHERE user_id = user_id_param
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;