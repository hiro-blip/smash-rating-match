'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserStats } from '@/lib/rating'
import { getUserProfile, migrateProfileToSupabase } from '@/lib/profile'
import { getFighterName, fighters } from '@/lib/fighters'
import FighterIcon from '@/components/FighterIcon'
import { 
  joinMatchingQueue,
  findMatch,
  confirmMatch,
  leaveMatchingQueue,
  subscribeToMatchingQueue 
} from '@/lib/matchingQueue'
import type { MatchingQueueEntry } from '@/lib/supabase'
import Link from 'next/link'

type MatchingStatus = 'idle' | 'searching' | 'found' | 'cancelled'
type RatingRange = 50 | 100 | 150 | 200 | 250 | 300 | 350 | 400 | 999999

const RATING_RANGES: { value: RatingRange; label: string }[] = [
  { value: 50, label: '±50以内' },
  { value: 100, label: '±100以内' },
  { value: 150, label: '±150以内' },
  { value: 200, label: '±200以内' },
  { value: 250, label: '±250以内' },
  { value: 300, label: '±300以内' },
  { value: 350, label: '±350以内' },
  { value: 400, label: '±400以内' },
  { value: 999999, label: '制限なし' },
]

export default function MatchingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<MatchingStatus>('idle')
  const [searchTime, setSearchTime] = useState(0)
  const [ratingRange, setRatingRange] = useState<RatingRange>(200)
  const [opponent, setOpponent] = useState<{
    username: string
    rating: number
    mainFighter: string
    roomCode?: string
  } | null>(null)
  const [profile, setProfile] = useState<{
    username: string
    profileImage: string
    mainFighter: string
  } | null>(null)
  const [myRating, setMyRating] = useState(1500)
  const [myQueueId, setMyQueueId] = useState<string | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      console.log('Loading profile for user:', user.id)
      
      const loadUserData = async () => {
        setIsLoadingProfile(true)
        
        try {
          // まずlocalStorageからSupabaseへ移行を試みる
          await migrateProfileToSupabase(user.id)
          
          // Supabaseからプロフィール情報を取得
          const supabaseProfile = await getUserProfile(user.id)
          
          // レーティング情報をSupabaseから取得
          const stats = await getUserStats(user.id)
          setMyRating(stats.rating)
          
          console.log('Supabase profile:', supabaseProfile)
          console.log('Stats:', stats)
          
          if (supabaseProfile) {
            setProfile({
              username: supabaseProfile.username,
              profileImage: supabaseProfile.avatar_url,
              mainFighter: supabaseProfile.main_fighter || '',
            })
            console.log('Profile loaded from Supabase:', supabaseProfile)
          } else {
            // Supabaseにプロフィールがない場合、localStorageをチェック（後方互換性）
            const savedProfile = localStorage.getItem(`profile_${user.id}`)
            if (savedProfile) {
              const data = JSON.parse(savedProfile)
              setProfile({
                username: data.username,
                profileImage: data.profileImage,
                mainFighter: data.mainFighter || '',
              })
              console.log('Profile loaded from localStorage:', data)
            } else {
              console.warn('No profile found in Supabase or localStorage')
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error)
        } finally {
          setIsLoadingProfile(false)
        }
      }
      
      loadUserData()
    }
  }, [user, loading, router])

  // 検索時間のカウント
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (status === 'searching') {
      interval = setInterval(() => {
        setSearchTime((prev) => prev + 1)
      }, 1000)
    } else {
      setSearchTime(0)
    }
    return () => clearInterval(interval)
  }, [status])

  // リアルタイムマッチング監視（待機室に移動したプレイヤー用）
  useEffect(() => {
    if (!user || status !== 'searching') return

    const channel = subscribeToMatchingQueue(
      user.id,
      (matchedOpponent: MatchingQueueEntry) => {
        // マッチング成功
        setOpponent({
          username: matchedOpponent.username,
          rating: matchedOpponent.rating,
          mainFighter: matchedOpponent.main_fighter || '',
        })
        setStatus('found')
      },
      (error) => {
        console.error('Matching error:', error)
      }
    )

    return () => {
      channel.unsubscribe()
    }
  }, [user, status])

  const startMatching = async () => {
    console.log('=== START MATCHING CALLED ===')
    console.log('User:', user)
    console.log('Profile:', profile)
    
    if (!user || !profile) {
      console.error('User or profile is missing:', { user, profile })
      alert('プロフィールが設定されていません。プロフィール編集ページから設定してください。')
      return
    }

    console.log('Starting matching...', { myRating, ratingRange })
    setStatus('searching')
    
    const minRating = ratingRange === 999999 ? 1000 : Math.max(1000, myRating - ratingRange)
    const maxRating = ratingRange === 999999 ? 3000 : Math.min(3000, myRating + ratingRange)
    console.log('Rating range:', { minRating, maxRating })

    // まず既存のマッチング相手を検索
    const { success, match } = await findMatch(user.id, myRating, minRating, maxRating)

    if (success && match) {
      // 既に待機している人がいた場合
      console.log('Found existing player waiting:', match)
      const joinResult = await joinMatchingQueue(
        user.id,
        profile.username,
        minRating,
        maxRating
      )

      if (joinResult.success && joinResult.queueEntry) {
        setMyQueueId(joinResult.queueEntry.id)
        // マッチング確定
        const confirmResult = await confirmMatch(joinResult.queueEntry.id, match.id)
        
        if (confirmResult.success) {
          console.log('Match confirmed with existing player')
          setOpponent({
            username: match.username,
            rating: match.rating,
            mainFighter: match.main_fighter || '',
            roomCode: match.room_code || '12345',
          })
          setStatus('found')
        } else {
          console.error('Failed to confirm match:', confirmResult.error)
          setStatus('idle')
        }
      }
    } else {
      // 誰も待っていない場合は自分が部屋を建てる
      console.log('No players waiting, creating new room')
      const result = await joinMatchingQueue(
        user.id,
        profile.username,
        minRating,
        maxRating
      )

      if (result.success && result.queueEntry) {
        setMyQueueId(result.queueEntry.id)
        // 待機室ページに遷移（レーティング範囲とキューIDを渡す）
        router.push(
          `/matching/waiting-room?queueId=${result.queueEntry.id}&minRating=${minRating}&maxRating=${maxRating}`
        )
      } else {
        console.error('Failed to join queue:', result.error)
        setStatus('idle')
      }
    }
  }

  const cancelMatching = async () => {
    if (user) {
      await leaveMatchingQueue(user.id)
    }
    setStatus('cancelled')
    setMyQueueId(null)
    setTimeout(() => {
      setStatus('idle')
      setOpponent(null)
    }, 1000)
  }

  const acceptMatch = () => {
    if (opponent) {
      // ファイター変更確認ページに遷移（自分はプレイヤー2）
      router.push(`/match/change-fighter-confirm?opponentName=${encodeURIComponent(opponent.username)}&opponentRating=${opponent.rating}&opponentMainFighter=${opponent.mainFighter || ''}&isPlayer2=true&roomCode=${opponent.roomCode || '12345'}`)
    }
  }

  if (loading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
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
            <span className="text-slate-300">
              {user.user_metadata?.username || user.email}
            </span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* ステータス表示 */}
          {status === 'idle' && (
            <div className="text-center">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-4">
                  対戦相手を探す
                </h1>
                <p className="text-slate-300 text-lg">
                  あなたと同じレベルのプレイヤーとマッチングします
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 mb-8">
                {/* レーティング範囲選択 */}
                <div className="mb-6">
                  <label className="block text-slate-300 text-sm font-semibold mb-3">
                    マッチング範囲を選択
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {RATING_RANGES.map((range) => {
                      const minRange = range.value === 999999 ? 1000 : Math.max(1000, myRating - range.value)
                      const maxRange = range.value === 999999 ? 3000 : Math.min(3000, myRating + range.value)
                      
                      return (
                        <button
                          key={range.value}
                          onClick={() => setRatingRange(range.value)}
                          className={`px-4 py-3 rounded-lg border-2 transition-all ${
                            ratingRange === range.value
                              ? 'bg-primary-600 border-primary-500 text-white font-bold'
                              : 'bg-slate-900/50 border-slate-600 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <div className="text-sm font-semibold">{range.label}</div>
                          {range.value !== 999999 && (
                            <div className="text-xs mt-1 opacity-75">
                              {minRange}-{maxRange}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-6 mb-6">
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <div className="text-slate-400 text-sm mb-2">あなたのレーティング</div>
                      <div className="text-4xl font-bold text-primary-400">{myRating}</div>
                    </div>
                    <div className="text-slate-600 text-4xl">VS</div>
                    <div className="text-center">
                      <div className="text-slate-400 text-sm mb-2">マッチング範囲</div>
                      <div className="text-2xl font-bold text-slate-300">
                        {ratingRange === 999999
                          ? '制限なし'
                          : `${Math.max(1000, myRating - ratingRange)}-${Math.min(3000, myRating + ratingRange)}`}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={startMatching}
                  disabled={!profile}
                  className={`w-full px-8 py-4 text-white text-xl font-bold rounded-lg transition-colors shadow-lg hover:shadow-xl ${
                    !profile 
                      ? 'bg-slate-600 cursor-not-allowed' 
                      : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  マッチングを開始
                </button>
                
                {!profile && (
                  <div className="text-yellow-400 text-sm text-center mt-2">
                    ⚠️ プロフィールを設定してください
                  </div>
                )}
                
                {/* デバッグ情報 */}
                <div className="text-slate-500 text-xs text-center mt-2">
                  Profile: {profile ? '✓' : '✗'} | User: {user ? '✓' : '✗'}
                  {profile && ` | ${profile.username}`}
                </div>
              </div>

              <div className="text-slate-400 text-sm text-center">
                <p>💡 ヒント：範囲が狭いほど同レベルの対戦相手が見つかりやすくなります</p>
              </div>
            </div>
          )}

          {/* 検索中 */}
          {status === 'searching' && (
            <div className="text-center">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-4">
                  対戦相手を探しています...
                </h1>
                <p className="text-slate-300 text-lg">
                  経過時間: {searchTime}秒
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 mb-8">
                {/* アニメーション */}
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <div className="w-32 h-32 border-8 border-slate-700 border-t-primary-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl">🎮</span>
                    </div>
                  </div>
                </div>

                <div className="text-slate-300 mb-8">
                  <p className="text-lg mb-2">マッチング中...</p>
                  <p className="text-sm text-slate-400">
                    同じレベルのプレイヤーを検索しています
                  </p>
                </div>

                <button
                  onClick={cancelMatching}
                  className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* マッチング成功 */}
          {status === 'found' && opponent && (
            <div className="text-center">
              <div className="mb-8">
                <div className="text-green-400 text-6xl mb-4">✓</div>
                <h1 className="text-4xl font-bold text-white mb-4">
                  対戦相手が見つかりました！
                </h1>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 mb-8">
                <div className="flex items-center justify-center gap-12 mb-8">
                  {/* あなた */}
                  <div className="text-center">
                    <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center text-4xl mb-4 mx-auto">
                      {profile?.profileImage || '👤'}
                    </div>
                    <div className="text-white font-bold text-xl mb-2">
                      {profile?.username || user.user_metadata?.username || 'あなた'}
                    </div>
                    {profile?.mainFighter && (
                      <div className="flex justify-center">
                        <FighterIcon 
                          fighterId={profile.mainFighter}
                          size="sm"
                          className="text-slate-400 text-sm mb-1"
                        />
                      </div>
                    )}
                    <div className="text-primary-400 text-lg">Rating: {myRating}</div>
                  </div>

                  {/* VS */}
                  <div className="text-4xl font-bold text-slate-400">VS</div>

                  {/* 対戦相手 */}
                  <div className="text-center">
                    <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-4xl mb-4 mx-auto">
                      👤
                    </div>
                    <div className="text-white font-bold text-xl mb-2">
                      {opponent.username}
                    </div>
                    {opponent.mainFighter && (
                      <div className="flex justify-center">
                        <FighterIcon 
                          fighterId={opponent.mainFighter}
                          size="sm"
                          className="text-slate-400 text-sm mb-1"
                        />
                      </div>
                    )}
                    <div className="text-red-400 text-lg">
                      Rating: {opponent.rating}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-6">
                  <p className="text-slate-300 mb-6">
                    対戦相手とマッチングしました。対戦を開始しますか？
                  </p>
                  <button
                    onClick={acceptMatch}
                    className="w-full px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    対戦開始
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* キャンセル */}
          {status === 'cancelled' && (
            <div className="text-center">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
                <div className="text-yellow-400 text-4xl mb-4">⚠️</div>
                <p className="text-white text-xl">マッチングをキャンセルしました</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
