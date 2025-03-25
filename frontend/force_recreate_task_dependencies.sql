-- First, drop the task_dependencies table if it exists
DROP TABLE IF EXISTS task_dependencies;

-- Ensure we have UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create task_dependencies table with a simpler approach
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

-- Add foreign key constraints separately to handle errors gracefully
DO $$
BEGIN
  -- Add foreign key for task_id if tasks table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    ALTER TABLE task_dependencies 
    ADD CONSTRAINT fk_task_dependencies_task_id 
    FOREIGN KEY (task_id) 
    REFERENCES tasks(id)
    ON DELETE CASCADE;
  END IF;

  -- Add foreign key for dependency_id if tasks table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    ALTER TABLE task_dependencies 
    ADD CONSTRAINT fk_task_dependencies_dependency_id 
    FOREIGN KEY (dependency_id) 
    REFERENCES tasks(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_dependency_id ON task_dependencies(dependency_id);

-- Enable Row Level Security
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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
