-- Campaigns table setup with shared access
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    color TEXT DEFAULT '#4299E1',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern TEXT,
    visibility TEXT DEFAULT 'team'
);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Policy to allow ALL authenticated users to select ANY campaign
CREATE POLICY select_all_campaigns ON campaigns
    FOR SELECT 
    USING (true);

-- Policy to allow ALL authenticated users to insert campaigns
CREATE POLICY insert_all_campaigns ON campaigns
    FOR INSERT
    WITH CHECK (true);

-- Policy to allow ALL authenticated users to update ANY campaign
CREATE POLICY update_all_campaigns ON campaigns
    FOR UPDATE
    USING (true);

-- Policy to allow ALL authenticated users to delete ANY campaign
CREATE POLICY delete_all_campaigns ON campaigns
    FOR DELETE
    USING (true);