-- Alter tasks table to add campaign_id
ALTER TABLE IF EXISTS tasks
ADD COLUMN campaign_id UUID REFERENCES campaigns(id);

-- This will create a foreign key relationship between tasks and campaigns
-- The campaign_id can be NULL if a task is not associated with any campaign

-- Create an index on campaign_id for better query performance
CREATE INDEX IF NOT EXISTS tasks_campaign_id_idx ON tasks(campaign_id);