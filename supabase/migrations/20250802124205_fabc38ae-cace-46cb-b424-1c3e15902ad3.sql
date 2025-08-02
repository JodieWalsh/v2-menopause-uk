-- Create a free subscription for the current user who used the discount code
INSERT INTO user_subscriptions (
  user_id, 
  subscription_type, 
  status, 
  amount_paid, 
  currency,
  expires_at
) VALUES (
  'd86e8884-25ae-4732-a9d4-3735c94c5ca4',
  'free',
  'active',
  0,
  'usd',
  NULL
);