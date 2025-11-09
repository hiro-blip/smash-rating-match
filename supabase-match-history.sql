-- 対戦履歴テーブルの作成

CREATE TABLE IF NOT EXISTS match_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  opponent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  result TEXT CHECK (result IN ('win', 'loss')) NOT NULL,
  rating_change INTEGER NOT NULL,
  old_rating INTEGER NOT NULL,
  new_rating INTEGER NOT NULL,
  opponent_rating INTEGER NOT NULL,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_match_history_user_id ON match_history(user_id);
CREATE INDEX IF NOT EXISTS idx_match_history_played_at ON match_history(played_at DESC);

-- RLS有効化
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

-- ポリシー
CREATE POLICY "Users can view their own match history" ON match_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own match history" ON match_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
