// Eloレーティング計算システム

import { supabase } from './supabase'

/**
 * Eloレーティングの変動を計算
 * @param playerRating プレイヤーの現在のレーティング
 * @param opponentRating 対戦相手のレーティング
 * @param won 勝利したかどうか
 * @param kFactor K因子（デフォルト: 32）
 * @returns 新しいレーティング
 */
export function calculateNewRating(
  playerRating: number,
  opponentRating: number,
  won: boolean,
  kFactor: number = 32
): number {
  // 期待勝率を計算
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
  
  // 実際のスコア（勝利=1, 敗北=0）
  const actualScore = won ? 1 : 0
  
  // レーティング変動を計算
  const ratingChange = Math.round(kFactor * (actualScore - expectedScore))
  
  // 新しいレーティング
  const newRating = playerRating + ratingChange
  
  // 最小レーティングは100
  return Math.max(100, newRating)
}

/**
 * レーティング変動値を取得（表示用）
 */
export function getRatingChange(
  playerRating: number,
  opponentRating: number,
  won: boolean,
  kFactor: number = 32
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
  const actualScore = won ? 1 : 0
  return Math.round(kFactor * (actualScore - expectedScore))
}

/**
 * ユーザーの統計情報を取得（Supabaseから）
 */
export async function getUserStats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      // レコードが存在しない場合はデフォルト値を返す
      if (error.code === 'PGRST116') {
        return {
          rating: 1500,
          wins: 0,
          losses: 0,
        }
      }
      console.error('Error fetching user stats:', error)
      return {
        rating: 1500,
        wins: 0,
        losses: 0,
      }
    }
    
    return {
      rating: data.rating,
      wins: data.wins,
      losses: data.losses,
    }
  } catch (error) {
    console.error('Error in getUserStats:', error)
    return {
      rating: 1500,
      wins: 0,
      losses: 0,
    }
  }
}

/**
 * 対戦結果を記録してSupabaseに保存
 */
export async function recordMatch(
  userId: string,
  opponentId: string,
  won: boolean
) {
  console.log('=== recordMatch START ===')
  console.log('userId:', userId)
  console.log('opponentId:', opponentId)
  console.log('won:', won)
  
  try {
    // 両プレイヤーの現在の統計を取得
    console.log('Fetching user stats...')
    const [userStats, opponentStats] = await Promise.all([
      getUserStats(userId),
      getUserStats(opponentId)
    ])
    
    console.log('User stats:', userStats)
    console.log('Opponent stats:', opponentStats)
    
    // レーティング変動を計算
    const ratingChange = getRatingChange(userStats.rating, opponentStats.rating, won)
    const newRating = calculateNewRating(userStats.rating, opponentStats.rating, won)
    
    console.log('Rating change:', ratingChange)
    console.log('New rating:', newRating)
    
    // ratingsテーブルを更新（upsert）
    console.log('Updating ratings table...')
    const { error } = await supabase
      .from('ratings')
      .upsert({
        user_id: userId,
        rating: newRating,
        wins: won ? userStats.wins + 1 : userStats.wins,
        losses: won ? userStats.losses : userStats.losses + 1,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    
    if (error) {
      console.error('Error updating ratings:', error)
      throw error
    }
    
    console.log('Ratings table updated successfully')
    
    // match_historyテーブルに記録
    console.log('Recording match history...')
    const { error: historyError } = await supabase
      .from('match_history')
      .insert({
        user_id: userId,
        opponent_id: opponentId,
        result: won ? 'win' : 'loss',
        rating_change: ratingChange,
        old_rating: userStats.rating,
        new_rating: newRating,
        opponent_rating: opponentStats.rating,
        played_at: new Date().toISOString()
      })
    
    if (historyError) {
      console.error('Error recording match history:', historyError)
      // 履歴の記録に失敗してもレーティング更新は成功とする
    } else {
      console.log('Match history recorded successfully')
    }
    
    console.log('=== recordMatch SUCCESS ===')
    return {
      ratingChange,
      newRating,
      oldRating: userStats.rating,
    }
  } catch (error) {
    console.error('=== recordMatch ERROR ===')
    console.error('Error in recordMatch:', error)
    throw error
  }
}

/**
 * ユーザーのレーティング履歴を取得
 */
export async function getRatingHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('match_history')
      .select('new_rating, played_at')
      .eq('user_id', userId)
      .order('played_at', { ascending: true })

    if (error) {
      console.error('Error fetching rating history:', error)
      return []
    }

    // 対戦履歴からレーティング推移を生成
    const history = (data || []).map((match, index) => ({
      match_number: index + 1,
      rating: match.new_rating,
      date: match.played_at
    }))

    return history
  } catch (error) {
    console.error('Error in getRatingHistory:', error)
    return []
  }
}

/**
 * ユーザーの対戦履歴を取得（表示用）
 */
export async function getMatchHistory(userId: string, limit: number = 10) {
  try {
    console.log('=== getMatchHistory START ===')
    console.log('userId:', userId)
    
    // 対戦履歴を取得
    const { data: matchData, error: matchError } = await supabase
      .from('match_history')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(limit)

    console.log('Match data:', matchData)

    if (matchError) {
      console.error('Error fetching match history:', matchError)
      return []
    }

    if (!matchData || matchData.length === 0) {
      console.log('No match data found')
      return []
    }

    // 対戦相手のユーザーIDを収集
    const opponentIds = matchData.map(m => m.opponent_id)
    console.log('Opponent IDs:', opponentIds)
    
    // プロフィールを一括取得
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, username, main_fighter')
      .in('user_id', opponentIds)

    console.log('Profile data:', profileData)

    if (profileError) {
      console.error('Error fetching opponent profiles:', profileError)
    }

    // プロフィールマップを作成
    const profileMap = new Map(
      (profileData || []).map(p => [p.user_id, { username: p.username, mainFighter: p.main_fighter }])
    )

    console.log('Profile map:', profileMap)

    // データを整形
    const matches = matchData.map(match => {
      const opponentProfile = profileMap.get(match.opponent_id)
      console.log(`Match opponent_id: ${match.opponent_id}, profile:`, opponentProfile)
      return {
        id: match.id,
        opponent: opponentProfile?.username || '対戦相手',
        opponentFighter: opponentProfile?.mainFighter || null,
        opponentRating: match.opponent_rating,
        result: match.result,
        ratingChange: match.rating_change,
        oldRating: match.old_rating,
        newRating: match.new_rating,
        date: match.played_at,
      }
    })

    console.log('Formatted matches:', matches)
    console.log('=== getMatchHistory END ===')
    return matches
  } catch (error) {
    console.error('Error in getMatchHistory:', error)
    return []
  }
}
