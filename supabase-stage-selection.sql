-- match_sessionsテーブルにステージ選択のカラムを追加
ALTER TABLE match_sessions 
ADD COLUMN IF NOT EXISTS player1_banned_stage TEXT,
ADD COLUMN IF NOT EXISTS player2_banned_stages TEXT[], -- プレイヤー2は2つ拒否するので配列
ADD COLUMN IF NOT EXISTS player1_selected_stage TEXT, -- プレイヤー1が最終的に選択
ADD COLUMN IF NOT EXISTS stage_selection_phase TEXT DEFAULT 'player1_ban' CHECK (stage_selection_phase IN ('player1_ban', 'player2_ban', 'player1_select', 'completed'));

-- 既存のレコードに対してデフォルト値を設定
UPDATE match_sessions 
SET stage_selection_phase = 'player1_ban' 
WHERE stage_selection_phase IS NULL;
