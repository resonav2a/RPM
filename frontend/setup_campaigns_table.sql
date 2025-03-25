-- IMPORTANT: Run this entire script as a whole, not line by line
-- This will create the campaigns table with all necessary setup

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

-- Create campaigns table for marketing planner
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_all_day BOOLEAN DEFAULT true,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
  color TEXT,
  blast_mode BOOLEAN DEFAULT false,
  channels TEXT[],
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Drop the old policy that restricts viewing to owners
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campaigns;

-- Create a new policy to allow any authenticated user to view all campaigns
CREATE POLICY "Users can view all campaigns" ON campaigns
  FOR SELECT
  USING (auth.role() = 'authenticated'); -- Ensures the user is logged in

-- Policy for users to insert their own campaigns
CREATE POLICY "Users can insert their own campaigns" ON campaigns
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Policy for users to update their own campaigns
CREATE POLICY "Users can update their own campaigns" ON campaigns
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Policy for users to delete their own campaigns
CREATE POLICY "Users can delete their own campaigns" ON campaigns
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Create trigger to update campaigns.updated_at
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();