-- IMPORTANT: Run this entire script as a whole, not line by line
-- This will create the tasks table with all necessary setup

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
-- Policy for users to view their own tasks
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

-- Create trigger to update tasks.updated_at
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();