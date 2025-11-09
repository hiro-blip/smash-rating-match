-- マッチングキューテーブル
CREATE TABLE IF NOT EXISTS matching_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  rating INTEGER NOT NULL,
  main_fighter TEXT,
  min_rating INTEGER NOT NULL,
  max_rating INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'cancelled')),
  matched_with UUID REFERENCES matching_queue(id),
  room_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- プロフィールテーブル
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  friend_code TEXT,
  bio TEXT,
  comments TEXT,
  avatar_url TEXT,
  main_fighter TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- レーティングテーブル
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER DEFAULT 1500 NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 対戦履歴テーブル
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_name TEXT NOT NULL,
  opponent_rating INTEGER NOT NULL,
  my_fighter TEXT,
  opponent_fighter TEXT,
  stage TEXT,
  result TEXT CHECK (result IN ('win', 'lose')) NOT NULL,
  rating_change INTEGER NOT NULL,
  old_rating INTEGER NOT NULL,
  new_rating INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_matching_queue_status ON matching_queue(status);
CREATE INDEX IF NOT EXISTS idx_matching_queue_rating ON matching_queue(rating);
CREATE INDEX IF NOT EXISTS idx_matching_queue_created_at ON matching_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);

-- Row Level Security (RLS) を有効化
ALTER TABLE matching_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- matching_queue のポリシー
CREATE POLICY "Users can view all waiting queue entries" ON matching_queue
  FOR SELECT USING (status = 'waiting');

CREATE POLICY "Users can insert their own queue entry" ON matching_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue entry" ON matching_queue
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue entry" ON matching_queue
  FOR DELETE USING (auth.uid() = user_id);

-- profiles のポリシー
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ratings のポリシー
CREATE POLICY "Ratings are viewable by everyone" ON ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own rating" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rating" ON ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- matches のポリシー
CREATE POLICY "Users can view their own matches" ON matches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 古いキューエントリを自動削除する関数（5分以上前のもの）
CREATE OR REPLACE FUNCTION cleanup_old_queue_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM matching_queue
  WHERE created_at < NOW() - INTERVAL '5 minutes'
    AND status = 'waiting';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- リアルタイム更新を有効化
ALTER PUBLICATION supabase_realtime ADD TABLE matching_queue;
