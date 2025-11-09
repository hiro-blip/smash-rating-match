// ランキング機能

import { supabase } from './supabase'

export interface RankingPlayer {
  userId: string
  username: string
  profileImage: string
  rating: number
  wins: number
  losses: number
  rank: number
}

/**
 * 全ユーザーのランキングを取得（Supabaseから）
 */
export async function getAllRankings(): Promise<RankingPlayer[]> {
  try {
    console.log('=== getAllRankings START ===')
    
    // ratingsテーブルとprofilesテーブルを手動でJOIN
    // Supabaseの自動JOINではなく、RPCまたは別クエリを使用
    
    // まずratingsを取得
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('ratings')
      .select('user_id, rating, wins, losses')
      .order('rating', { ascending: false })

    console.log('Ratings data:', ratingsData, 'error:', ratingsError)

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError)
      return []
    }

    if (!ratingsData || ratingsData.length === 0) {
      console.log('No ratings data found')
      return []
    }

    // 次にprofilesを取得
    const userIds = ratingsData.map(r => r.user_id)
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', userIds)

    console.log('Profiles data:', profilesData, 'error:', profilesError)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      // プロフィールがなくてもレーティングは表示
    }

    // データを手動で結合
    const profileMap = new Map(
      (profilesData || []).map(p => [p.user_id, p])
    )

    const rankings: RankingPlayer[] = ratingsData
      .map((rating, index) => {
        const profile = profileMap.get(rating.user_id)
        const player = {
          userId: rating.user_id,
          username: profile?.username || 'プレイヤー',
          profileImage: profile?.avatar_url || '👤',
          rating: rating.rating,
          wins: rating.wins,
          losses: rating.losses,
          rank: 0 // 後で設定
        }
        console.log('Mapped player:', player)
        return player
      })

    // レーティングで降順ソート（同率の場合は勝利数、対戦数で比較）
    rankings.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating
      }
      // レーティングが同じ場合は勝利数で比較
      if (b.wins !== a.wins) {
        return b.wins - a.wins
      }
      // 勝利数も同じ場合は対戦数で比較
      return (b.wins + b.losses) - (a.wins + a.losses)
    })

    // 順位を設定
    rankings.forEach((player, index) => {
      player.rank = index + 1
    })

    console.log('Final rankings:', rankings)
    console.log('=== getAllRankings SUCCESS ===')
    return rankings
  } catch (error) {
    console.error('=== getAllRankings ERROR ===')
    console.error('Error in getAllRankings:', error)
    return []
  }
}

/**
 * ユーザーの順位を取得
 */
export async function getUserRank(userId: string): Promise<number> {
  const rankings = await getAllRankings()
  const player = rankings.find(p => p.userId === userId)
  return player ? player.rank : -1
}

/**
 * 上位N人を取得
 */
export async function getTopRankings(limit: number = 200): Promise<RankingPlayer[]> {
  const rankings = await getAllRankings()
  return rankings.slice(0, limit)
}
