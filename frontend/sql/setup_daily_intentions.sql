-- Create daily_intentions table for the TodayMode
CREATE TABLE IF NOT EXISTS daily_intentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  intention TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_daily_intentions_user_id ON daily_intentions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_intentions_date ON daily_intentions(date);

-- Set up RLS policies
ALTER TABLE daily_intentions ENABLE ROW LEVEL SECURITY;

-- Allow users to view/edit only their own intentions
CREATE POLICY "Users can view their own intentions"
  ON daily_intentions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own intentions"
  ON daily_intentions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own intentions"
  ON daily_intentions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own intentions"
  ON daily_intentions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_intentions_updated_at
  BEFORE UPDATE ON daily_intentions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
