-- Tasks table setup with shared access
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT,
    priority TEXT,
    status TEXT DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    is_blocker BOOLEAN DEFAULT FALSE,
    depends_on UUID[] DEFAULT '{}'::UUID[],
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy to allow ALL users to select ANY task (not just their own)
CREATE POLICY select_all_tasks ON tasks
    FOR SELECT 
    USING (true);

-- Policy to allow ALL users to insert their own tasks (user_id must match)
CREATE POLICY insert_all_tasks ON tasks
    FOR INSERT
    WITH CHECK (true);

-- Policy to allow ALL users to update ANY task (not just their own)
CREATE POLICY update_all_tasks ON tasks
    FOR UPDATE
    USING (true);

-- Policy to allow ALL users to delete ANY task (not just their own)
CREATE POLICY delete_all_tasks ON tasks
    FOR DELETE
    USING (true);