-- Add unique constraint to user_responses table for proper upsert functionality
ALTER TABLE public.user_responses 
ADD CONSTRAINT user_responses_user_question_unique 
UNIQUE (user_id, question_id);