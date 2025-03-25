-- Ensure the user profiles table exists first
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'User',
  notification_preferences JSONB DEFAULT '{"email": true, "taskAssignments": true, "taskUpdates": true, "marketingReminders": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT user_profiles_user_id_key UNIQUE (user_id)
);

-- Create the campaigns table with updated structure
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all campaigns"
  ON campaigns
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create campaigns"
  ON campaigns
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON campaigns
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON campaigns
  FOR DELETE
  USING (auth.uid() = user_id);

-- Set up automatic updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample campaigns if needed
INSERT INTO campaigns (title, description, status, start_date, end_date)
VALUES 
  ('Q2 Product Launch', 'Launch of our new product line', 'scheduled', '2023-05-15', '2023-05-30'),
  ('Summer Sale', 'Annual summer promotional campaign', 'draft', '2023-07-01', '2023-07-31'),
  ('Brand Refresh', 'Update of brand assets and messaging', 'active', '2023-04-01', '2023-06-30'),
  ('Holiday Marketing', 'End of year holiday marketing push', 'scheduled', '2023-11-15', '2023-12-31')
ON CONFLICT (id) DO NOTHING;
