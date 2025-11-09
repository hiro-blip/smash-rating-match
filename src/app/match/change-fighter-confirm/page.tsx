'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getFighterName } from '@/lib/fighters'
import { 
  createMatchSession, 
  getMatchSession, 
  confirmFighterSelection,
  subscribeToMatchSession,
  updateSessionStatus,
  updatePlayer2Info,
  type MatchSession 
} from '@/lib/matchSession'
import Link from 'next/link'

export default function ChangeFighterConfirmPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const opponentName = searchParams.get('opponentName') || '対戦相手'
  const opponentRating = searchParams.get('opponentRating') || '1500'
  const opponentMainFighter = searchParams.get('opponentMainFighter') || ''
  const isPlayer2 = searchParams.get('isPlayer2') === 'true'
  const roomCode = searchParams.get('roomCode') || '12345'
  
  const [profile, setProfile] = useState<{ 
    username: string
    mainFighter: string 
  } | null>(null)
  const [myRating, setMyRating] = useState(1500)
  const [matchSession, setMatchSession] = useState<MatchSession | null>(null)
  const [opponentConfirmed, setOpponentConfirmed] = useState(false)
  const [myConfirmed, setMyConfirmed] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      const loadProfile = async () => {
        // localStorageから取得を試みる
        const savedProfile = localStorage.getItem(`profile_${user.id}`)
        if (savedProfile) {
          const data = JSON.parse(savedProfile)
          console.log('Profile loaded from localStorage:', data)
          setProfile({ 
            username: data.username || 'あなた',
            mainFighter: data.mainFighter || '' 
          })
        } else {
          // localStorageにない場合、Supabaseから取得
          console.log('Profile not in localStorage, fetching from Supabase')
          const { supabase } = await import('@/lib/supabase')
          const { data, error } = await supabase
            .from('profiles')
            .select('username, main_fighter')
            .eq('user_id', user.id)
            .single()
          
          if (data && !error) {
            console.log('Profile loaded from Supabase:', data)
            const profileData = {
              username: data.username || 'あなた',
              mainFighter: data.main_fighter || ''
            }
            setProfile(profileData)
            // localStorageに保存
            localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData))
          } else {
            console.error('Failed to load profile:', error)
            // デフォルト値を設定
            setProfile({
              username: 'あなた',
              mainFighter: ''
            })
          }
        }
        
        // レーティング情報を取得
        const ratingData = localStorage.getItem(`rating_${user.id}`)
        if (ratingData) {
          const rating = JSON.parse(ratingData)
          setMyRating(rating.rating || 1500)
        }
      }
      
      loadProfile()
    }
  }, [user, loading, router])

  // マッチセッションの初期化
  useEffect(() => {
    if (!user || !profile) return

    const initSession = async () => {
      // 既存のセッションを確認
      const { success, session } = await getMatchSession(roomCode)
      
      if (success && session) {
        setMatchSession(session)
        // 自分の確認状態を更新
        if (isPlayer2) {
          setMyConfirmed(session.player2_confirmed)
          setOpponentConfirmed(session.player1_confirmed)
          // プレイヤー2の場合、自分の情報を更新
          if (!session.player2_id || session.player2_id === '') {
            await updatePlayer2Info(
              roomCode,
              user.id,
              profile.username,
              profile.mainFighter
            )
          }
        } else {
          setMyConfirmed(session.player1_confirmed)
          setOpponentConfirmed(session.player2_confirmed)
        }
      } else {
        // セッションが存在しない場合は作成（プレイヤー1のみ）
        if (!isPlayer2) {
          const result = await createMatchSession(
            roomCode,
            user.id,
            profile.username,
            profile.mainFighter,
            null, // player2_idは後で更新
            opponentName,
            opponentMainFighter
          )
          
          if (result.success && result.session) {
            setMatchSession(result.session)
          } else {
            console.error('Failed to create initial session:', result.error)
          }
        }
      }
    }

    initSession()
  }, [user, profile, roomCode, isPlayer2, opponentName, opponentMainFighter])

  // リアルタイム監視
  useEffect(() => {
    if (!user || !roomCode) return

    const channel = subscribeToMatchSession(
      roomCode,
      (session) => {
        setMatchSession(session)
        
        // 確認状態を更新
        if (isPlayer2) {
          setMyConfirmed(session.player2_confirmed)
          setOpponentConfirmed(session.player1_confirmed)
        } else {
          setMyConfirmed(session.player1_confirmed)
          setOpponentConfirmed(session.player2_confirmed)
        }

        // 両者が確認済みの場合、opponent-changeページに自動遷移
        const bothConfirmed = session.player1_confirmed && session.player2_confirmed
        if (bothConfirmed) {
          setTimeout(() => {
            router.push(`/match/opponent-change?roomCode=${roomCode}&isPlayer2=${isPlayer2}`)
          }, 1000)
        }
      },
      (error) => {
        console.error('Session subscription error:', error)
      }
    )

    return () => {
      channel.unsubscribe()
    }
  }, [user, roomCode, isPlayer2, router])

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

  const handleNoChange = async () => {
    console.log('=== handleNoChange START ===')
    console.log('user:', user)
    console.log('profile:', profile)
    console.log('isPlayer2:', isPlayer2)
    console.log('matchSession:', matchSession)
    
    if (!user || !profile) {
      console.error('Missing user or profile!', { user, profile })
      alert('プロフィール情報の読み込み中です。少し待ってから再度お試しください。')
      return
    }
    
    console.log('handleNoChange called', { user: user.id, profile, isPlayer2, matchSession })
    
    // セッションを取得または作成
    let currentSession = matchSession
    if (!currentSession) {
      // セッションがない場合、取得を試みる
      const { success, session } = await getMatchSession(roomCode)
      if (success && session) {
        currentSession = session
        setMatchSession(session)
      } else if (!isPlayer2) {
        // プレイヤー1の場合のみ作成
        const result = await createMatchSession(
          roomCode,
          user.id,
          profile.username,
          profile.mainFighter,
          null, // プレイヤー2のIDは後で更新される
          opponentName,
          opponentMainFighter
        )
        
        if (!result.success) {
          console.error('Failed to create session:', result.error)
          alert(`セッション作成エラー: ${result.error}`)
          return
        }
        currentSession = result.session || null
      } else {
        // プレイヤー2でセッションがない場合はエラー
        console.error('Player2 but no session found')
        alert('セッションが見つかりません。プレイヤー1が先に操作してください。')
        return
      }
    }
    
    // プレイヤー2の場合、自分の情報を更新
    if (isPlayer2 && currentSession) {
      console.log('Updating player2 info:', { user: user.id, username: profile.username, fighter: profile.mainFighter })
      await updatePlayer2Info(roomCode, user.id, profile.username, profile.mainFighter)
    }
    
    // wants_changeをfalseに設定（変更しない意思表示）
    const { setWantsToChangeFighter } = await import('@/lib/matchSession')
    await setWantsToChangeFighter(roomCode, user.id, false)
    
    // ファイター変更なし → 確認状態を更新
    await confirmFighterSelection(roomCode, user.id)
    setMyConfirmed(true)
    
    // opponent-changeページに遷移して相手を待つ
    router.push(`/match/opponent-change?roomCode=${roomCode}&isPlayer2=${isPlayer2}`)
  }

  const handleChange = async () => {
    console.log('=== handleChange START ===')
    console.log('user:', user)
    console.log('profile:', profile)
    console.log('isPlayer2:', isPlayer2)
    console.log('matchSession:', matchSession)
    
    if (!user || !profile) {
      console.error('Missing user or profile!', { user, profile })
      alert('プロフィール情報の読み込み中です。少し待ってから再度お試しください。')
      return
    }
    
    console.log('handleChange called', { user: user.id, profile, isPlayer2, matchSession })
    
    // セッションを取得または作成
    let currentSession = matchSession
    if (!currentSession) {
      // セッションがない場合、取得を試みる
      const { success, session } = await getMatchSession(roomCode)
      if (success && session) {
        currentSession = session
        setMatchSession(session)
      } else if (!isPlayer2) {
        // プレイヤー1の場合のみ作成
        const result = await createMatchSession(
          roomCode,
          user.id,
          profile.username,
          profile.mainFighter,
          null, // プレイヤー2のIDは後で更新される
          opponentName,
          opponentMainFighter
        )
        
        if (!result.success) {
          console.error('Failed to create session:', result.error)
          alert(`セッション作成エラー: ${result.error}`)
          return
        }
        currentSession = result.session || null
      } else {
        // プレイヤー2でセッションがない場合はエラー
        console.error('Player2 but no session found')
        alert('セッションが見つかりません。プレイヤー1が先に操作してください。')
        return
      }
    }
    
    // プレイヤー2の場合、自分の情報を更新
    if (isPlayer2 && currentSession) {
      console.log('Updating player2 info:', { user: user.id, username: profile.username, fighter: profile.mainFighter })
      await updatePlayer2Info(roomCode, user.id, profile.username, profile.mainFighter)
    }
    
    // ファイター変更する意思を記録
    const { setWantsToChangeFighter } = await import('@/lib/matchSession')
    await setWantsToChangeFighter(roomCode, user.id, true)
    
    // 自分のファイター選択ページへ
    router.push(
      `/match/my-fighter-select?roomCode=${roomCode}&isPlayer2=${isPlayer2}`
    )
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
            <Link href="/matching" className="text-slate-400 hover:text-slate-300">
              ← マッチングに戻る
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              マッチング成功
            </h1>
            <p className="text-slate-300 text-lg">
              使用するファイターを変更しますか？
            </p>
          </div>

          {/* 部屋番号表示 */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-6">
            <label className="block text-white text-lg font-semibold mb-3 text-center">
              部屋番号
            </label>
            <div className="text-center text-slate-300 text-2xl font-mono">
              {roomCode}
            </div>
            <p className="text-slate-400 text-sm mt-2 text-center">
              💡 この番号を使ってスマブラの部屋に入ります
            </p>
          </div>

          {/* 確認状態表示 */}
          {(myConfirmed || opponentConfirmed) && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-slate-400 text-sm mb-2">
                    {isPlayer2 ? 'プレイヤー1' : 'あなた'}
                  </div>
                  <div className={`text-lg font-bold ${
                    (isPlayer2 ? opponentConfirmed : myConfirmed) 
                      ? 'text-green-400' 
                      : 'text-slate-500'
                  }`}>
                    {(isPlayer2 ? opponentConfirmed : myConfirmed) ? '✓ 確認済み' : '待機中...'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-slate-400 text-sm mb-2">
                    {isPlayer2 ? 'あなた' : 'プレイヤー2'}
                  </div>
                  <div className={`text-lg font-bold ${
                    (isPlayer2 ? myConfirmed : opponentConfirmed) 
                      ? 'text-green-400' 
                      : 'text-slate-500'
                  }`}>
                    {(isPlayer2 ? myConfirmed : opponentConfirmed) ? '✓ 確認済み' : '待機中...'}
                  </div>
                </div>
              </div>
              
              {myConfirmed && opponentConfirmed && (
                <div className="mt-4 text-center">
                  <div className="text-green-400 text-lg font-bold mb-2">
                    ✓ 両者確認完了！
                  </div>
                  <div className="text-slate-300 text-sm">
                    ステージ選択に移動します...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* プレイヤー情報 */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* 左側: プレイヤー2の場合は相手、プレイヤー1の場合は自分 */}
            <div>
              <div className="bg-primary-600 text-white text-center py-3 rounded-t-lg font-bold text-xl">
                プレイヤー1
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 border-t-0 rounded-b-lg p-8">
                <div className="space-y-6">
                  <div className="text-center pb-6 border-b border-slate-700">
                    <div className="text-slate-400 text-sm mb-1">プレイヤー</div>
                    <div className="text-white text-2xl font-bold">
                      {isPlayer2 ? opponentName : (profile?.username || 'あなた')}
                    </div>
                  </div>

                  <div className="pb-6 border-b border-slate-700">
                    <div className="text-slate-400 text-sm mb-1">レート</div>
                    <div className="text-white text-3xl font-bold">
                      {isPlayer2 ? opponentRating : myRating}
                    </div>
                  </div>

                  {(isPlayer2 ? opponentMainFighter : profile?.mainFighter) && (
                    <div>
                      <div className="text-slate-400 text-sm mb-2">使用キャラ</div>
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">🎮</div>
                        <div className="text-white text-xl font-semibold">
                          {getFighterName(isPlayer2 ? opponentMainFighter : profile?.mainFighter || '')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 右側: プレイヤー2の場合は自分、プレイヤー1の場合は相手 */}
            <div>
              <div className="bg-red-600 text-white text-center py-3 rounded-t-lg font-bold text-xl">
                プレイヤー2
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 border-t-0 rounded-b-lg p-8">
                <div className="space-y-6">
                  <div className="text-center pb-6 border-b border-slate-700">
                    <div className="text-slate-400 text-sm mb-1">プレイヤー</div>
                    <div className="text-white text-2xl font-bold">
                      {isPlayer2 ? (profile?.username || 'あなた') : opponentName}
                    </div>
                  </div>

                  <div className="pb-6 border-b border-slate-700">
                    <div className="text-slate-400 text-sm mb-1">レート</div>
                    <div className="text-white text-3xl font-bold">
                      {isPlayer2 ? myRating : opponentRating}
                    </div>
                  </div>

                  {(isPlayer2 ? profile?.mainFighter : opponentMainFighter) && (
                    <div>
                      <div className="text-slate-400 text-sm mb-2">使用キャラ</div>
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">🎮</div>
                        <div className="text-white text-xl font-semibold">
                          {getFighterName(isPlayer2 ? (profile?.mainFighter || '') : opponentMainFighter)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 選択ボタン */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={(e) => {
                console.log('Change button clicked!', e)
                handleChange()
              }}
              disabled={myConfirmed}
              className={`px-8 py-6 text-white font-bold text-xl rounded-lg transition-colors border-2 ${
                myConfirmed
                  ? 'bg-slate-700 border-slate-600 cursor-not-allowed opacity-50'
                  : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500 active:bg-slate-500'
              }`}
            >
              ファイター変更する
            </button>
            <button
              onClick={(e) => {
                console.log('No change button clicked!', e)
                handleNoChange()
              }}
              disabled={myConfirmed}
              className={`px-8 py-6 text-white font-bold text-xl rounded-lg transition-colors shadow-lg ${
                myConfirmed
                  ? 'bg-green-700 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 hover:shadow-xl active:bg-primary-800'
              }`}
            >
              {myConfirmed ? '✓ 確認済み' : 'ファイター変更しない'}
            </button>
          </div>

          {/* ヘルプ */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="text-slate-300 text-sm">
                <p className="font-semibold mb-2">ファイター変更について</p>
                <ul className="space-y-1 text-slate-400">
                  <li>• 「変更しない」を選ぶと、メインファイターで対戦します</li>
                  <li>• 「変更する」を選ぶと、別のファイターを選択できます</li>
                  <li>• 対戦相手もファイター変更を選択できます</li>
                </ul>
              </div>
            </div>
          </div>

          {/* デバッグ情報 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 text-xs">
              <div className="text-yellow-400 font-bold mb-2">デバッグ情報:</div>
              <div className="text-yellow-200 space-y-1">
                <div>User ID: {user?.id || 'なし'}</div>
                <div>Username: {profile?.username || 'なし'}</div>
                <div>Main Fighter: {profile?.mainFighter || 'なし'}</div>
                <div>Is Player2: {isPlayer2 ? 'はい' : 'いいえ'}</div>
                <div>Match Session: {matchSession ? 'あり' : 'なし'}</div>
                <div>My Confirmed: {myConfirmed ? 'はい' : 'いいえ'}</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
