-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function to update the updated_at timestamp (if it doesn't already exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private', 'shared')),
  tags TEXT[],
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for users to view their own documents and public ones
CREATE POLICY "Users can view their own documents and public ones" ON documents
  FOR SELECT USING (
    auth.uid() = user_id OR visibility = 'public'
  );

-- Policy for users to insert their own documents
CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Policy for users to update their own documents
CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Policy for users to delete their own documents
CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Create trigger to update documents.updated_at
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add a sample document (comment out if user_id is null)
-- For logged-in users, un-comment this and use it:
/* 
INSERT INTO documents (title, content, visibility, user_id)
VALUES (
  'Getting Started with Documentation', 
  '# Welcome to Documentation\n\nThis is a sample document to help you get started.\n\n## Features\n\n- Markdown support\n- Public and private documents\n- Easy organization',
  'public',
  auth.uid()
);
*/

-- For non-logged in users, create a document with a hardcoded UUID
-- IMPORTANT: Replace 'your-user-id-here' with your actual Supabase user ID
-- INSERT INTO documents (title, content, visibility, user_id)
-- VALUES (
--   'Getting Started with Documentation', 
--   '# Welcome to Documentation\n\nThis is a sample document to help you get started.\n\n## Features\n\n- Markdown support\n- Public and private documents\n- Easy organization',
--   'public',
--   '00000000-0000-0000-0000-000000000000'::UUID  -- Replace with your actual user ID
-- );