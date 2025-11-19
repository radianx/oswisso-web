-- Create tournaments table
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rounds INTEGER NOT NULL,
  current_round INTEGER DEFAULT 1,
  status TEXT DEFAULT 'setup', -- 'setup', 'active', 'completed'
  time_per_round INTEGER DEFAULT 50,
  round_start_time BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  match_wins INTEGER DEFAULT 0,
  match_losses INTEGER DEFAULT 0,
  match_draws INTEGER DEFAULT 0,
  game_wins INTEGER DEFAULT 0,
  game_losses INTEGER DEFAULT 0,
  opponent_ids TEXT[] DEFAULT ARRAY[]::TEXT[], -- Storing as array of strings for simplicity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  player1_id UUID REFERENCES players(id),
  player2_id UUID REFERENCES players(id), -- Can be null for bye
  player1_points INTEGER DEFAULT 0,
  player2_points INTEGER DEFAULT 0,
  result TEXT, -- 'player1', 'player2', 'draw'
  is_bye BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX idx_players_tournament_id ON players(tournament_id);
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
