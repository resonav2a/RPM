-- Ensure we have UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, check if tasks table exists and create it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks'
  ) THEN
    -- Create tasks table
    CREATE TABLE tasks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'p2',
      due_date DATE,
      assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      tags TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      user_id UUID REFERENCES auth.users(id),
      campaign_id UUID,
      scheduled_day TEXT,
      is_blocker BOOLEAN DEFAULT FALSE,
      blocker_reason TEXT
    );
    
    -- Add indexes
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_campaign_id ON tasks(campaign_id);
    
    -- Enable RLS
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view all tasks"
      ON tasks FOR SELECT
      USING (true);
      
    CREATE POLICY "Users can insert their own tasks"
      ON tasks FOR INSERT
      WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update their own tasks"
      ON tasks FOR UPDATE
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete their own tasks"
      ON tasks FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Drop the existing task_dependencies table if it exists
DROP TABLE IF EXISTS task_dependencies CASCADE;

-- Now create task_dependencies table
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'blocks',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Prevent duplicate dependencies
  CONSTRAINT unique_task_dependency UNIQUE (parent_task_id, dependent_task_id),
  -- Prevent self-referencing dependencies
  CONSTRAINT prevent_self_dependency CHECK (parent_task_id != dependent_task_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_dependencies_parent_id ON task_dependencies(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_dependent_id ON task_dependencies(dependent_task_id);

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
