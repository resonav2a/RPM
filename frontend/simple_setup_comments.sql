-- Task comments table setup with shared access
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    reactions JSONB DEFAULT '{}'::JSONB
);

-- Enable Row Level Security
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Policy to allow ALL authenticated users to select ANY comment
CREATE POLICY select_all_comments ON task_comments
    FOR SELECT 
    USING (true);

-- Policy to allow ALL authenticated users to insert comments
CREATE POLICY insert_all_comments ON task_comments
    FOR INSERT
    WITH CHECK (true);

-- Policy to allow ALL authenticated users to update ANY comment
CREATE POLICY update_all_comments ON task_comments
    FOR UPDATE
    USING (true);

-- Policy to allow ALL authenticated users to delete ANY comment
CREATE POLICY delete_all_comments ON task_comments
    FOR DELETE
    USING (true);