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
