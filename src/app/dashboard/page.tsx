'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserStats } from '@/lib/rating'
import { getUserRank } from '@/lib/ranking'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<{
    username: string
    friendCode: string
    bio: string
    preMatchComment: string
    postMatchComment: string
    profileImage: string
  } | null>(null)
  const [stats, setStats] = useState({
    rating: 1500,
    wins: 0,
    losses: 0,
  })
  const [rank, setRank] = useState<number>(-1)
  const [ratingHistory, setRatingHistory] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      // プロフィール情報を読み込む
      const savedProfile = localStorage.getItem(`profile_${user.id}`)
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile))
      }
      
      const loadUserData = async () => {
        // 統計情報を読み込む
        const userStats = await getUserStats(user.id)
        setStats(userStats)
        
        // ランキング順位を取得
        const userRank = await getUserRank(user.id)
        setRank(userRank)
      }
      
      loadUserData()
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* ヘッダー */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              🎮 スマブラレーティング
            </h1>
            <nav className="flex gap-4 items-center">
              <Link 
                href="/profile/edit"
                className="text-slate-300 hover:text-primary-400 transition-colors"
              >
                プロフィール編集
              </Link>
              <div className="flex items-center gap-2">
                {profile?.profileImage && (
                  <span className="text-2xl">{profile.profileImage}</span>
                )}
                <span className="text-slate-300">
                  {profile?.username || user.user_metadata?.username || user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                ログアウト
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                マイページ
              </h2>
              <p className="text-slate-400">
                ようこそ、{profile?.username || user.user_metadata?.username || 'プレイヤー'}さん！
              </p>
              {profile?.bio && (
                <p className="text-slate-300 mt-2 text-sm">
                  {profile.bio}
                </p>
              )}
              {profile?.friendCode && (
                <p className="text-slate-400 mt-1 text-sm">
                  フレンドコード: {profile.friendCode}
                </p>
              )}
            </div>
            <Link
              href={`/profile/${user.id}`}
              className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              公開プロフィールを見る
            </Link>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href={`/profile/${user.id}`} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 hover:border-primary-500 transition-colors cursor-pointer">
            <div className="text-slate-400 text-sm mb-2">レーティング</div>
            <div className="text-4xl font-bold text-primary-400 mb-2">{stats.rating}</div>
            <div className="text-slate-500 text-sm">{stats.rating === 1500 ? '初期値' : 'Rating'}</div>
          </Link>

          <Link href={`/profile/${user.id}`} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 hover:border-primary-500 transition-colors cursor-pointer">
            <div className="text-slate-400 text-sm mb-2">対戦数</div>
            <div className="text-4xl font-bold text-white mb-2">{stats.wins + stats.losses}</div>
            <div className="text-slate-500 text-sm">
              勝率: {stats.wins + stats.losses > 0 ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1) : '--'}%
            </div>
          </Link>

          <Link href={`/profile/${user.id}`} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 hover:border-primary-500 transition-colors cursor-pointer">
            <div className="text-slate-400 text-sm mb-2">ランキング</div>
            <div className="text-4xl font-bold text-white mb-2">
              {rank > 0 ? `#${rank}` : '--'}
            </div>
            <div className="text-slate-500 text-sm">全体での順位</div>
          </Link>
        </div>

        {/* アクションボタン */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              対戦を開始
            </h3>
            <p className="text-slate-300 mb-6">
              同じレベルのプレイヤーとマッチングして対戦しよう
            </p>
            <Link href="/matching" className="block w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-center">
              マッチングを開始
            </Link>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              ランキング
            </h3>
            <p className="text-slate-300 mb-6">
              全国のプレイヤーとランキングで競い合おう
            </p>
            <Link href="/ranking" className="block w-full px-6 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors text-center">
              ランキングを見る
            </Link>
          </div>
        </div>

        {/* 対戦履歴 */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">最近の対戦</h3>
          {matches && matches.length > 0 ? (
            <div className="space-y-3">
              {matches.map((match: any) => (
                <div
                  key={match.id}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${match.result === 'win' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div>
                      <div className="text-white font-semibold">
                        vs {match.opponent}
                      </div>
                      <div className="text-slate-400 text-sm">
                        {new Date(match.date).toLocaleDateString('ja-JP', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">
              まだ対戦履歴がありません
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
