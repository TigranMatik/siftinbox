-- AI Email Action Assistant Database Schema
-- Run this in your Supabase SQL Editor

-- Create custom types/enums
CREATE TYPE email_provider AS ENUM ('gmail', 'outlook');
CREATE TYPE deadline_source AS ENUM ('explicit', 'inferred', 'none');
CREATE TYPE priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE action_status AS ENUM ('pending', 'completed', 'dismissed', 'snoozed');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_time TIME NOT NULL DEFAULT '08:00:00',
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  notification_preferences JSONB NOT NULL DEFAULT '{"email": true, "push": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email connections table
CREATE TABLE email_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider email_provider NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  email_address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, email_address)
);

-- Emails processed table
CREATE TABLE emails_processed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES email_connections(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  sender TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_actionable BOOLEAN NOT NULL DEFAULT false,
  raw_content TEXT,
  UNIQUE(connection_id, external_id)
);

-- Action items table
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_id UUID NOT NULL REFERENCES emails_processed(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  deadline_source deadline_source NOT NULL DEFAULT 'none',
  priority priority NOT NULL DEFAULT 'medium',
  status action_status NOT NULL DEFAULT 'pending',
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily briefings table
CREATE TABLE daily_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  briefing_date DATE NOT NULL,
  summary TEXT NOT NULL,
  action_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  UNIQUE(user_id, briefing_date)
);

-- Create indexes for better query performance
CREATE INDEX idx_email_connections_user_id ON email_connections(user_id);
CREATE INDEX idx_email_connections_active ON email_connections(user_id, is_active);
CREATE INDEX idx_emails_processed_user_id ON emails_processed(user_id);
CREATE INDEX idx_emails_processed_connection ON emails_processed(connection_id);
CREATE INDEX idx_action_items_user_id ON action_items(user_id);
CREATE INDEX idx_action_items_status ON action_items(user_id, status);
CREATE INDEX idx_action_items_deadline ON action_items(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_daily_briefings_user_date ON daily_briefings(user_id, briefing_date);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_processed ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for email_connections
CREATE POLICY "Users can view own email connections"
  ON email_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email connections"
  ON email_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email connections"
  ON email_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email connections"
  ON email_connections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for emails_processed
CREATE POLICY "Users can view own processed emails"
  ON emails_processed FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own processed emails"
  ON emails_processed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for action_items
CREATE POLICY "Users can view own action items"
  ON action_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own action items"
  ON action_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own action items"
  ON action_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own action items"
  ON action_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for daily_briefings
CREATE POLICY "Users can view own briefings"
  ON daily_briefings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own briefings"
  ON daily_briefings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own briefings"
  ON daily_briefings FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
