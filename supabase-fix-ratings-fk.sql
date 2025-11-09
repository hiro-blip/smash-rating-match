-- ratingsテーブルに外部キー制約を追加

-- まず既存の制約を削除（存在する場合）
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_user_id_fkey;

-- 外部キー制約を追加
ALTER TABLE ratings 
ADD CONSTRAINT ratings_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- インデックスを確認・作成
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
