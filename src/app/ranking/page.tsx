'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getTopRankings, getUserRank, RankingPlayer } from '@/lib/ranking'
import Link from 'next/link'

export default function RankingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [rankings, setRankings] = useState<RankingPlayer[]>([])
  const [myRank, setMyRank] = useState<number>(-1)
  const [filter, setFilter] = useState<'all' | 'top50' | 'top100'>('all')
  const [isLoadingRankings, setIsLoadingRankings] = useState(true)

  useEffect(() => {
    async function loadRankings() {
      try {
        setIsLoadingRankings(true)
        // ランキングデータを読み込む
        const allRankings = await getTopRankings(200)
        setRankings(allRankings)
        
        // 自分の順位を取得
        if (user) {
          const rank = await getUserRank(user.id)
          setMyRank(rank)
        }
      } catch (error) {
        console.error('Failed to load rankings:', error)
      } finally {
        setIsLoadingRankings(false)
      }
    }

    loadRankings()
  }, [user])

  const filteredRankings = () => {
    switch (filter) {
      case 'top50':
        return rankings.slice(0, 50)
      case 'top100':
        return rankings.slice(0, 100)
      default:
        return rankings
    }
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400'
    if (rank === 2) return 'text-slate-300'
    if (rank === 3) return 'text-orange-400'
    if (rank <= 10) return 'text-primary-400'
    return 'text-slate-400'
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

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
        <div className="max-w-5xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">🏆 ランキング</h1>
            <p className="text-slate-300 text-lg">
              全国のプレイヤーとレーティングで競い合おう
            </p>
          </div>

          {/* 自分の順位表示 */}
          {user && myRank > 0 && (
            <div className="bg-gradient-to-r from-primary-600/20 to-primary-800/20 border-2 border-primary-500/50 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-300 text-sm mb-1">あなたの順位</div>
                  <div className="flex items-center gap-3">
                    <div className="text-5xl font-bold text-primary-400">
                      #{myRank}
                    </div>
                    {getRankBadge(myRank) && (
                      <div className="text-4xl">{getRankBadge(myRank)}</div>
                    )}
                  </div>
                </div>
                <Link
                  href={`/profile/${user.id}`}
                  className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  プロフィールを見る
                </Link>
              </div>
            </div>
          )}

          {/* フィルター */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              全体（1-200位）
            </button>
            <button
              onClick={() => setFilter('top50')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'top50'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              TOP 50
            </button>
            <button
              onClick={() => setFilter('top100')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'top100'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              TOP 100
            </button>
          </div>

          {/* ランキングリスト */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden">
            {isLoadingRankings ? (
              <div className="text-center text-slate-400 py-16">
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-xl">ランキングを読み込み中...</p>
              </div>
            ) : filteredRankings().length > 0 ? (
              <div className="divide-y divide-slate-700">
                {filteredRankings().map((player) => {
                  const totalMatches = player.wins + player.losses
                  const winRate = totalMatches > 0 ? ((player.wins / totalMatches) * 100).toFixed(1) : '0.0'
                  const isCurrentUser = user && player.userId === user.id

                  return (
                    <Link
                      key={player.userId}
                      href={`/profile/${player.userId}`}
                      className={`flex items-center gap-4 p-4 hover:bg-slate-700/50 transition-colors ${
                        isCurrentUser ? 'bg-primary-900/20' : ''
                      }`}
                    >
                      {/* 順位 */}
                      <div className="w-16 text-center">
                        <div className={`text-2xl font-bold ${getRankColor(player.rank)}`}>
                          {player.rank}
                        </div>
                        {getRankBadge(player.rank) && (
                          <div className="text-2xl">{getRankBadge(player.rank)}</div>
                        )}
                      </div>

                      {/* プロフィール画像 */}
                      <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-3xl flex-shrink-0">
                        {player.profileImage}
                      </div>

                      {/* ユーザー情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-bold text-lg truncate">
                            {player.username}
                          </h3>
                          {isCurrentUser && (
                            <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {totalMatches}戦 {player.wins}勝 {player.losses}敗 • 勝率 {winRate}%
                        </div>
                      </div>

                      {/* レーティング */}
                      <div className="text-right">
                        <div className="text-slate-400 text-xs mb-1">Rating</div>
                        <div className="text-2xl font-bold text-primary-400">
                          {player.rating}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-16">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-xl mb-2">まだランキングデータがありません</p>
                <p className="text-sm">対戦を開始してランキングに参加しましょう！</p>
              </div>
            )}
          </div>

          {/* 統計情報 */}
          {rankings.length > 0 && (
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 text-center">
                <div className="text-slate-400 text-sm mb-2">登録プレイヤー</div>
                <div className="text-4xl font-bold text-white mb-1">
                  {rankings.length}
                </div>
                <div className="text-slate-500 text-xs">Players</div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 text-center">
                <div className="text-slate-400 text-sm mb-2">最高レーティング</div>
                <div className="text-4xl font-bold text-yellow-400 mb-1">
                  {rankings[0]?.rating || 0}
                </div>
                <div className="text-slate-500 text-xs">
                  {rankings[0]?.username || '-'}
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 text-center">
                <div className="text-slate-400 text-sm mb-2">平均レーティング</div>
                <div className="text-4xl font-bold text-primary-400 mb-1">
                  {rankings.length > 0
                    ? Math.round(
                        rankings.reduce((sum, p) => sum + p.rating, 0) / rankings.length
                      )
                    : 0}
                </div>
                <div className="text-slate-500 text-xs">Average</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
