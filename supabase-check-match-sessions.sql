-- Check match_sessions table to verify player IDs are being stored correctly
SELECT 
  room_code,
  player1_id,
  player2_id,
  player1_username,
  player2_username,
  match_winner,
  created_at
FROM match_sessions
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any sessions where player1_id = player2_id (this would be the bug)
SELECT 
  COUNT(*) as same_player_count
FROM match_sessions
WHERE player1_id = player2_id;
