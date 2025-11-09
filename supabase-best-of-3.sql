-- Best of 3 (2先) システムのためのカラムを追加

ALTER TABLE match_sessions
ADD COLUMN IF NOT EXISTS current_game INT DEFAULT 1, -- 現在何戦目か (1, 2, 3)
ADD COLUMN IF NOT EXISTS player1_wins INT DEFAULT 0, -- プレイヤー1の勝利数
ADD COLUMN IF NOT EXISTS player2_wins INT DEFAULT 0, -- プレイヤー2の勝利数
ADD COLUMN IF NOT EXISTS game1_winner TEXT, -- 1戦目の勝者 ('player1' or 'player2')
ADD COLUMN IF NOT EXISTS game1_stage TEXT, -- 1戦目のステージ
ADD COLUMN IF NOT EXISTS game1_player1_report TEXT, -- 1戦目：プレイヤー1の報告
ADD COLUMN IF NOT EXISTS game1_player2_report TEXT, -- 1戦目：プレイヤー2の報告
ADD COLUMN IF NOT EXISTS game2_winner TEXT, -- 2戦目の勝者
ADD COLUMN IF NOT EXISTS game2_stage TEXT, -- 2戦目のステージ
ADD COLUMN IF NOT EXISTS game2_banned_stages TEXT[], -- 2戦目で勝者が拒否した2ステージ
ADD COLUMN IF NOT EXISTS game2_player1_report TEXT, -- 2戦目：プレイヤー1の報告
ADD COLUMN IF NOT EXISTS game2_player2_report TEXT, -- 2戦目：プレイヤー2の報告
ADD COLUMN IF NOT EXISTS game3_winner TEXT, -- 3戦目の勝者（最終結果）
ADD COLUMN IF NOT EXISTS game3_stage TEXT, -- 3戦目のステージ
ADD COLUMN IF NOT EXISTS game3_banned_stages TEXT[], -- 3戦目で勝者が拒否した2ステージ
ADD COLUMN IF NOT EXISTS game3_player1_report TEXT, -- 3戦目：プレイヤー1の報告
ADD COLUMN IF NOT EXISTS game3_player2_report TEXT, -- 3戦目：プレイヤー2の報告
ADD COLUMN IF NOT EXISTS match_winner TEXT; -- 最終的な勝者 ('player1' or 'player2')

-- 既存レコードの初期化
UPDATE match_sessions 
SET 
  current_game = 1,
  player1_wins = 0,
  player2_wins = 0
WHERE current_game IS NULL;
