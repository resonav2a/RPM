-- Ensure we have UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the table if it exists
DROP TABLE IF EXISTS task_dependencies;

-- Create task_dependencies table 
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL,
  dependency_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Prevent duplicate dependencies
  CONSTRAINT unique_task_dependency UNIQUE (task_id, dependency_id),
  -- Prevent self-referencing dependencies
  CONSTRAINT prevent_self_dependency CHECK (task_id \!= dependency_id)
);

-- Add foreign key constraints 
ALTER TABLE task_dependencies 
ADD CONSTRAINT fk_task_dependencies_task_id 
FOREIGN KEY (task_id) 
REFERENCES tasks(id)
ON DELETE CASCADE;

ALTER TABLE task_dependencies 
ADD CONSTRAINT fk_task_dependencies_dependency_id 
FOREIGN KEY (dependency_id) 
REFERENCES tasks(id)
ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_dependency_id ON task_dependencies(dependency_id);

-- Enable Row Level Security
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view any task dependency" ON task_dependencies;
DROP POLICY IF EXISTS "Users can insert task dependencies they own" ON task_dependencies;
DROP POLICY IF EXISTS "Users can update their own task dependencies" ON task_dependencies;
DROP POLICY IF EXISTS "Users can delete their own task dependencies" ON task_dependencies;

CREATE POLICY "Users can view any task dependency"
  ON task_dependencies
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert task dependencies they own"
  ON task_dependencies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task dependencies"
  ON task_dependencies
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task dependencies"
  ON task_dependencies
  FOR DELETE
  USING (auth.uid() = user_id);
