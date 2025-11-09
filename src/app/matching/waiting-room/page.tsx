'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserStats } from '@/lib/rating'
import { getFighterName } from '@/lib/fighters'
import { 
  leaveMatchingQueue, 
  subscribeToMatchingQueue, 
  updateRoomCode,
  findMatch,
  confirmMatch
} from '@/lib/matchingQueue'
import type { MatchingQueueEntry } from '@/lib/supabase'
import Link from 'next/link'

export default function WaitingRoomPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [roomCode, setRoomCode] = useState('')
  const [profile, setProfile] = useState<{
    username: string
    profileImage: string
    mainFighter: string
    comments: string
  } | null>(null)
  const [myRating, setMyRating] = useState(1500)
  const [ratingRange, setRatingRange] = useState({ min: 1000, max: 3000 })
  const [myQueueId, setMyQueueId] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [roomCodeSaved, setRoomCodeSaved] = useState(false)
  const [canStartMatching, setCanStartMatching] = useState(false) // マッチング開始許可フラグ

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      const loadUserData = async () => {
        const savedProfile = localStorage.getItem(`profile_${user.id}`)
        const stats = await getUserStats(user.id)
        setMyRating(stats.rating)
        
        // URLパラメータからレーティング範囲を取得
        const minRating = searchParams.get('minRating')
        const maxRating = searchParams.get('maxRating')
        const queueId = searchParams.get('queueId')
        
        if (minRating && maxRating) {
          setRatingRange({
            min: parseInt(minRating),
            max: parseInt(maxRating)
          })
        }
        
        if (queueId) {
          setMyQueueId(queueId)
        }
        
        if (savedProfile) {
          const data = JSON.parse(savedProfile)
          setProfile({
            username: data.username || 'プレイヤー',
            profileImage: data.profileImage || '👤',
            mainFighter: data.mainFighter || '',
            comments: data.comments || '',
          })
        }
      }
      
      loadUserData()
    }
  }, [user, loading, router, searchParams])

  // リアルタイムマッチング監視（常に有効）
  useEffect(() => {
    if (!user) return

    const channel = subscribeToMatchingQueue(
      user.id,
      (matchedOpponent: MatchingQueueEntry) => {
        // マッチング成功 - ファイター変更確認ページへ（自分はプレイヤー1）
        router.push(
          `/match/change-fighter-confirm?opponentName=${encodeURIComponent(matchedOpponent.username)}&opponentRating=${matchedOpponent.rating}&opponentMainFighter=${matchedOpponent.main_fighter || ''}&roomCode=${roomCode}`
        )
      },
      (error) => {
        console.error('Matching error:', error)
      }
    )

    return () => {
      channel.unsubscribe()
    }
  }, [user, router, roomCode])

  // 継続的にマッチング相手を検索
  useEffect(() => {
    if (!user || !myQueueId || isSearching || !canStartMatching) return

    const searchInterval = setInterval(async () => {
      setIsSearching(true)
      
      const { success, match } = await findMatch(
        user.id, 
        myRating, 
        ratingRange.min, 
        ratingRange.max
      )

      if (success && match) {
        console.log('Match found in waiting room:', match)
        // マッチング相手が見つかった
        const confirmResult = await confirmMatch(myQueueId, match.id)
        
        if (confirmResult.success) {
          console.log('Match confirmed, navigating to fighter selection')
          // ファイター変更確認ページへ（自分はプレイヤー1）
          router.push(
            `/match/change-fighter-confirm?opponentName=${encodeURIComponent(match.username)}&opponentRating=${match.rating}&opponentMainFighter=${match.main_fighter || ''}&roomCode=${roomCode}`
          )
        } else {
          console.error('Failed to confirm match:', confirmResult.error)
        }
      }
      
      setIsSearching(false)
    }, 3000) // 3秒ごとに検索（少し間隔を伸ばす）

    return () => clearInterval(searchInterval)
  }, [user, myQueueId, myRating, ratingRange, isSearching, canStartMatching, router])

  const handleDeleteRoom = async () => {
    if (user) {
      await leaveMatchingQueue(user.id)
    }
    router.push('/matching')
  }

  // 部屋番号を更新するボタン
  const handleUpdateRoomCode = async () => {
    if (!user || !roomCode.trim()) {
      alert('部屋番号を入力してください')
      return
    }

    const result = await updateRoomCode(user.id, roomCode)
    if (result.success) {
      setRoomCodeSaved(true)
      setCanStartMatching(true) // マッチング検索を開始
      setIsSearching(false) // 検索フラグをリセット
      // 3秒後にメッセージを消す
      setTimeout(() => setRoomCodeSaved(false), 3000)
    } else {
      alert('部屋番号の更新に失敗しました')
    }
  }

  // 部屋番号が更新されたらマッチング検索を停止
  useEffect(() => {
    setRoomCodeSaved(false)
  }, [roomCode])

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
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              対戦部屋を作成しました
            </h1>
            <p className="text-slate-300 text-lg">
              対戦相手が参加するまでお待ちください
            </p>
          </div>

          {/* 部屋番号入力 */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-6">
            <label className="block text-white text-lg font-semibold mb-3">
              部屋番号
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="スマブラの専用部屋番号を入力してください"
                className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-lg"
                maxLength={20}
              />
              <button
                onClick={handleUpdateRoomCode}
                disabled={!roomCode.trim()}
                className={`px-6 py-3 font-bold rounded-lg transition-all ${
                  roomCode.trim()
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                部屋番号を更新
              </button>
            </div>
            {roomCodeSaved && (
              <p className="text-green-400 text-sm mt-2 flex items-center gap-2">
                ✓ 部屋番号を更新しました
              </p>
            )}
            <p className="text-slate-400 text-sm mt-2">
              💡 参加者がこの番号を使って部屋に入ります
            </p>
          </div>

          {/* プレイヤー情報 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* プレイヤー1 */}
            <div>
              <div className="bg-primary-600 text-white text-center py-3 rounded-t-lg font-bold text-xl">
                プレイヤー1
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 border-t-0 rounded-b-lg p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 pb-6 border-b border-slate-700">
                    <div className="text-6xl">
                      {profile?.profileImage || '👤'}
                    </div>
                    <div className="flex-1">
                      <div className="text-slate-400 text-sm mb-1">プレイヤー</div>
                      <div className="text-white text-2xl font-bold">
                        {profile?.username || 'あなた'}
                      </div>
                    </div>
                  </div>

                  <div className="pb-6 border-b border-slate-700">
                    <div className="text-slate-400 text-sm mb-1">レート</div>
                    <div className="text-white text-3xl font-bold">
                      {myRating}
                    </div>
                  </div>

                  {profile?.mainFighter && (
                    <div className="pb-6 border-b border-slate-700">
                      <div className="text-slate-400 text-sm mb-2">使用キャラ</div>
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">🎮</div>
                        <div className="text-white text-xl font-semibold">
                          {getFighterName(profile.mainFighter)}
                        </div>
                      </div>
                    </div>
                  )}

                  {profile?.comments && (
                    <div>
                      <div className="text-slate-400 text-sm mb-2">コメント</div>
                      <div className="text-white text-base">
                        {profile.comments}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* プレイヤー2（待機中） */}
            <div>
              <div className="bg-red-600 text-white text-center py-3 rounded-t-lg font-bold text-xl">
                プレイヤー2
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 border-t-0 rounded-b-lg p-8">
                <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                  {/* 待機アニメーション */}
                  <div className="relative mb-6">
                    <div className="w-32 h-32 border-8 border-slate-700 border-t-red-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl">⏳</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-white text-xl font-bold mb-2">
                      対戦相手を待っています...
                    </p>
                    <p className="text-slate-400">
                      画面が切り替わるまでお待ちください。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 部屋を削除ボタン */}
          <div className="mt-8 text-center">
            <button
              onClick={handleDeleteRoom}
              className="px-8 py-4 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors border-2 border-slate-600 hover:border-slate-500"
            >
              部屋を削除する
            </button>
          </div>

          {/* ヘルプ */}
          <div className="mt-6 bg-slate-800/30 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="text-slate-300 text-sm">
                <p className="font-semibold mb-2">待機中について</p>
                <ul className="space-y-1 text-slate-400">
                  <li>• 部屋番号を入力すると、対戦相手がその番号で参加できます</li>
                  <li>• 同じレーティング範囲のプレイヤーが自動的にマッチングされます</li>
                  <li>• マッチングが成立すると自動的に画面が切り替わります</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
