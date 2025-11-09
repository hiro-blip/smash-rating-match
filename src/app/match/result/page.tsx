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
  subscribeToMatchSession,
  reportGame1Result,
  reportGameResult,
  resetGameReports,
  type MatchSession 
} from '@/lib/matchSession'
import Link from 'next/link'

export default function MatchResultPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const roomCode = searchParams.get('roomCode') || ''
  const isPlayer2 = searchParams.get('isPlayer2') === 'true'
  
  const [matchSession, setMatchSession] = useState<MatchSession | null>(null)
  const [selectedWinner, setSelectedWinner] = useState<'player1' | 'player2' | null>(null)
  const [myReport, setMyReport] = useState<'player1' | 'player2' | null>(null)
  const [opponentReport, setOpponentReport] = useState<'player1' | 'player2' | null>(null)
  const [showMismatch, setShowMismatch] = useState(false)

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

  // リアルタイム監視
  useEffect(() => {
    if (!user || !roomCode) return

    const channel = subscribeToMatchSession(
      roomCode,
      (session) => {
        console.log('Match result session update:', session)
        setMatchSession(session)

        const currentGame = session.current_game
        const isPlayer1 = session.player1_id === user.id

        // 自分と相手の報告を取得
        let myRep: string | null = null
        let oppRep: string | null = null

        if (currentGame === 1) {
          myRep = isPlayer1 ? session.game1_player1_report : session.game1_player2_report
          oppRep = isPlayer1 ? session.game1_player2_report : session.game1_player1_report
        } else if (currentGame === 2) {
          myRep = isPlayer1 ? session.game2_player1_report : session.game2_player2_report
          oppRep = isPlayer1 ? session.game2_player2_report : session.game2_player1_report
        } else if (currentGame === 3) {
          myRep = isPlayer1 ? session.game3_player1_report : session.game3_player2_report
          oppRep = isPlayer1 ? session.game3_player2_report : session.game3_player1_report
        }

        setMyReport(myRep as 'player1' | 'player2' | null)
        setOpponentReport(oppRep as 'player1' | 'player2' | null)

        // 両者が報告済みで不一致の場合
        if (myRep && oppRep && myRep !== oppRep) {
          setShowMismatch(true)
        } else {
          setShowMismatch(false)
        }

        // 両者の報告が一致し、次のゲームに進んだ場合
        if (session.current_game > currentGame || session.stage_selection_phase === 'player1_ban') {
          // 2戦目または3戦目のステージ選択へ
          if (session.current_game > 1 && session.current_game <= 3) {
            router.push(`/match/stage-select-next?roomCode=${roomCode}&isPlayer2=${isPlayer2}`)
          }
        }

        // 試合が完了したら最終結果ページへ
        if (session.status === 'completed' && session.match_winner) {
          router.push(`/match/final-result?roomCode=${roomCode}&isPlayer2=${isPlayer2}`)
        }
      }
    )

    return () => {
      channel.unsubscribe()
    }
  }, [user, roomCode, isPlayer2, router])

  if (loading || !matchSession || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  const currentGame = matchSession.current_game
  const myId = user.id
  const isPlayer1 = matchSession.player1_id === myId
  const opponentUsername = isPlayer2 ? matchSession.player1_username : matchSession.player2_username

  // 使用したステージを取得
  const usedStage = currentGame === 1 
    ? matchSession.player1_selected_stage 
    : currentGame === 2 
    ? matchSession.game2_stage 
    : matchSession.game3_stage

  const handleSubmitResult = async () => {
    if (!selectedWinner || !user) {
      alert('勝者を選択してください')
      return
    }

    const currentGame = matchSession?.current_game || 1

    let result
    if (currentGame === 1) {
      result = await reportGame1Result(roomCode, user.id, selectedWinner)
    } else {
      result = await reportGameResult(roomCode, currentGame as 2 | 3, user.id, selectedWinner)
    }

    if (result.success) {
      setMyReport(selectedWinner)
      
      if (result.matched) {
        console.log('✅ Reports matched! Proceeding to next game')
      } else {
        console.log('⏳ Waiting for opponent report...')
      }
    } else {
      alert('結果の報告に失敗しました')
    }
  }

  const handleResetReports = async () => {
    const currentGame = matchSession?.current_game || 1
    await resetGameReports(roomCode, currentGame as 1 | 2 | 3)
    setMyReport(null)
    setOpponentReport(null)
    setSelectedWinner(null)
    setShowMismatch(false)
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
        <div className="max-w-3xl mx-auto">
          {/* タイトル */}
          <div className="text-center mb-8">
            <div className="text-blue-400 text-6xl mb-4">🎯</div>
            <h1 className="text-4xl font-bold text-white mb-4">
              第{currentGame}戦 試合結果
            </h1>
            <p className="text-slate-300 text-lg">
              勝者を選択してください
            </p>
          </div>

          {/* 試合情報 */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 mb-8">
            <div className="text-center mb-6">
              <div className="text-slate-400 text-sm mb-2">使用ステージ</div>
              <div className="text-white text-2xl font-bold">
                {usedStage ? stages.find(s => s.id === usedStage)?.name : '未設定'}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* プレイヤー1 */}
              <div className="text-center">
                <div className="text-primary-400 text-sm mb-3">
                  {matchSession.player1_username}
                </div>
                <div className="bg-primary-900/30 border border-primary-700/50 rounded-lg p-6 mb-4">
                  {matchSession.player1_fighter ? (
                    <div className="flex justify-center mb-2">
                      <FighterIcon 
                        fighterId={matchSession.player1_fighter}
                        size="md"
                        className="text-white"
                      />
                    </div>
                  ) : (
                    <div className="text-white text-2xl font-bold mb-2">未設定</div>
                  )}
                  <div className="text-primary-400 text-xl font-bold">
                    {matchSession.player1_wins}勝
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWinner('player1')}
                  disabled={!!myReport}
                  className={`w-full px-6 py-4 rounded-lg border-2 transition-all font-bold ${
                    selectedWinner === 'player1'
                      ? 'bg-green-600 border-green-400 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-green-500 hover:bg-green-900/30'
                  } ${myReport ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {selectedWinner === 'player1' ? '✓ 勝利' : '勝利'}
                </button>
              </div>

              {/* プレイヤー2 */}
              <div className="text-center">
                <div className="text-red-400 text-sm mb-3">
                  {matchSession.player2_username}
                </div>
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-6 mb-4">
                  {matchSession.player2_fighter ? (
                    <div className="flex justify-center mb-2">
                      <FighterIcon 
                        fighterId={matchSession.player2_fighter}
                        size="md"
                        className="text-white"
                      />
                    </div>
                  ) : (
                    <div className="text-white text-2xl font-bold mb-2">未設定</div>
                  )}
                  <div className="text-red-400 text-xl font-bold">
                    {matchSession.player2_wins}勝
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWinner('player2')}
                  disabled={!!myReport}
                  className={`w-full px-6 py-4 rounded-lg border-2 transition-all font-bold ${
                    selectedWinner === 'player2'
                      ? 'bg-green-600 border-green-400 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-green-500 hover:bg-green-900/30'
                  } ${myReport ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {selectedWinner === 'player2' ? '✓ 勝利' : '勝利'}
                </button>
              </div>
            </div>
          </div>

          {/* 報告状況の表示 */}
          {(myReport || opponentReport) && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-8">
              <h3 className="text-white text-lg font-bold mb-4 text-center">報告状況</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-slate-400 text-sm mb-2">あなたの報告</div>
                  {myReport ? (
                    <div className="text-green-400 text-xl font-bold">
                      ✓ {myReport === 'player1' ? matchSession.player1_username : matchSession.player2_username}
                    </div>
                  ) : (
                    <div className="text-slate-500">未報告</div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-slate-400 text-sm mb-2">相手の報告</div>
                  {opponentReport ? (
                    <div className="text-green-400 text-xl font-bold">
                      ✓ {opponentReport === 'player1' ? matchSession.player1_username : matchSession.player2_username}
                    </div>
                  ) : (
                    <div className="text-slate-500">待機中...</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 不一致の警告 */}
          {showMismatch && (
            <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-6 mb-8">
              <div className="text-center mb-4">
                <div className="text-red-400 text-6xl mb-4">⚠️</div>
                <h3 className="text-red-400 text-2xl font-bold mb-2">報告が一致しません</h3>
                <p className="text-slate-300">
                  両者の報告が異なっています。もう一度確認して入力し直してください。
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-slate-400 text-sm mb-1">あなたの報告</div>
                    <div className="text-white font-bold">
                      {myReport === 'player1' ? matchSession.player1_username : matchSession.player2_username} の勝利
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm mb-1">相手の報告</div>
                    <div className="text-white font-bold">
                      {opponentReport === 'player1' ? matchSession.player1_username : matchSession.player2_username} の勝利
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleResetReports}
                className="w-full px-6 py-4 bg-red-600 text-white font-bold text-xl rounded-lg hover:bg-red-700 transition-colors"
              >
                報告をリセットして入力し直す
              </button>
            </div>
          )}

          {/* 送信ボタン */}
          {selectedWinner && !myReport && !showMismatch && (
            <button
              onClick={handleSubmitResult}
              className="w-full px-6 py-4 bg-green-600 text-white font-bold text-xl rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
            >
              結果を送信
            </button>
          )}

          {/* 待機中 */}
          {myReport && !opponentReport && !showMismatch && (
            <div className="text-center">
              <div className="text-blue-400 text-6xl mb-4">⏳</div>
              <p className="text-white text-xl">
                相手の報告を待っています...
              </p>
            </div>
          )}

          {/* 一致して次へ進む場合 */}
          {myReport && opponentReport && myReport === opponentReport && !showMismatch && (
            <div className="text-center">
              <div className="text-green-400 text-6xl mb-4">✓</div>
              <p className="text-white text-xl">
                報告が一致しました！次の試合の準備中...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
