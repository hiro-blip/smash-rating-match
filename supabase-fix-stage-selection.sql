-- 既存のCHECK制約を削除して再作成
-- まず、既存の制約名を確認して削除
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    -- stage_selection_phaseのCHECK制約を探して削除
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'match_sessions'::regclass 
        AND contype = 'c' 
        AND conname LIKE '%stage_selection_phase%'
    LOOP
        EXECUTE format('ALTER TABLE match_sessions DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;
END $$;

-- 古いカラムを削除（もし存在する場合）
ALTER TABLE match_sessions 
DROP COLUMN IF EXISTS player2_selected_stage;

-- 新しいカラムを追加（IF NOT EXISTSで安全に）
ALTER TABLE match_sessions 
ADD COLUMN IF NOT EXISTS player1_banned_stage TEXT,
ADD COLUMN IF NOT EXISTS player2_banned_stages TEXT[],
ADD COLUMN IF NOT EXISTS player1_selected_stage TEXT,
ADD COLUMN IF NOT EXISTS stage_selection_phase TEXT;

-- 既存のレコードをクリーンアップ
UPDATE match_sessions 
SET stage_selection_phase = 'player1_ban' 
WHERE stage_selection_phase IS NULL OR stage_selection_phase NOT IN ('player1_ban', 'player2_ban', 'player1_select', 'completed');

-- 新しいCHECK制約を追加
ALTER TABLE match_sessions 
ADD CONSTRAINT match_sessions_stage_selection_phase_check 
CHECK (stage_selection_phase IN ('player1_ban', 'player2_ban', 'player1_select', 'completed'));
