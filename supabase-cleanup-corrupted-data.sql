-- 間違った対戦履歴データを削除（user_id = opponent_idのレコード）
DELETE FROM match_history
WHERE user_id = opponent_id;

-- 確認：削除後のレコード数を確認
SELECT COUNT(*) as remaining_records FROM match_history;

-- 既存のmatch_sessionsでplayer1_id = player2_idのものを削除
DELETE FROM match_sessions
WHERE player1_id = player2_id;

-- 確認：残っているセッション数
SELECT COUNT(*) as remaining_sessions FROM match_sessions;
