-- Add welcome_email_sent flag to prevent duplicate welcome emails
ALTER TABLE public.user_subscriptions 
ADD COLUMN welcome_email_sent BOOLEAN NOT NULL DEFAULT false;