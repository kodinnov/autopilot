-- Autopilot Database Schema
-- Run once against Supabase project: faaydjgutizvnkusivku

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- X/Twitter OAuth tokens
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled tweets
CREATE TABLE IF NOT EXISTS scheduled_tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | posted | failed
  tweet_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tokens_clerk_id ON tokens(clerk_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tweets_clerk_id ON scheduled_tweets(clerk_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tweets_status ON scheduled_tweets(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tweets_scheduled_for ON scheduled_tweets(scheduled_for);
