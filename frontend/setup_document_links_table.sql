-- IMPORTANT: Run this entire script as a whole, not line by line
-- This will create the document_links table with all necessary setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create document_links table for associating documents with campaigns or tasks
CREATE TABLE IF NOT EXISTS document_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('campaign', 'task')),
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS document_links_document_id_idx ON document_links(document_id);
CREATE INDEX IF NOT EXISTS document_links_entity_idx ON document_links(entity_type, entity_id);

-- Enable Row Level Security
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for users to view their own document links
CREATE POLICY "Users can view their own document links" ON document_links
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Policy for users to insert their own document links
CREATE POLICY "Users can insert their own document links" ON document_links
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Policy for users to update their own document links
CREATE POLICY "Users can update their own document links" ON document_links
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Policy for users to delete their own document links
CREATE POLICY "Users can delete their own document links" ON document_links
  FOR DELETE USING (
    auth.uid() = user_id
  );