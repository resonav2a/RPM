-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'blocked', 'done')),
  priority TEXT NOT NULL CHECK (priority IN ('p0', 'p1', 'p2', 'p3')),
  dueDate DATE,
  assigneeId UUID REFERENCES auth.users(id),
  tags TEXT[],
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for users to select their own tasks
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Policy for users to insert their own tasks
CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Policy for users to update their own tasks
CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Policy for users to delete their own tasks
CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add an example task for testing (optional)
-- IMPORTANT: Only uncomment if you're logged in via the Supabase UI when running this SQL
-- otherwise the auth.uid() will be null and violate the NOT NULL constraint
-- INSERT INTO tasks (title, status, priority)
-- VALUES ('Example Task', 'todo', 'p2');

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
-- Policy for users to view their own documents
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (
    auth.uid() = user_id OR
    visibility = 'public' OR
    (visibility = 'shared' AND
     EXISTS (
       SELECT 1 FROM document_shares
       WHERE document_id = documents.id AND user_id = auth.uid()
     ))
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

-- Create document_shares table for shared documents
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(document_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_shares
CREATE POLICY "Document owners can manage shares" ON document_shares
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_id AND documents.user_id = auth.uid()
    )
  );

-- Create trigger to update documents.updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create campaigns table for marketing planner
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_all_day BOOLEAN DEFAULT true,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
  color TEXT,
  blast_mode BOOLEAN DEFAULT false,
  channels TEXT[],
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for users to view their own campaigns
CREATE POLICY "Users can view their own campaigns" ON campaigns
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Policy for users to insert their own campaigns
CREATE POLICY "Users can insert their own campaigns" ON campaigns
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Policy for users to update their own campaigns
CREATE POLICY "Users can update their own campaigns" ON campaigns
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Policy for users to delete their own campaigns
CREATE POLICY "Users can delete their own campaigns" ON campaigns
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Create trigger to update campaigns.updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();