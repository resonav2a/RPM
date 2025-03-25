-- Task dependencies table setup with shared access
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Policy to allow ALL authenticated users to select ANY dependency
CREATE POLICY select_all_dependencies ON task_dependencies
    FOR SELECT 
    USING (true);

-- Policy to allow ALL authenticated users to insert dependencies
CREATE POLICY insert_all_dependencies ON task_dependencies
    FOR INSERT
    WITH CHECK (true);

-- Policy to allow ALL authenticated users to update ANY dependency
CREATE POLICY update_all_dependencies ON task_dependencies
    FOR UPDATE
    USING (true);

-- Policy to allow ALL authenticated users to delete ANY dependency
CREATE POLICY delete_all_dependencies ON task_dependencies
    FOR DELETE
    USING (true);