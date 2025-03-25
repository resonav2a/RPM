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

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  mentioned_users UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comment_reactions table for emoji reactions
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES task_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each user can have only one instance of each reaction type per comment
  CONSTRAINT unique_user_reaction UNIQUE (comment_id, user_id, reaction)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_parent_id ON task_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);

-- Enable Row Level Security
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_comments
CREATE POLICY "Users can view any task comment"
  ON task_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own comments"
  ON task_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON task_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON task_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for comment_reactions
CREATE POLICY "Users can view any comment reaction"
  ON comment_reactions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own reactions"
  ON comment_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON comment_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to update "updated_at" column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
