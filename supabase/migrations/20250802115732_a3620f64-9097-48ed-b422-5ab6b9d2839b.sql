-- Insert subscription record for the user who used discount code
INSERT INTO public.user_subscriptions (
  user_id,
  subscription_type,
  status,
  amount_paid,
  currency,
  created_at,
  updated_at
) VALUES (
  '6c58dcbc-406a-4e2c-a35f-ffd13b1ae866',
  'free',
  'active',
  0,
  'usd',
  now(),
  now()
);