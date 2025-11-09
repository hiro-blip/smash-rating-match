import { supabase, MatchingQueueEntry } from './supabase'
import { getUserStats } from './rating'

// マッチングキューに参加
export async function joinMatchingQueue(
  userId: string,
  username: string,
  minRating: number,
  maxRating: number,
  roomCode?: string
): Promise<{ success: boolean; queueEntry?: MatchingQueueEntry; error?: string }> {
  try {
    // 既存のキューエントリをキャンセル
    await cancelMatchingQueue(userId)

    // ユーザーのレーティング情報を取得
    const stats = await getUserStats(userId)
    const mainFighter = localStorage.getItem(`profile_${userId}`)
      ? JSON.parse(localStorage.getItem(`profile_${userId}`)!).mainFighter
      : null

    console.log('joinMatchingQueue - stats:', stats, 'rating:', stats.rating)

    // 新しいキューエントリを作成
    const insertData: any = {
      user_id: userId,
      username,
      rating: stats.rating || 1500, // デフォルト値を確実に設定
      main_fighter: mainFighter,
      min_rating: minRating,
      max_rating: maxRating,
      status: 'waiting'
    }

    // 部屋番号がある場合は追加
    if (roomCode) {
      insertData.room_code = roomCode
    }

    const { data, error } = await supabase
      .from('matching_queue')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error joining queue:', error)
      return { success: false, error: error.message }
    }

    return { success: true, queueEntry: data }
  } catch (error) {
    console.error('Error joining queue:', error)
    return { success: false, error: 'キューへの参加に失敗しました' }
  }
}

// マッチング相手を検索（部屋番号入力済みのプレイヤーのみ）
export async function findMatch(
  userId: string,
  myRating: number,
  minRating: number,
  maxRating: number
): Promise<{ success: boolean; match?: MatchingQueueEntry; error?: string }> {
  try {
    console.log('Finding match...', { userId, myRating, minRating, maxRating })
    
    // 自分以外の待機中のエントリを検索（部屋番号が入力済みのもののみ）
    const { data, error } = await supabase
      .from('matching_queue')
      .select('*')
      .eq('status', 'waiting')
      .neq('user_id', userId)
      .not('room_code', 'is', null) // 部屋番号が入力済み
      .neq('room_code', '') // 部屋番号が空文字でない
      .gte('rating', minRating)
      .lte('rating', maxRating)
      .order('created_at', { ascending: true })
      .limit(1)

    if (error) {
      console.error('Error finding match:', error)
      return { success: false, error: error.message }
    }

    console.log('Search result:', data)

    // マッチング相手が見つかった場合
    if (data && data.length > 0) {
      const opponent = data[0]
      
      // 相手のレーティング範囲内に自分が入っているか確認
      console.log('Checking if I am in opponent range:', {
        myRating,
        opponentMin: opponent.min_rating,
        opponentMax: opponent.max_rating
      })
      
      if (myRating >= opponent.min_rating && myRating <= opponent.max_rating) {
        console.log('Match found! Opponent:', opponent)
        return { success: true, match: opponent }
      } else {
        console.log('Rating mismatch - I am outside opponent range')
      }
    } else {
      console.log('No waiting players found with room code')
    }

    return { success: false }
  } catch (error) {
    console.error('Error finding match:', error)
    return { success: false, error: 'マッチング検索に失敗しました' }
  }
}

// マッチング成立時に両者のステータスを更新
export async function confirmMatch(
  myQueueId: string,
  opponentQueueId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // まず相手がまだ待機中か確認
    const { data: opponentData, error: checkError } = await supabase
      .from('matching_queue')
      .select('*')
      .eq('id', opponentQueueId)
      .eq('status', 'waiting')
      .single()

    if (checkError || !opponentData) {
      console.error('Opponent no longer available:', checkError)
      return { success: false, error: '対戦相手が見つかりませんでした' }
    }

    // 自分のステータスを更新
    const { error: myError } = await supabase
      .from('matching_queue')
      .update({
        status: 'matched',
        matched_with: opponentQueueId,
        updated_at: new Date().toISOString()
      })
      .eq('id', myQueueId)
      .eq('status', 'waiting')

    if (myError) {
      console.error('Error updating my status:', myError)
      return { success: false, error: myError.message }
    }

    // 相手のステータスを更新
    const { error: opponentError } = await supabase
      .from('matching_queue')
      .update({
        status: 'matched',
        matched_with: myQueueId,
        updated_at: new Date().toISOString()
      })
      .eq('id', opponentQueueId)
      .eq('status', 'waiting')

    if (opponentError) {
      console.error('Error updating opponent status:', opponentError)
      return { success: false, error: opponentError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error confirming match:', error)
    return { success: false, error: 'マッチング確定に失敗しました' }
  }
}

// マッチングキューをキャンセル
export async function cancelMatchingQueue(userId: string): Promise<void> {
  try {
    await supabase
      .from('matching_queue')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'waiting')
  } catch (error) {
    console.error('Error cancelling queue:', error)
  }
}

// マッチングキューから退出
export async function leaveMatchingQueue(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('matching_queue')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'waiting')

    if (error) {
      console.error('Error leaving queue:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error leaving queue:', error)
    return { success: false, error: 'キューからの退出に失敗しました' }
  }
}

// 部屋番号を更新
export async function updateRoomCode(
  userId: string,
  roomCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('matching_queue')
      .update({ room_code: roomCode, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'waiting')

    if (error) {
      console.error('Error updating room code:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating room code:', error)
    return { success: false, error: '部屋番号の更新に失敗しました' }
  }
}

// リアルタイムでマッチングキューの変更を監視
export function subscribeToMatchingQueue(
  userId: string,
  onMatch: (opponent: MatchingQueueEntry) => void,
  onError?: (error: any) => void
) {
  const channel = supabase
    .channel('matching_queue_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'matching_queue',
        filter: `user_id=eq.${userId}`
      },
      async (payload) => {
        console.log('Matching queue update received:', payload)
        const entry = payload.new as MatchingQueueEntry
        
        if (entry.status === 'matched' && entry.matched_with) {
          // マッチング相手の情報を取得
          try {
            const { data, error } = await supabase
              .from('matching_queue')
              .select('*')
              .eq('id', entry.matched_with)
              .single()

            if (error) {
              console.error('Error fetching matched opponent:', error)
              onError?.(error)
            } else if (data) {
              console.log('Matched with opponent:', data)
              onMatch(data)
            }
          } catch (error) {
            console.error('Error in match subscription:', error)
            onError?.(error)
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status)
    })

  return channel
}
