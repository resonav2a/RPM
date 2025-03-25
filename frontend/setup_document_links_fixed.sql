-- Ensure we have UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, check if documents table exists and create it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'documents'
  ) THEN
    -- Create documents table
    CREATE TABLE documents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'private',
      tags TEXT[],
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      file_url TEXT,
      file_name TEXT,
      file_type TEXT
    );
    
    -- Add indexes
    CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility);
    
    -- Enable RLS
    ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view public documents"
      ON documents FOR SELECT
      USING (visibility = 'public');
      
    CREATE POLICY "Users can view their own documents"
      ON documents FOR SELECT
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can insert their own documents"
      ON documents FOR INSERT
      WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update their own documents"
      ON documents FOR UPDATE
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete their own documents"
      ON documents FOR DELETE
      USING (auth.uid() = user_id);
      
    -- Set up trigger for updated_at
    CREATE TRIGGER update_documents_updated_at
      BEFORE UPDATE ON documents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create document_links junction table for associating documents with tasks and campaigns
CREATE TABLE IF NOT EXISTS document_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'campaign')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate links
  CONSTRAINT unique_document_link UNIQUE (document_id, entity_id, entity_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_links_document_id ON document_links(document_id);
CREATE INDEX IF NOT EXISTS idx_document_links_entity ON document_links(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_document_links_user_id ON document_links(user_id);

-- Enable Row Level Security
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view any document link"
  ON document_links
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own document links"
  ON document_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own document links"
  ON document_links
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own document links"
  ON document_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function for updated_at if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
