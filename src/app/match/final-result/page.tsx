'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getFighterName } from '@/lib/fighters'
import FighterIcon from '@/components/FighterIcon'
import { stages } from '@/lib/stages'
import { 
  getMatchSession, 
  type MatchSession 
} from '@/lib/matchSession'
import { recordMatch } from '@/lib/rating'
import Link from 'next/link'

export default function FinalResultPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const roomCode = searchParams.get('roomCode') || ''
  const isPlayer2 = searchParams.get('isPlayer2') === 'true'
  
  const [matchSession, setMatchSession] = useState<MatchSession | null>(null)
  const [ratingsSaved, setRatingsSaved] = useState(false)
  const [ratingChange, setRatingChange] = useState<number | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // セッション取得
  useEffect(() => {
    if (!user || !roomCode) return

    const loadSession = async () => {
      const { success, session } = await getMatchSession(roomCode)
      if (success && session) {
        setMatchSession(session)
      }
    }

    loadSession()
  }, [user, roomCode])

  // レーティングを保存（一度だけ実行）
  useEffect(() => {
    if (!user || !matchSession || ratingsSaved) return
    
    console.log('=== SAVE RATINGS CHECK ===')
    console.log('User ID:', user.id)
    console.log('Match Session:', matchSession)
    console.log('Match Winner:', matchSession.match_winner)
    
    if (!matchSession.match_winner) {
      console.warn('No match_winner set yet, skipping rating save')
      return
    }
    
    const saveRatings = async () => {
      try {
        const myId = user.id
        const isPlayer1 = matchSession.player1_id === myId
        const didIWin = (matchSession.match_winner === 'player1' && isPlayer1) || 
                        (matchSession.match_winner === 'player2' && !isPlayer1)
        
        const opponentId = isPlayer1 ? matchSession.player2_id : matchSession.player1_id
        
        console.log('Saving ratings:', { myId, opponentId, didIWin, isPlayer1 })
        
        // 自分のレーティングを更新
        const result = await recordMatch(myId, opponentId, didIWin)
        setRatingChange(result.ratingChange)
        setRatingsSaved(true)
        
        console.log('Ratings saved successfully:', result)
      } catch (error) {
        console.error('Failed to save ratings:', error)
      }
    }

    saveRatings()
  }, [user, matchSession, ratingsSaved])

  if (loading || !matchSession || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  const myId = user.id
  const isPlayer1 = matchSession.player1_id === myId
  const didIWin = (matchSession.match_winner === 'player1' && isPlayer1) || 
                  (matchSession.match_winner === 'player2' && !isPlayer1)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-white hover:text-primary-400 transition-colors">
              🎮 スマブラレーティング
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 勝敗表示 */}
          <div className="text-center mb-8">
            <div className={`text-8xl mb-6 ${didIWin ? 'animate-bounce' : ''}`}>
              {didIWin ? '🎉' : '💪'}
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              {didIWin ? 'あなたの勝利！' : '惜敗...次は勝ちましょう！'}
            </h1>
            <div className="text-3xl font-bold mb-2">
              <span className={matchSession.player1_wins === 2 ? 'text-green-400' : 'text-slate-400'}>
                {matchSession.player1_wins}
              </span>
              <span className="text-white mx-4">-</span>
              <span className={matchSession.player2_wins === 2 ? 'text-green-400' : 'text-slate-400'}>
                {matchSession.player2_wins}
              </span>
            </div>
            
            {/* レーティング変動 */}
            {ratingChange !== null && (
              <div className="mt-6 inline-block bg-slate-800/70 border border-slate-600 rounded-lg px-8 py-4">
                <div className="text-slate-300 text-sm mb-1">レーティング変動</div>
                <div className={`text-4xl font-bold ${ratingChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {ratingChange >= 0 ? '+' : ''}{ratingChange}
                </div>
              </div>
            )}
          </div>

          {/* プレイヤー情報 */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-center">
                <div className="text-primary-400 text-sm mb-3">
                  {matchSession.player1_username}
                  {matchSession.match_winner === 'player1' && ' 🏆'}
                </div>
                <div className="bg-primary-900/30 border border-primary-700/50 rounded-lg p-6">
                  <div className="flex justify-center mb-2">
                    <FighterIcon 
                      fighterId={matchSession.player1_fighter || ''}
                      size="md"
                      className="text-white"
                    />
                  </div>
                  <div className="text-primary-400 text-4xl font-bold">
                    {matchSession.player1_wins}勝
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-red-400 text-sm mb-3">
                  {matchSession.player2_username}
                  {matchSession.match_winner === 'player2' && ' 🏆'}
                </div>
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-6">
                  <div className="flex justify-center mb-2">
                    <FighterIcon 
                      fighterId={matchSession.player2_fighter || ''}
                      size="md"
                      className="text-white"
                    />
                  </div>
                  <div className="text-red-400 text-4xl font-bold">
                    {matchSession.player2_wins}勝
                  </div>
                </div>
              </div>
            </div>

            {/* 試合詳細 */}
            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-white text-lg font-bold mb-4 text-center">試合詳細</h3>
              <div className="space-y-3">
                {/* 1戦目 */}
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-sm">第1戦</span>
                      <div className="text-white font-bold mt-1">
                        {stages.find(s => s.id === matchSession.game1_stage)?.name || '未設定'}
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {matchSession.game1_winner === 'player1' ? (
                        <span className="text-primary-400">{matchSession.player1_username}</span>
                      ) : (
                        <span className="text-red-400">{matchSession.player2_username}</span>
                      )}
                      <span className="text-yellow-400 ml-2">WIN</span>
                    </div>
                  </div>
                </div>

                {/* 2戦目 */}
                {matchSession.game2_stage && (
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-sm">第2戦</span>
                        <div className="text-white font-bold mt-1">
                          {stages.find(s => s.id === matchSession.game2_stage)?.name || '未設定'}
                        </div>
                        <div className="text-slate-400 text-xs mt-1">
                          拒否: {matchSession.game2_banned_stages?.map(id => 
                            stages.find(s => s.id === id)?.name
                          ).join(', ')}
                        </div>
                      </div>
                      <div className="text-2xl font-bold">
                        {matchSession.game2_winner === 'player1' ? (
                          <span className="text-primary-400">{matchSession.player1_username}</span>
                        ) : (
                          <span className="text-red-400">{matchSession.player2_username}</span>
                        )}
                        <span className="text-yellow-400 ml-2">WIN</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3戦目 */}
                {matchSession.game3_stage && (
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-sm">第3戦</span>
                        <div className="text-white font-bold mt-1">
                          {stages.find(s => s.id === matchSession.game3_stage)?.name || '未設定'}
                        </div>
                        <div className="text-slate-400 text-xs mt-1">
                          拒否: {matchSession.game3_banned_stages?.map(id => 
                            stages.find(s => s.id === id)?.name
                          ).join(', ')}
                        </div>
                      </div>
                      <div className="text-2xl font-bold">
                        {matchSession.game3_winner === 'player1' ? (
                          <span className="text-primary-400">{matchSession.player1_username}</span>
                        ) : (
                          <span className="text-red-400">{matchSession.player2_username}</span>
                        )}
                        <span className="text-yellow-400 ml-2">WIN</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="space-y-4">
            <button
              onClick={() => router.push('/matching')}
              className="w-full px-6 py-4 bg-primary-600 text-white font-bold text-xl rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
            >
              もう一度マッチングする
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-4 bg-slate-700 text-white font-bold text-xl rounded-lg hover:bg-slate-600 transition-colors"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
