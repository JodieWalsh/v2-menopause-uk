-- Enable RLS on webhook_events table
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policies to restrict access to webhook_events table
-- Only edge functions with service role should access this table
CREATE POLICY "Service role only access" ON public.webhook_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');