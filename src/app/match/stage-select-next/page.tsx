'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getFighterName } from '@/lib/fighters'
import { stages, getStagesByCategory } from '@/lib/stages'
import { 
  getMatchSession, 
  subscribeToMatchSession,
  banStagesWinner,
  selectStageLoser,
  type MatchSession 
} from '@/lib/matchSession'
import Link from 'next/link'

export default function StageSelectNextPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const roomCode = searchParams.get('roomCode') || ''
  const isPlayer2 = searchParams.get('isPlayer2') === 'true'
  
  const [matchSession, setMatchSession] = useState<MatchSession | null>(null)
  const [selectedBanStages, setSelectedBanStages] = useState<string[]>([])
  const [loadingError, setLoadingError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // セッション取得
  useEffect(() => {
    if (!user || !roomCode) return

    const loadSession = async () => {
      const { success, session, error } = await getMatchSession(roomCode)
      if (success && session) {
        setMatchSession(session)
        setLoadingError(null)
      } else {
        setLoadingError(error || 'セッションの読み込みに失敗しました')
      }
    }

    loadSession()
  }, [user, roomCode])

  // リアルタイム監視
  useEffect(() => {
    if (!user || !roomCode) return

    const channel = subscribeToMatchSession(
      roomCode,
      (session) => {
        console.log('Stage select next session update:', session)
        setMatchSession(session)

        // ステージ選択が完了したら試合結果ページへ
        if (session.stage_selection_phase === 'completed') {
          router.push(`/match/result?roomCode=${roomCode}&isPlayer2=${isPlayer2}`)
        }
      }
    )

    return () => {
      channel.unsubscribe()
    }
  }, [user, roomCode, isPlayer2, router])

  if (loading || !matchSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">読み込み中...</div>
          {loadingError && (
            <div className="text-red-400 text-sm">
              <p>{loadingError}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const currentGame = matchSession.current_game
  const myId = user.id
  const isPlayer1 = matchSession.player1_id === myId
  
  // 前の試合の勝者を判定
  const previousGameWinner = currentGame === 2 
    ? matchSession.game1_winner 
    : matchSession.game2_winner
  
  const amIWinner = (previousGameWinner === 'player1' && isPlayer1) || 
                    (previousGameWinner === 'player2' && !isPlayer1)

  // 拒否済みのステージを取得
  const bannedStages = currentGame === 2 
    ? matchSession.game2_banned_stages || []
    : matchSession.game3_banned_stages || []

  // 全ステージ（legal + counterpick）を取得
  const allStages = [
    ...getStagesByCategory('legal'),
    ...getStagesByCategory('counterpick')
  ]

  const handleBanStages = async () => {
    if (selectedBanStages.length !== 2) {
      alert('ステージを2つ選択してください')
      return
    }

    const result = await banStagesWinner(roomCode, selectedBanStages, currentGame as 2 | 3)
    if (result.success) {
      setSelectedBanStages([])
    } else {
      alert('ステージの拒否に失敗しました')
    }
  }

  const handleSelectStage = async (stageId: string) => {
    const result = await selectStageLoser(roomCode, stageId, currentGame as 2 | 3, previousGameWinner as 'player1' | 'player2')
    if (result.success) {
      // 試合結果ページへ自動遷移（リアルタイム監視で処理）
    } else {
      alert('ステージの選択に失敗しました')
    }
  }

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
          {/* タイトル */}
          <div className="text-center mb-8">
            <div className="text-yellow-400 text-6xl mb-4">🏆</div>
            <h1 className="text-4xl font-bold text-white mb-4">
              第{currentGame}戦 ステージ選択
            </h1>
            <p className="text-slate-300 text-lg">
              {amIWinner 
                ? '勝者としてステージを2つ拒否してください' 
                : '敗者が拒否したステージを除いて選択してください'}
            </p>
          </div>

          {/* 試合状況 */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-primary-400 text-sm mb-2">
                  {matchSession.player1_username}
                </div>
                <div className="bg-primary-900/30 border border-primary-700/50 rounded-lg p-4">
                  <div className="text-white text-xl font-bold mb-1">
                    {getFighterName(matchSession.player1_fighter || '')}
                  </div>
                  <div className="text-primary-400 text-2xl font-bold">
                    {matchSession.player1_wins}勝
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-red-400 text-sm mb-2">
                  {matchSession.player2_username}
                </div>
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
                  <div className="text-white text-xl font-bold mb-1">
                    {getFighterName(matchSession.player2_fighter || '')}
                  </div>
                  <div className="text-red-400 text-2xl font-bold">
                    {matchSession.player2_wins}勝
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 勝者：ステージ拒否 */}
          {amIWinner && matchSession.stage_selection_phase === 'player1_ban' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  🚫 拒否するステージを2つ選択
                  <span className="text-sm text-slate-400">
                    ({selectedBanStages.length}/2)
                  </span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {allStages.map((stage) => {
                    const isSelected = selectedBanStages.includes(stage.id)
                    return (
                      <button
                        key={stage.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedBanStages(prev => prev.filter(id => id !== stage.id))
                          } else if (selectedBanStages.length < 2) {
                            setSelectedBanStages(prev => [...prev, stage.id])
                          }
                        }}
                        className={`px-4 py-3 rounded-lg border-2 transition-all font-bold text-sm ${
                          isSelected
                            ? 'bg-red-900/50 border-red-500 text-white'
                            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-red-500 hover:bg-red-900/30'
                        }`}
                      >
                        {stage.name}
                        {isSelected && <span className="ml-1">✓</span>}
                      </button>
                    )
                  })}
                </div>
                {selectedBanStages.length === 2 && (
                  <button
                    onClick={handleBanStages}
                    className="w-full px-6 py-4 bg-red-600 text-white font-bold text-xl rounded-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    この2つのステージを拒否
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 勝者：待機中 */}
          {amIWinner && matchSession.stage_selection_phase === 'player2_ban' && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 text-center">
              <div className="mb-4 bg-red-900/30 border border-red-700/50 rounded-lg p-4">
                <div className="text-red-400 text-sm mb-1">あなたが拒否したステージ</div>
                <div className="text-white text-lg font-bold">
                  {bannedStages.map(id => stages.find(s => s.id === id)?.name).join(', ')}
                </div>
              </div>
              <div className="text-blue-400 text-6xl mb-4">⏳</div>
              <p className="text-white text-xl">
                相手がステージを選択中です...
              </p>
            </div>
          )}

          {/* 敗者：待機中（勝者が拒否中） */}
          {!amIWinner && matchSession.stage_selection_phase === 'player1_ban' && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 text-center">
              <div className="text-blue-400 text-6xl mb-4">⏳</div>
              <p className="text-white text-xl">
                {previousGameWinner === 'player1' ? matchSession.player1_username : matchSession.player2_username}
                がステージを拒否中です...
              </p>
            </div>
          )}

          {/* 敗者：ステージ選択 */}
          {!amIWinner && matchSession.stage_selection_phase === 'player2_ban' && (
            <div>
              <div className="mb-4 bg-red-900/30 border border-red-700/50 rounded-lg p-4">
                <div className="text-red-400 text-sm mb-1">相手が拒否したステージ</div>
                <div className="text-white text-xl font-bold">
                  {bannedStages.map(id => stages.find(s => s.id === id)?.name).join(', ')}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                ✅ 残りのステージから1つ選択
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {allStages
                  .filter(stage => !bannedStages.includes(stage.id))
                  .map((stage) => (
                    <button
                      key={stage.id}
                      onClick={() => handleSelectStage(stage.id)}
                      className="px-4 py-3 rounded-lg border-2 bg-slate-800/50 border-slate-700 text-slate-300 hover:border-green-500 hover:bg-green-900/30 transition-all font-bold text-sm"
                    >
                      {stage.name}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
