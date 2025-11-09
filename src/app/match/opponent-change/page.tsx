'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getFighterName } from '@/lib/fighters'
import { stages, getStagesByCategory } from '@/lib/stages'
import { 
  getMatchSession, 
  confirmFighterSelection,
  subscribeToMatchSession,
  updateSessionStatus,
  type MatchSession 
} from '@/lib/matchSession'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function OpponentChangePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const roomCode = searchParams.get('roomCode') || ''
  const isPlayer2 = searchParams.get('isPlayer2') === 'true'
  
  const [matchSession, setMatchSession] = useState<MatchSession | null>(null)
  const [myConfirmed, setMyConfirmed] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [prevOpponentFighter, setPrevOpponentFighter] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedBanStages, setSelectedBanStages] = useState<string[]>([])

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
        console.log('Initial session loaded:', session)
        setMatchSession(session)
        setLoadingError(null)
        
        // 初期ロード時に相手のファイターを設定
        const opponentFighter = isPlayer2 ? session.player1_fighter : session.player2_fighter
        setPrevOpponentFighter(opponentFighter)
        setIsInitialized(true)
      } else {
        console.error('Failed to load session:', error)
        setLoadingError(error || 'セッションの読み込みに失敗しました')
      }
    }

    loadSession()
  }, [user, roomCode, isPlayer2])

    // リアルタイム監視
  useEffect(() => {
    if (!user || !roomCode) return

    const channel = subscribeToMatchSession(
      roomCode,
      async (session) => {
        console.log('=== Real-time update received ===')
        console.log('Session:', session)
        console.log('isPlayer2:', isPlayer2)
        
        const opponentFighterNow = isPlayer2 ? session.player1_fighter : session.player2_fighter
        const myConfirmedNow = isPlayer2 ? session.player2_confirmed : session.player1_confirmed
        
        console.log('Opponent fighter now:', opponentFighterNow)
        console.log('Opponent fighter prev:', prevOpponentFighter)
        console.log('My confirmed:', myConfirmedNow)
        console.log('Initialized:', isInitialized)
        
        // 初回ロード時は前回のファイターを設定するだけ
        if (!isInitialized) {
          console.log('First load - setting initial fighter:', opponentFighterNow)
          setPrevOpponentFighter(opponentFighterNow)
          setIsInitialized(true)
        } else {
          // 相手のファイターが変わった場合、自分の確認をリセット
          if (opponentFighterNow !== prevOpponentFighter && myConfirmedNow) {
            console.log('🔄 Opponent changed fighter! Resetting my confirmation')
            console.log('From:', prevOpponentFighter, 'To:', opponentFighterNow)
            
            await supabase
              .from('match_sessions')
              .update({
                [isPlayer2 ? 'player2_confirmed' : 'player1_confirmed']: false,
                updated_at: new Date().toISOString()
              })
              .eq('room_code', roomCode)
            
            setMyConfirmed(false)
          }
          
          setPrevOpponentFighter(opponentFighterNow)
        }
        
        setMatchSession(session)

        // 自分の確認状態を更新
        const myConfirmedUpdated = isPlayer2 ? session.player2_confirmed : session.player1_confirmed
        setMyConfirmed(myConfirmedUpdated)

        // 両者が確認済み かつ 両者とも変更しない場合のみステージ選択へ
        const bothConfirmed = session.player1_confirmed && session.player2_confirmed
        const neitherWantsChange = !session.player1_wants_change && !session.player2_wants_change
        
        console.log('📊 Stage check:', {
          bothConfirmed,
          neitherWantsChange,
          player1_confirmed: session.player1_confirmed,
          player2_confirmed: session.player2_confirmed,
          player1_wants_change: session.player1_wants_change,
          player2_wants_change: session.player2_wants_change
        })
        
        // 両者が確認済みの場合、ステージ選択UIを表示（自動遷移はしない）
        if (bothConfirmed && neitherWantsChange) {
          console.log('✅ Both confirmed! Showing stage selection...')
        }
      },
      (error) => {
        console.error('Session subscription error:', error)
      }
    )

    return () => {
      channel.unsubscribe()
    }
  }, [user, roomCode, isPlayer2, router, prevOpponentFighter, isInitialized])

  if (loading || !matchSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">読み込み中...</div>
          {loadingError && (
            <div className="text-red-400 text-sm mt-4">
              <p>{loadingError}</p>
              <p className="mt-2">Room Code: {roomCode}</p>
              <button
                onClick={() => router.push('/matching')}
                className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                マッチングに戻る
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const opponentWantsChange = isPlayer2 ? matchSession.player1_wants_change : matchSession.player2_wants_change
  const opponentFighter = isPlayer2 ? matchSession.player1_fighter : matchSession.player2_fighter
  const opponentUsername = isPlayer2 ? matchSession.player1_username : matchSession.player2_username
  const myFighter = isPlayer2 ? matchSession.player2_fighter : matchSession.player1_fighter
  const opponentConfirmed = isPlayer2 ? matchSession.player1_confirmed : matchSession.player2_confirmed
  const myWantsChange = isPlayer2 ? matchSession.player2_wants_change : matchSession.player1_wants_change

  // 両者が確認済みかどうか
  const bothConfirmed = matchSession.player1_confirmed && matchSession.player2_confirmed
  const neitherWantsChange = !matchSession.player1_wants_change && !matchSession.player2_wants_change
  const showStageSelection = bothConfirmed && neitherWantsChange

  console.log('Stage Selection Check:', {
    bothConfirmed,
    neitherWantsChange,
    showStageSelection,
    player1_confirmed: matchSession.player1_confirmed,
    player2_confirmed: matchSession.player2_confirmed,
    player1_wants_change: matchSession.player1_wants_change,
    player2_wants_change: matchSession.player2_wants_change
  })

  // 相手が変更中の場合、自分の確認状態に関わらずボタンを有効にする
  const canTakeAction = !myWantsChange && (opponentWantsChange || opponentConfirmed)

  const handleAccept = async () => {
    // 自分のwants_changeをfalseにして確認
    const { setWantsToChangeFighter } = await import('@/lib/matchSession')
    await setWantsToChangeFighter(roomCode, user.id, false)
    
    // 確認済みとしてマーク
    await confirmFighterSelection(roomCode, user.id)
    setMyConfirmed(true)
  }

  const handleChangeMyFighter = async () => {
    // 自分もファイター変更することを記録
    const { setWantsToChangeFighter } = await import('@/lib/matchSession')
    await setWantsToChangeFighter(roomCode, user.id, true)
    
    // 相手の確認をリセット（相手に再度選択の機会を与える）
    await supabase
      .from('match_sessions')
      .update({
        [isPlayer2 ? 'player1_confirmed' : 'player2_confirmed']: false,
        updated_at: new Date().toISOString()
      })
      .eq('room_code', roomCode)
    
    // 自分もファイター変更する
    router.push(
      `/match/my-fighter-select?roomCode=${roomCode}&isPlayer2=${isPlayer2}`
    )
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
            {!opponentConfirmed && !opponentWantsChange ? (
              <>
                <div className="text-blue-400 text-6xl mb-4">⏳</div>
                <h1 className="text-4xl font-bold text-white mb-4">
                  {opponentUsername}の選択を待っています
                </h1>
                <p className="text-slate-300 text-lg">
                  対戦相手がファイター変更するか選択中です
                </p>
              </>
            ) : opponentWantsChange ? (
              <>
                <div className="text-yellow-400 text-6xl mb-4">⚠️</div>
                <h1 className="text-4xl font-bold text-white mb-4">
                  {opponentUsername}がファイターを変更しました
                </h1>
                <p className="text-slate-300 text-lg">
                  このまま対戦を続けますか？
                </p>
              </>
            ) : (
              <>
                <div className="text-green-400 text-6xl mb-4">✓</div>
                <h1 className="text-4xl font-bold text-white mb-4">
                  {opponentUsername}がファイター変更なし
                </h1>
                <p className="text-slate-300 text-lg">
                  対戦を開始できます
                </p>
              </>
            )}
          </div>

          {/* ファイター情報 */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* あなたのファイター */}
              <div className="text-center">
                <div className="text-primary-400 text-sm mb-3">あなたのファイター</div>
                <div className="bg-primary-900/30 border border-primary-700/50 rounded-lg p-6">
                  <div className="text-white text-3xl font-bold">
                    {myFighter ? getFighterName(myFighter) : '未設定'}
                  </div>
                </div>
              </div>

              {/* 対戦相手のファイター */}
              <div className="text-center">
                <div className="text-red-400 text-sm mb-3">{opponentUsername}のファイター</div>
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-6">
                  <div className="text-white text-3xl font-bold">
                    {opponentFighter ? getFighterName(opponentFighter) : '未設定'}
                  </div>
                  {opponentWantsChange && (
                    <div className="text-yellow-400 text-xs mt-2">
                      ファイター変更
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 確認状態 */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-slate-400 text-sm mb-2">あなた</div>
                {myWantsChange ? (
                  <div className="text-yellow-400 text-lg font-bold">
                    🔄 ファイター変更中
                  </div>
                ) : myConfirmed ? (
                  <div className="text-green-400 text-lg font-bold">
                    ✓ 確認済み
                  </div>
                ) : (
                  <div className="text-slate-500 text-lg font-bold">
                    待機中...
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-slate-400 text-sm mb-2">{opponentUsername}</div>
                {opponentWantsChange ? (
                  <div className="text-yellow-400 text-lg font-bold">
                    🔄 ファイター変更中
                  </div>
                ) : opponentConfirmed ? (
                  <div className="text-green-400 text-lg font-bold">
                    ✓ 確認済み
                  </div>
                ) : (
                  <div className="text-slate-500 text-lg font-bold">
                    待機中...
                  </div>
                )}
              </div>
            </div>
            
            {showStageSelection && (
              <div className="mt-4 text-center">
                <div className="text-green-400 text-lg font-bold mb-2">
                  ✓ 両者確認完了！
                </div>
                <div className="text-slate-300 text-sm">
                  下からステージを選択してください
                </div>
              </div>
            )}
          </div>

          {/* アクションボタン */}
          {canTakeAction && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={handleChangeMyFighter}
                className="px-8 py-6 text-white font-bold text-xl rounded-lg transition-colors bg-slate-700 hover:bg-slate-600"
              >
                自分も変更する
              </button>
              <button
                onClick={handleAccept}
                className="px-8 py-6 text-white font-bold text-xl rounded-lg transition-colors shadow-lg bg-green-600 hover:bg-green-700 hover:shadow-xl"
              >
                このまま対戦
              </button>
            </div>
          )}

          {/* 両者が変更中または確認待ちの場合 */}
          {!canTakeAction && myWantsChange && (
            <div className="text-center text-slate-400 mb-6">
              <p className="text-lg">ファイター選択を完了してください</p>
            </div>
          )}
          
          {!canTakeAction && !myWantsChange && !opponentConfirmed && !opponentWantsChange && (
            <div className="text-center text-slate-400 mb-6">
              <p className="text-lg">{opponentUsername}の選択を待っています...</p>
            </div>
          )}

          {/* ステージ選択UI */}
          {showStageSelection && (
            <div className="mt-8 space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">ステージ選択</h2>
                <p className="text-slate-300">
                  {matchSession.stage_selection_phase === 'player1_ban' 
                    ? isPlayer2 
                      ? 'プレイヤー1がステージを拒否中です...' 
                      : 'スタンダードステージから1つ拒否してください'
                    : matchSession.stage_selection_phase === 'player2_ban'
                    ? isPlayer2
                      ? 'スタンダードステージから2つ拒否してください'
                      : 'プレイヤー2がステージを拒否中です...'
                    : matchSession.stage_selection_phase === 'player1_select'
                    ? isPlayer2
                      ? 'プレイヤー1がステージを選択中です...'
                      : '残りのスタンダードステージから選択してください'
                    : '対戦開始の準備ができました'}
                </p>
              </div>

              {/* プレイヤー1のステージ拒否フェーズ（1つ） */}
              {matchSession.stage_selection_phase === 'player1_ban' && !isPlayer2 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    🚫 拒否するステージを1つ選択
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {getStagesByCategory('legal').map((stage) => (
                      <button
                        key={stage.id}
                        onClick={async () => {
                          const { banStagePlayer1 } = await import('@/lib/matchSession')
                          const result = await banStagePlayer1(roomCode, stage.id)
                          if (!result.success) {
                            alert('ステージの拒否に失敗しました')
                          }
                        }}
                        className="px-6 py-4 rounded-lg border-2 bg-slate-800/50 border-slate-700 text-slate-300 hover:border-red-500 hover:bg-red-900/30 transition-all font-bold"
                      >
                        {stage.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* プレイヤー1の待機画面（プレイヤー2が拒否中） */}
              {matchSession.stage_selection_phase === 'player1_ban' && isPlayer2 && (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 text-center">
                  <div className="text-blue-400 text-6xl mb-4">⏳</div>
                  <p className="text-white text-xl">
                    {matchSession.player1_username}がステージを拒否中です...
                  </p>
                </div>
              )}

              {/* プレイヤー2のステージ拒否フェーズ（2つ） */}
              {matchSession.stage_selection_phase === 'player2_ban' && isPlayer2 && (
                <div>
                  <div className="mb-4 bg-red-900/30 border border-red-700/50 rounded-lg p-4">
                    <div className="text-red-400 text-sm mb-1">プレイヤー1が拒否したステージ</div>
                    <div className="text-white text-xl font-bold">
                      {stages.find(s => s.id === matchSession.player1_banned_stage)?.name || '未設定'}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    🚫 拒否するステージを2つ選択
                    <span className="text-sm text-slate-400">
                      ({selectedBanStages.length}/2)
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {getStagesByCategory('legal')
                      .filter(stage => stage.id !== matchSession.player1_banned_stage)
                      .map((stage) => {
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
                            className={`px-6 py-4 rounded-lg border-2 transition-all font-bold ${
                              isSelected
                                ? 'bg-red-900/50 border-red-500 text-white'
                                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-red-500 hover:bg-red-900/30'
                            }`}
                          >
                            {stage.name}
                            {isSelected && <span className="ml-2">✓</span>}
                          </button>
                        )
                      })}
                  </div>
                  {selectedBanStages.length === 2 && (
                    <button
                      onClick={async () => {
                        const { banStagesPlayer2 } = await import('@/lib/matchSession')
                        const result = await banStagesPlayer2(roomCode, selectedBanStages)
                        if (result.success) {
                          setSelectedBanStages([])
                        } else {
                          alert('ステージの拒否に失敗しました')
                        }
                      }}
                      className="w-full px-6 py-4 bg-red-600 text-white font-bold text-xl rounded-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                      この2つのステージを拒否
                    </button>
                  )}
                </div>
              )}

              {/* プレイヤー2の待機画面（プレイヤー1が拒否中） */}
              {matchSession.stage_selection_phase === 'player2_ban' && !isPlayer2 && (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 text-center">
                  <div className="mb-4 bg-red-900/30 border border-red-700/50 rounded-lg p-4">
                    <div className="text-red-400 text-sm mb-1">あなたが拒否したステージ</div>
                    <div className="text-white text-xl font-bold">
                      {stages.find(s => s.id === matchSession.player1_banned_stage)?.name || '未設定'}
                    </div>
                  </div>
                  <div className="text-blue-400 text-6xl mb-4">⏳</div>
                  <p className="text-white text-xl">
                    {matchSession.player2_username}がステージを拒否中です...
                  </p>
                </div>
              )}

              {/* プレイヤー1のステージ選択フェーズ */}
              {matchSession.stage_selection_phase === 'player1_select' && !isPlayer2 && (
                <div>
                  <div className="mb-4 space-y-2">
                    <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
                      <div className="text-red-400 text-sm mb-1">拒否されたステージ</div>
                      <div className="text-white font-bold">
                        あなた: {stages.find(s => s.id === matchSession.player1_banned_stage)?.name || '未設定'}
                      </div>
                      <div className="text-white font-bold mt-1">
                        {matchSession.player2_username}: {
                          matchSession.player2_banned_stages?.map(id => 
                            stages.find(s => s.id === id)?.name
                          ).join(', ') || '未設定'
                        }
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    ✅ 残りのステージから1つ選択
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {getStagesByCategory('legal')
                      .filter(stage => 
                        stage.id !== matchSession.player1_banned_stage &&
                        !matchSession.player2_banned_stages?.includes(stage.id)
                      )
                      .map((stage) => (
                        <button
                          key={stage.id}
                          onClick={async () => {
                            const { selectStagePlayer1 } = await import('@/lib/matchSession')
                            const result = await selectStagePlayer1(roomCode, stage.id)
                            if (result.success) {
                              // ステージ選択完了後、対戦結果記録ページへ
                              router.push(`/match/result?roomCode=${roomCode}&isPlayer2=${isPlayer2}`)
                            } else {
                              alert('ステージの選択に失敗しました')
                            }
                          }}
                          className="px-6 py-4 rounded-lg border-2 bg-slate-800/50 border-slate-700 text-slate-300 hover:border-green-500 hover:bg-green-900/30 transition-all font-bold"
                        >
                          {stage.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* プレイヤー1の待機画面 */}
              {matchSession.stage_selection_phase === 'player1_select' && isPlayer2 && (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 text-center">
                  <div className="mb-4 space-y-2">
                    <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
                      <div className="text-red-400 text-sm mb-1">拒否されたステージ</div>
                      <div className="text-white font-bold">
                        {matchSession.player1_username}: {stages.find(s => s.id === matchSession.player1_banned_stage)?.name || '未設定'}
                      </div>
                      <div className="text-white font-bold mt-1">
                        あなた: {
                          matchSession.player2_banned_stages?.map(id => 
                            stages.find(s => s.id === id)?.name
                          ).join(', ') || '未設定'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="text-blue-400 text-6xl mb-4">⏳</div>
                  <p className="text-white text-xl">
                    {matchSession.player1_username}がステージを選択中です...
                  </p>
                </div>
              )}

              {/* ステージ選択完了 */}
              {matchSession.stage_selection_phase === 'completed' && (
                <div className="bg-gradient-to-r from-green-600/20 to-green-800/20 border-2 border-green-500/50 rounded-lg p-8 text-center">
                  <div className="text-green-400 text-6xl mb-4">✓</div>
                  <div className="text-white text-2xl font-bold mb-4">
                    ステージ選択完了
                  </div>
                  <div className="mb-6 space-y-2">
                    <div className="text-slate-300 text-sm">拒否されたステージ</div>
                    <div className="text-red-400">
                      {matchSession.player1_username}: {stages.find(s => s.id === matchSession.player1_banned_stage)?.name}
                    </div>
                    <div className="text-red-400 mb-4">
                      {matchSession.player2_username}: {
                        matchSession.player2_banned_stages?.map(id => 
                          stages.find(s => s.id === id)?.name
                        ).join(', ')
                      }
                    </div>
                    <div className="text-green-400 font-bold text-xl mt-4">
                      選択されたステージ: {stages.find(s => s.id === matchSession.player1_selected_stage)?.name}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/match/result?roomCode=${roomCode}&isPlayer2=${isPlayer2}`)}
                    className="w-full px-6 py-4 bg-green-600 text-white font-bold text-xl rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    対戦結果を記録する
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
