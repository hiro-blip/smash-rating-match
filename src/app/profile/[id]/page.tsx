'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserStats } from '@/lib/rating'
import { getUserRank } from '@/lib/ranking'
import { getFighterName } from '@/lib/fighters'
import Link from 'next/link'

export default function UserProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  
  const [profile, setProfile] = useState<{
    username: string
    friendCode: string
    bio: string
    profileImage: string
    mainFighter: string
    rating: number
    wins: number
    losses: number
    rank: string
  } | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [matches, setMatches] = useState<any[]>([])

  useEffect(() => {
    if (!loading) {
      const loadProfileData = async () => {
        // プロフィール情報を読み込む
        const savedProfile = localStorage.getItem(`profile_${userId}`)
        const stats = await getUserStats(userId)
        const rank = await getUserRank(userId)
        
        // 対戦履歴を設定（現在はまだ実装されていないため空配列）
        setMatches([])
        
        if (savedProfile) {
          const data = JSON.parse(savedProfile)
          setProfile({
            username: data.username || 'プレイヤー',
            friendCode: data.friendCode || '',
            bio: data.bio || '',
            profileImage: data.profileImage || '👤',
            mainFighter: data.mainFighter || '',
            rating: stats.rating,
            wins: stats.wins,
            losses: stats.losses,
            rank: rank > 0 ? `#${rank}` : '--',
          })
        } else {
          // デフォルトのプロフィール
          setProfile({
            username: 'プレイヤー',
            friendCode: '',
            bio: '',
            profileImage: '👤',
            mainFighter: '',
            rating: stats.rating,
            wins: stats.wins,
            losses: stats.losses,
            rank: rank > 0 ? `#${rank}` : '--',
          })
        }

        // 自分のプロフィールかチェック
        if (user && user.id === userId) {
          setIsOwnProfile(true)
        }
      }
      
      loadProfileData()
    }
  }, [userId, user, loading])

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  const totalMatches = profile.wins + profile.losses
  const winRate = totalMatches > 0 ? ((profile.wins / totalMatches) * 100).toFixed(1) : '--'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* ヘッダー */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-white hover:text-primary-400 transition-colors">
              🎮 スマブラレーティング
            </Link>
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-300">
              ← マイページに戻る
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* プロフィールヘッダー */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 mb-8">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-32 h-32 bg-primary-600 rounded-full flex items-center justify-center text-6xl flex-shrink-0">
                {profile.profileImage}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-bold text-white">
                    {profile.username}
                  </h1>
                  {isOwnProfile && (
                    <Link
                      href="/profile/edit"
                      className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      編集
                    </Link>
                  )}
                </div>
                {profile.friendCode && (
                  <p className="text-slate-400 mb-3">
                    フレンドコード: {profile.friendCode}
                  </p>
                )}
                {profile.mainFighter && (
                  <p className="text-primary-400 mb-3">
                    メインファイター: {getFighterName(profile.mainFighter)}
                  </p>
                )}
                {profile.bio && (
                  <p className="text-slate-300 text-lg leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 text-center">
              <div className="text-slate-400 text-sm mb-2">レーティング</div>
              <div className="text-4xl font-bold text-primary-400 mb-1">
                {profile.rating}
              </div>
              <div className="text-slate-500 text-xs">Rating</div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 text-center">
              <div className="text-slate-400 text-sm mb-2">対戦数</div>
              <div className="text-4xl font-bold text-white mb-1">
                {totalMatches}
              </div>
              <div className="text-slate-500 text-xs">Total Matches</div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 text-center">
              <div className="text-slate-400 text-sm mb-2">勝率</div>
              <div className="text-4xl font-bold text-green-400 mb-1">
                {winRate}%
              </div>
              <div className="text-slate-500 text-xs">
                {profile.wins}勝 {profile.losses}敗
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 text-center">
              <div className="text-slate-400 text-sm mb-2">ランキング</div>
              <div className="text-4xl font-bold text-yellow-400 mb-1">
                {profile.rank}
              </div>
              <div className="text-slate-500 text-xs">Rank</div>
            </div>
          </div>

          {/* 戦績グラフ */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-8">
            <h3 className="text-white text-xl font-bold mb-4">戦績</h3>
            {totalMatches > 0 ? (
              <div>
                <div className="flex gap-2 h-8 mb-4 rounded-lg overflow-hidden">
                  <div
                    className="bg-green-600 flex items-center justify-center text-white text-sm font-bold"
                    style={{ width: `${(profile.wins / totalMatches) * 100}%` }}
                  >
                    {profile.wins > 0 && `${profile.wins}勝`}
                  </div>
                  <div
                    className="bg-red-600 flex items-center justify-center text-white text-sm font-bold"
                    style={{ width: `${(profile.losses / totalMatches) * 100}%` }}
                  >
                    {profile.losses > 0 && `${profile.losses}敗`}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-4">
                    <div className="text-green-400 text-3xl font-bold mb-1">
                      {profile.wins}
                    </div>
                    <div className="text-slate-300 text-sm">勝利</div>
                  </div>
                  <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-4">
                    <div className="text-red-400 text-3xl font-bold mb-1">
                      {profile.losses}
                    </div>
                    <div className="text-slate-300 text-sm">敗北</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                まだ対戦履歴がありません
              </div>
            )}
          </div>

          {/* 最近の対戦履歴 */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <h3 className="text-white text-xl font-bold mb-4">最近の対戦</h3>
            {matches.length > 0 ? (
              <div className="space-y-3">
                {matches.slice(0, 10).map((match: any) => (
                  <div
                    key={match.id}
                    className="bg-slate-900/50 border border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${match.result === 'win' ? 'bg-green-400' : 'bg-red-400'}`} />
                        <div>
                          <div className="text-white font-semibold">
                            vs {match.opponent}
                          </div>
                          <div className="text-slate-400 text-sm">
                            Rating: {match.opponentRating}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${match.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                          {match.result === 'win' ? '勝利' : '敗北'}
                        </div>
                        <div className={`text-sm ${match.ratingChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {match.ratingChange > 0 ? '+' : ''}{match.ratingChange}
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-500 text-xs">
                      {new Date(match.date).toLocaleString('ja-JP')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                まだ対戦履歴がありません
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
