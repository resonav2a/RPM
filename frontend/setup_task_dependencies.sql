-- Create task_dependencies junction table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Prevent duplicate dependencies
  CONSTRAINT unique_task_dependency UNIQUE (task_id, dependency_id),
  -- Prevent self-referencing dependencies
  CONSTRAINT prevent_self_dependency CHECK (task_id != dependency_id)
);

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
