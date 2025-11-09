import { supabase } from './supabase'

export interface MatchSession {
  id: string
  room_code: string
  player1_id: string
  player1_username: string
  player1_fighter: string | null
  player1_wants_change: boolean
  player1_confirmed: boolean
  player1_banned_stage: string | null
  player1_selected_stage: string | null
  player2_id: string
  player2_username: string
  player2_fighter: string | null
  player2_wants_change: boolean
  player2_confirmed: boolean
  player2_banned_stages: string[] | null
  stage_selection_phase: 'player1_ban' | 'player2_ban' | 'player1_select' | 'completed'
  current_game: number
  player1_wins: number
  player2_wins: number
  game1_winner: string | null
  game1_stage: string | null
  game1_player1_report: string | null
  game1_player2_report: string | null
  game2_winner: string | null
  game2_stage: string | null
  game2_banned_stages: string[] | null
  game2_player1_report: string | null
  game2_player2_report: string | null
  game3_winner: string | null
  game3_stage: string | null
  game3_banned_stages: string[] | null
  game3_player1_report: string | null
  game3_player2_report: string | null
  match_winner: string | null
  status: 'fighter_selection' | 'waiting_opponent_response' | 'stage_selection' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}

// マッチセッションを作成
export async function createMatchSession(
  roomCode: string,
  player1Id: string,
  player1Username: string,
  player1Fighter: string,
  player2Id: string | null,
  player2Username: string,
  player2Fighter: string
): Promise<{ success: boolean; session?: MatchSession; error?: string }> {
  try {
    const insertData: any = {
      room_code: roomCode,
      player1_id: player1Id,
      player1_username: player1Username,
      player1_fighter: player1Fighter,
      player2_username: player2Username,
      player2_fighter: player2Fighter,
      status: 'fighter_selection'
    }

    // player2_idがnullまたは空文字列の場合は含めない
    if (player2Id && player2Id !== '') {
      insertData.player2_id = player2Id
    }

    const { data, error } = await supabase
      .from('match_sessions')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating match session:', error)
      return { success: false, error: error.message }
    }

    return { success: true, session: data }
  } catch (error) {
    console.error('Error creating match session:', error)
    return { success: false, error: 'セッションの作成に失敗しました' }
  }
}

// マッチセッションを取得
export async function getMatchSession(
  roomCode: string
): Promise<{ success: boolean; session?: MatchSession; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('match_sessions')
      .select('*')
      .eq('room_code', roomCode)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error getting match session:', error)
      return { success: false, error: error.message }
    }

    // データが存在しない場合
    if (!data || data.length === 0) {
      return { success: false, error: 'セッションが見つかりません' }
    }

    return { success: true, session: data[0] }
  } catch (error) {
    console.error('Error getting match session:', error)
    return { success: false, error: 'セッションの取得に失敗しました' }
  }
}

// ファイター変更を更新
export async function updateFighterSelection(
  roomCode: string,
  playerId: string,
  fighter: string,
  confirmed: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // まずセッションを取得
    const { session } = await getMatchSession(roomCode)
    if (!session) {
      return { success: false, error: 'セッションが見つかりません' }
    }

    // プレイヤー1かプレイヤー2かを判定
    const isPlayer1 = session.player1_id === playerId
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (isPlayer1) {
      updateData.player1_fighter = fighter
      updateData.player1_confirmed = confirmed
    } else {
      updateData.player2_fighter = fighter
      updateData.player2_confirmed = confirmed
    }

    const { error } = await supabase
      .from('match_sessions')
      .update(updateData)
      .eq('room_code', roomCode)

    if (error) {
      console.error('Error updating fighter selection:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating fighter selection:', error)
    return { success: false, error: 'ファイター選択の更新に失敗しました' }
  }
}

// ファイター変更意思を更新
export async function setWantsToChangeFighter(
  roomCode: string,
  playerId: string,
  wantsChange: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // まずセッションを取得
    const { session } = await getMatchSession(roomCode)
    if (!session) {
      return { success: false, error: 'セッションが見つかりません' }
    }

    // プレイヤー1かプレイヤー2かを判定
    const isPlayer1 = session.player1_id === playerId
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (isPlayer1) {
      updateData.player1_wants_change = wantsChange
      // 変更したい場合は確認をリセット
      if (wantsChange) {
        updateData.player1_confirmed = false
      }
    } else {
      updateData.player2_wants_change = wantsChange
      if (wantsChange) {
        updateData.player2_confirmed = false
      }
    }

    const { error } = await supabase
      .from('match_sessions')
      .update(updateData)
      .eq('room_code', roomCode)

    if (error) {
      console.error('Error setting wants to change fighter:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error setting wants to change fighter:', error)
    return { success: false, error: 'ファイター変更意思の更新に失敗しました' }
  }
}

// 確認状態を更新
export async function confirmFighterSelection(
  roomCode: string,
  playerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // まずセッションを取得
    const { session } = await getMatchSession(roomCode)
    if (!session) {
      return { success: false, error: 'セッションが見つかりません' }
    }

    // プレイヤー1かプレイヤー2かを判定
    const isPlayer1 = session.player1_id === playerId
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (isPlayer1) {
      updateData.player1_confirmed = true
    } else {
      updateData.player2_confirmed = true
    }

    const { error } = await supabase
      .from('match_sessions')
      .update(updateData)
      .eq('room_code', roomCode)

    if (error) {
      console.error('Error confirming fighter selection:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error confirming fighter selection:', error)
    return { success: false, error: 'ファイター選択の確認に失敗しました' }
  }
}

// セッションステータスを更新
export async function updateSessionStatus(
  roomCode: string,
  status: MatchSession['status']
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('match_sessions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('room_code', roomCode)

    if (error) {
      console.error('Error updating session status:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating session status:', error)
    return { success: false, error: 'ステータスの更新に失敗しました' }
  }
}

// プレイヤー2の情報を更新
export async function updatePlayer2Info(
  roomCode: string,
  player2Id: string,
  player2Username: string,
  player2Fighter: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('match_sessions')
      .update({
        player2_id: player2Id,
        player2_username: player2Username,
        player2_fighter: player2Fighter,
        updated_at: new Date().toISOString()
      })
      .eq('room_code', roomCode)

    if (error) {
      console.error('Error updating player2 info:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating player2 info:', error)
    return { success: false, error: 'プレイヤー2情報の更新に失敗しました' }
  }
}

// 相手の確認状態をリセット（ファイター変更時に使用）
export async function resetOpponentConfirmation(
  roomCode: string,
  playerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // まずセッションを取得
    const { session } = await getMatchSession(roomCode)
    if (!session) {
      return { success: false, error: 'セッションが見つかりません' }
    }

    // プレイヤー1かプレイヤー2かを判定
    const isPlayer1 = session.player1_id === playerId
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // 相手の確認状態をリセット
    if (isPlayer1) {
      updateData.player2_confirmed = false
    } else {
      updateData.player1_confirmed = false
    }

    const { error } = await supabase
      .from('match_sessions')
      .update(updateData)
      .eq('room_code', roomCode)

    if (error) {
      console.error('Error resetting opponent confirmation:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error resetting opponent confirmation:', error)
    return { success: false, error: '相手の確認状態のリセットに失敗しました' }
  }
}

// セッションの変更をリアルタイム監視
export function subscribeToMatchSession(
  roomCode: string,
  onUpdate: (session: MatchSession) => void,
  onError?: (error: any) => void
) {
  const channel = supabase
    .channel(`match_session_${roomCode}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'match_sessions',
        filter: `room_code=eq.${roomCode}`
      },
      (payload) => {
        console.log('Match session update received:', payload)
        const session = payload.new as MatchSession
        onUpdate(session)
      }
    )
    .subscribe((status) => {
      console.log('Match session subscription status:', status)
      if (status === 'CHANNEL_ERROR' && onError) {
        onError(new Error('Subscription failed'))
      }
    })

  return channel
}

// プレイヤー1がステージを拒否
export async function banStagePlayer1(
  roomCode: string,
  stageName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🚫 Player1 banning stage:', { roomCode, stageName })
    
    const { data, error } = await supabase
      .from('match_sessions')
      .update({
        player1_banned_stage: stageName,
        stage_selection_phase: 'player2_ban',
        updated_at: new Date().toISOString()
      })
      .eq('room_code', roomCode)
      .select()

    if (error) {
      console.error('Error banning stage (player1):', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return { success: false, error: error.message }
    }

    console.log('✅ Stage banned successfully:', data)
    return { success: true }
  } catch (error) {
    console.error('Error banning stage (player1):', error)
    return { success: false, error: 'ステージ拒否に失敗しました' }
  }
}

// プレイヤー2がステージを拒否（2つ）
export async function banStagesPlayer2(
  roomCode: string,
  stageNames: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🚫 Player2 banning stages:', { roomCode, stageNames })
    
    if (stageNames.length !== 2) {
      return { success: false, error: 'ステージは2つ選択してください' }
    }

    const { data, error } = await supabase
      .from('match_sessions')
      .update({
        player2_banned_stages: stageNames,
        stage_selection_phase: 'player1_select',
        updated_at: new Date().toISOString()
      })
      .eq('room_code', roomCode)
      .select()

    if (error) {
      console.error('Error banning stages (player2):', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return { success: false, error: error.message }
    }

    console.log('✅ Stages banned successfully:', data)
    return { success: true }
  } catch (error) {
    console.error('Error banning stages (player2):', error)
    return { success: false, error: 'ステージ拒否に失敗しました' }
  }
}

// プレイヤー1がステージを選択
export async function selectStagePlayer1(
  roomCode: string,
  stageName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('✅ Player1 selecting stage:', { roomCode, stageName })
    
    const { data, error } = await supabase
      .from('match_sessions')
      .update({
        player1_selected_stage: stageName,
        stage_selection_phase: 'completed',
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('room_code', roomCode)
      .select()

    if (error) {
      console.error('Error selecting stage (player1):', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return { success: false, error: error.message }
    }

    console.log('✅ Stage selected successfully:', data)
    return { success: true }
  } catch (error) {
    console.error('Error selecting stage (player1):', error)
    return { success: false, error: 'ステージ選択に失敗しました' }
  }
}

// 試合結果を記録（1戦目）- 各プレイヤーが報告
export async function reportGame1Result(
  roomCode: string,
  playerId: string,
  reportedWinner: 'player1' | 'player2'
): Promise<{ success: boolean; error?: string; matched?: boolean }> {
  try {
    console.log('📝 Reporting game 1 result:', { roomCode, playerId, reportedWinner })
    
    // 現在のセッション情報を取得
    const { session } = await getMatchSession(roomCode)
    if (!session) {
      return { success: false, error: 'セッションが見つかりません' }
    }

    const isPlayer1 = session.player1_id === playerId
    const reportField = isPlayer1 ? 'game1_player1_report' : 'game1_player2_report'
    const otherReportField = isPlayer1 ? 'game1_player2_report' : 'game1_player1_report'
    
    const updateData: any = {
      [reportField]: reportedWinner,
      updated_at: new Date().toISOString()
    }

    // 相手の報告を確認
    const otherReport = isPlayer1 ? session.game1_player2_report : session.game1_player1_report

    // 両者の報告が一致した場合、勝者を確定
    if (otherReport === reportedWinner) {
      updateData.game1_winner = reportedWinner
      updateData.game1_stage = session.player1_selected_stage
      updateData.player1_wins = reportedWinner === 'player1' ? 1 : 0
      updateData.player2_wins = reportedWinner === 'player2' ? 1 : 0
      updateData.current_game = 2
      updateData.stage_selection_phase = 'player1_ban'
      
      console.log('✅ Both reports match! Moving to game 2')
    }

    const { data, error } = await supabase
      .from('match_sessions')
      .update(updateData)
      .eq('room_code', roomCode)
      .select()

    if (error) {
      console.error('Error reporting game 1 result:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Game 1 report recorded:', data)
    return { 
      success: true, 
      matched: otherReport === reportedWinner 
    }
  } catch (error) {
    console.error('Error reporting game 1 result:', error)
    return { success: false, error: '試合結果の報告に失敗しました' }
  }
}

// 結果報告をリセット（不一致の場合）
export async function resetGameReports(
  roomCode: string,
  gameNumber: 1 | 2 | 3
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (gameNumber === 1) {
      updateData.game1_player1_report = null
      updateData.game1_player2_report = null
    } else if (gameNumber === 2) {
      updateData.game2_player1_report = null
      updateData.game2_player2_report = null
    } else {
      updateData.game3_player1_report = null
      updateData.game3_player2_report = null
    }

    const { error } = await supabase
      .from('match_sessions')
      .update(updateData)
      .eq('room_code', roomCode)

    if (error) {
      console.error('Error resetting reports:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error resetting reports:', error)
    return { success: false, error: '報告のリセットに失敗しました' }
  }
}

// 2戦目以降：勝者が2ステージ拒否
export async function banStagesWinner(
  roomCode: string,
  stageNames: string[],
  gameNumber: 2 | 3
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🚫 Winner banning stages for game ${gameNumber}:`, { roomCode, stageNames })
    
    if (stageNames.length !== 2) {
      return { success: false, error: 'ステージは2つ選択してください' }
    }

    const updateData: any = {
      stage_selection_phase: 'player2_ban', // 敗者が選択するフェーズへ
      updated_at: new Date().toISOString()
    }

    if (gameNumber === 2) {
      updateData.game2_banned_stages = stageNames
    } else {
      updateData.game3_banned_stages = stageNames
    }

    const { data, error } = await supabase
      .from('match_sessions')
      .update(updateData)
      .eq('room_code', roomCode)
      .select()

    if (error) {
      console.error(`Error banning stages for game ${gameNumber}:`, error)
      return { success: false, error: error.message }
    }

    console.log('✅ Stages banned successfully:', data)
    return { success: true }
  } catch (error) {
    console.error(`Error banning stages for game ${gameNumber}:`, error)
    return { success: false, error: 'ステージ拒否に失敗しました' }
  }
}

// 2戦目以降：敗者がステージ選択
export async function selectStageLoser(
  roomCode: string,
  stageName: string,
  gameNumber: 2 | 3,
  winner: 'player1' | 'player2'
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`✅ Loser selecting stage for game ${gameNumber}:`, { roomCode, stageName })
    
    const updateData: any = {
      stage_selection_phase: 'completed',
      updated_at: new Date().toISOString()
    }

    if (gameNumber === 2) {
      updateData.game2_stage = stageName
    } else {
      updateData.game3_stage = stageName
    }

    const { data, error } = await supabase
      .from('match_sessions')
      .update(updateData)
      .eq('room_code', roomCode)
      .select()

    if (error) {
      console.error(`Error selecting stage for game ${gameNumber}:`, error)
      return { success: false, error: error.message }
    }

    console.log('✅ Stage selected successfully:', data)
    return { success: true }
  } catch (error) {
    console.error(`Error selecting stage for game ${gameNumber}:`, error)
    return { success: false, error: 'ステージ選択に失敗しました' }
  }
}

// 試合結果を記録（2戦目以降）
export async function recordGameResult(
  roomCode: string,
  gameNumber: 2 | 3,
  winner: 'player1' | 'player2'
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📝 Recording game ${gameNumber} result:`, { roomCode, winner })
    
    // 現在のセッション情報を取得
    const { session } = await getMatchSession(roomCode)
    if (!session) {
      return { success: false, error: 'セッションが見つかりません' }
    }

    const player1Wins = session.player1_wins + (winner === 'player1' ? 1 : 0)
    const player2Wins = session.player2_wins + (winner === 'player2' ? 1 : 0)
    
    const updateData: any = {
      player1_wins: player1Wins,
      player2_wins: player2Wins,
      updated_at: new Date().toISOString()
    }

    if (gameNumber === 2) {
      updateData.game2_winner = winner
    } else {
      updateData.game3_winner = winner
    }

    // どちらかが2勝したら試合終了
    if (player1Wins === 2 || player2Wins === 2) {
      updateData.match_winner = player1Wins === 2 ? 'player1' : 'player2'
      updateData.status = 'completed'
    } else {
      // まだ続く場合は次のゲームへ
      updateData.current_game = gameNumber + 1
      updateData.stage_selection_phase = 'player1_ban' // 勝者が拒否から開始
    }

    const { data, error } = await supabase
      .from('match_sessions')
      .update(updateData)
      .eq('room_code', roomCode)
      .select()

    if (error) {
      console.error(`Error recording game ${gameNumber} result:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Game ${gameNumber} result recorded:`, data)
    return { success: true }
  } catch (error) {
    console.error(`Error recording game ${gameNumber} result:`, error)
    return { success: false, error: '試合結果の記録に失敗しました' }
  }
}

// 試合結果を報告（2戦目以降）- 各プレイヤーが報告
export async function reportGameResult(
  roomCode: string,
  gameNumber: 2 | 3,
  playerId: string,
  reportedWinner: 'player1' | 'player2'
): Promise<{ success: boolean; error?: string; matched?: boolean }> {
  try {
    console.log(`📝 Reporting game ${gameNumber} result:`, { roomCode, playerId, reportedWinner })
    
    // 現在のセッション情報を取得
    const { session } = await getMatchSession(roomCode)
    if (!session) {
      return { success: false, error: 'セッションが見つかりません' }
    }

    const isPlayer1 = session.player1_id === playerId
    const reportField = gameNumber === 2
      ? (isPlayer1 ? 'game2_player1_report' : 'game2_player2_report')
      : (isPlayer1 ? 'game3_player1_report' : 'game3_player2_report')
    
    const updateData: any = {
      [reportField]: reportedWinner,
      updated_at: new Date().toISOString()
    }

    // 相手の報告を確認
    const otherReport = gameNumber === 2
      ? (isPlayer1 ? session.game2_player2_report : session.game2_player1_report)
      : (isPlayer1 ? session.game3_player2_report : session.game3_player1_report)

    // 両者の報告が一致した場合、勝者を確定
    if (otherReport === reportedWinner) {
      const player1Wins = session.player1_wins + (reportedWinner === 'player1' ? 1 : 0)
      const player2Wins = session.player2_wins + (reportedWinner === 'player2' ? 1 : 0)
      
      if (gameNumber === 2) {
        updateData.game2_winner = reportedWinner
      } else {
        updateData.game3_winner = reportedWinner
      }
      
      updateData.player1_wins = player1Wins
      updateData.player2_wins = player2Wins

      // どちらかが2勝したら試合終了
      if (player1Wins === 2 || player2Wins === 2) {
        updateData.match_winner = player1Wins === 2 ? 'player1' : 'player2'
        updateData.status = 'completed'
      } else {
        // まだ続く場合は次のゲームへ
        updateData.current_game = gameNumber + 1
        updateData.stage_selection_phase = 'player1_ban'
      }
      
      console.log(`✅ Both reports match! Game ${gameNumber} result confirmed`)
    }

    const { data, error } = await supabase
      .from('match_sessions')
      .update(updateData)
      .eq('room_code', roomCode)
      .select()

    if (error) {
      console.error(`Error reporting game ${gameNumber} result:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Game ${gameNumber} report recorded:`, data)
    return { 
      success: true, 
      matched: otherReport === reportedWinner 
    }
  } catch (error) {
    console.error(`Error reporting game ${gameNumber} result:`, error)
    return { success: false, error: '試合結果の報告に失敗しました' }
  }
}
