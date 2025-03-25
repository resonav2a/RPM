-- Ensure we have UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if the tasks table already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks'
  ) THEN
    -- Create the tasks table
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
    
    -- Create indexes for improved performance
    CREATE INDEX idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
    CREATE INDEX idx_tasks_campaign_id ON tasks(campaign_id);
    CREATE INDEX idx_tasks_status ON tasks(status);
    CREATE INDEX idx_tasks_priority ON tasks(priority);
    CREATE INDEX idx_tasks_due_date ON tasks(due_date);
    
    -- Enable Row Level Security
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
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
    
    -- Set up automatic updated_at trigger function if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM pg_proc 
      WHERE proname = 'update_updated_at_column'
    ) THEN
      CREATE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    END IF;
    
    -- Create trigger for updated_at
    CREATE TRIGGER update_tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert sample tasks for testing if needed
-- Uncomment this section to add sample data
/*
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tasks LIMIT 1) THEN
    INSERT INTO tasks (title, description, status, priority, user_id)
    VALUES 
      ('Set up database', 'Configure Supabase tables and RLS policies', 'done', 'p1', auth.uid()),
      ('Implement task management', 'Create frontend components for task CRUD operations', 'in_progress', 'p0', auth.uid()),
      ('Add user authentication', 'Set up login and registration flows', 'todo', 'p2', auth.uid()),
      ('Design UI mockups', 'Create wireframes for all main views', 'blocked', 'p1', auth.uid());
  END IF;
END $$;
*/
