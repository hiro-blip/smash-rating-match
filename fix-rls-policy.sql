-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can update their own queue entry" ON matching_queue;

-- 新しいポリシーを作成（他のユーザーのステータスも更新できるように）
CREATE POLICY "Users can update queue entries for matching" ON matching_queue
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (status = 'waiting' AND EXISTS (
      SELECT 1 FROM matching_queue 
      WHERE id = matching_queue.matched_with 
      AND user_id = auth.uid()
    ))
  );

-- または、より簡単に全ての待機中エントリの更新を許可
DROP POLICY IF EXISTS "Users can update queue entries for matching" ON matching_queue;

CREATE POLICY "Users can update waiting queue entries" ON matching_queue
  FOR UPDATE USING (status = 'waiting' OR auth.uid() = user_id);
