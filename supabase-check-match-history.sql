-- match_historyテーブルのデータを確認
SELECT 
  mh.id,
  mh.user_id,
  mh.opponent_id,
  p1.username as user_name,
  p2.username as opponent_name,
  mh.result,
  mh.rating_change,
  mh.played_at
FROM match_history mh
LEFT JOIN profiles p1 ON mh.user_id = p1.user_id
LEFT JOIN profiles p2 ON mh.opponent_id = p2.user_id
ORDER BY mh.played_at DESC
LIMIT 20;

-- user_idとopponent_idが正しく保存されているか確認
SELECT 
  user_id,
  opponent_id,
  result,
  rating_change,
  played_at
FROM match_history
ORDER BY played_at DESC
LIMIT 10;
