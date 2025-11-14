-- Create table to track document email sends and prevent duplicates
CREATE TABLE document_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    document_type TEXT NOT NULL DEFAULT 'consultation_summary',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add index for efficient duplicate checking
CREATE INDEX idx_document_emails_user_created ON document_emails(user_id, created_at DESC);

-- Add RLS policies
ALTER TABLE document_emails ENABLE ROW LEVEL SECURITY;

-- Users can only see their own email records
CREATE POLICY "Users can view own document emails" ON document_emails
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert email records
CREATE POLICY "Service role can insert document emails" ON document_emails
    FOR INSERT
    WITH CHECK (true);