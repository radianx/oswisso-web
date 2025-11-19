-- Add this to your existing Supabase schema

-- Create global_players table for persistent player directory
CREATE TABLE IF NOT EXISTS global_players (
  nickname TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_global_players_nickname ON global_players(nickname);
