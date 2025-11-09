-- マッチセッションテーブル（ファイター変更の状態を管理）
CREATE TABLE IF NOT EXISTS match_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL,
  player1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player1_username TEXT NOT NULL,
  player1_fighter TEXT,
  player1_wants_change BOOLEAN DEFAULT false,
  player1_confirmed BOOLEAN DEFAULT false,
  player2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player2_username TEXT NOT NULL,
  player2_fighter TEXT,
  player2_wants_change BOOLEAN DEFAULT false,
  player2_confirmed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'fighter_selection' CHECK (status IN ('fighter_selection', 'waiting_opponent_response', 'stage_selection', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_match_sessions_room_code ON match_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_match_sessions_player1 ON match_sessions(player1_id);
CREATE INDEX IF NOT EXISTS idx_match_sessions_player2 ON match_sessions(player2_id);

-- Row Level Security を無効化（マッチング機能のため）
ALTER TABLE match_sessions DISABLE ROW LEVEL SECURITY;

-- リアルタイム更新を有効化
-- 注意: Supabaseダッシュボードの Database > Publications で手動で match_sessions テーブルを追加してください
-- または以下のコマンドを実行:
-- ALTER PUBLICATION supabase_realtime ADD TABLE match_sessions;
