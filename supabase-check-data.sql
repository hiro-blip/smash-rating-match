-- ratingsテーブルのデータを確認
SELECT * FROM ratings;

-- profilesテーブルのデータを確認  
SELECT * FROM profiles;

-- 両方を結合して確認（ランキング取得と同じクエリ）
SELECT 
  r.user_id,
  r.rating,
  r.wins,
  r.losses,
  p.username,
  p.avatar_url
FROM ratings r
LEFT JOIN profiles p ON r.user_id = p.user_id
ORDER BY r.rating DESC;
