-- Main SQL file to run all database fixes at once
-- Run this file in the Supabase SQL Editor to fix all database issues

-- Important: This will drop and recreate tables, all data will be lost

-- First, drop all existing tables to avoid dependency issues
DROP TABLE IF EXISTS task_comment_reactions CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- Create the UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'blocked', 'done')),
  priority TEXT NOT NULL CHECK (priority IN ('p0', 'p1', 'p2', 'p3')),
  due_date DATE,
  assignee_id UUID REFERENCES auth.users(id),
  tags TEXT[],
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  campaign_id UUID
);

-- Create the dependencies table
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

-- Create the comments table
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  mentioned_users UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the reactions table
CREATE TABLE task_comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES task_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each user can have only one instance of each reaction type per comment
  CONSTRAINT unique_task_comment_reaction UNIQUE (comment_id, user_id, reaction)
);

-- Create indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_campaign_id ON tasks(campaign_id);

CREATE INDEX idx_task_dependencies_parent_id ON task_dependencies(parent_task_id);
CREATE INDEX idx_task_dependencies_dependent_id ON task_dependencies(dependent_task_id);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX idx_task_comments_parent_id ON task_comments(parent_comment_id);
CREATE INDEX idx_task_comment_reactions_comment_id ON task_comment_reactions(comment_id);

-- Enable Row Level Security on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comment_reactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tasks
CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for task_dependencies
CREATE POLICY "Users can view any task dependency" ON task_dependencies FOR SELECT USING (true);
CREATE POLICY "Users can insert task dependencies they own" ON task_dependencies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own task dependencies" ON task_dependencies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own task dependencies" ON task_dependencies FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for task_comments
CREATE POLICY "Users can view any task comment" ON task_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON task_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON task_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON task_comments FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for task_comment_reactions
CREATE POLICY "Users can view any comment reaction" ON task_comment_reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reactions" ON task_comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions" ON task_comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notify completion
DO $$
BEGIN
  RAISE NOTICE 'Database schema fixes completed successfully!';
END $$;