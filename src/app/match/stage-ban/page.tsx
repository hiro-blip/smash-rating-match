'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { stages, getStageName } from '@/lib/stages'
import { getFighterName } from '@/lib/fighters'
import Link from 'next/link'

export default function StageBanPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const opponentName = searchParams.get('opponentName') || '対戦相手'
  const opponentRating = searchParams.get('opponentRating') || '1500'
  const myFighter = searchParams.get('myFighter') || ''
  const opponentFighter = searchParams.get('opponentFighter') || ''
  const myStage = searchParams.get('myStage') || ''
  
  const [waiting, setWaiting] = useState(true)
  const [opponentBanned, setOpponentBanned] = useState(false)
  const [opponentBanResult, setOpponentBanResult] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 対戦相手の拒否判定をシミュレート
  useEffect(() => {
    if (user && myStage) {
      const timer = setTimeout(() => {
        // 50%の確率で拒否
        const willBan = Math.random() < 0.5
        setOpponentBanned(willBan)
        
        if (willBan) {
          setOpponentBanResult(`${opponentName}があなたの選択したステージを拒否しました！`)
        } else {
          setOpponentBanResult(`${opponentName}があなたの選択したステージを受け入れました！`)
        }
        
        setWaiting(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [user, myStage, opponentName])

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

  const handleProceed = () => {
    if (opponentBanned) {
      // 拒否された場合、ステージを再選択
      router.push(
        `/match/stage-select?opponentName=${encodeURIComponent(opponentName)}&opponentRating=${opponentRating}&myFighter=${myFighter}&opponentFighter=${opponentFighter}`
      )
    } else {
      // 受け入れられた場合、対戦結果入力へ
      router.push(
        `/match/result?opponentName=${encodeURIComponent(opponentName)}&opponentRating=${opponentRating}&myFighter=${myFighter}&opponentFighter=${opponentFighter}&stage=${myStage}`
      )
    }
  }

  const handleReselect = () => {
    // ステージ再選択
    router.push(
      `/match/stage-select?opponentName=${encodeURIComponent(opponentName)}&opponentRating=${opponentRating}&myFighter=${myFighter}&opponentFighter=${opponentFighter}`
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
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              ステージ拒否待ち
            </h1>
          </div>

          {/* 対戦情報 */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <div className="text-primary-400 text-sm mb-2">あなた</div>
                <div className="text-white text-xl font-bold">
                  {myFighter ? getFighterName(myFighter) : 'ファイター'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-red-400 text-sm mb-2">対戦相手</div>
                <div className="text-white text-xl font-bold">
                  {opponentFighter ? getFighterName(opponentFighter) : 'ファイター'}
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-700 pt-6">
              <div className="text-center">
                <div className="text-slate-400 text-sm mb-2">選択したステージ</div>
                <div className="text-white text-2xl font-bold">
                  {getStageName(myStage)}
                </div>
              </div>
            </div>
          </div>

          {/* 待機中アニメーション */}
          {waiting && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 mb-6">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500 mb-4"></div>
                <p className="text-white text-xl font-bold mb-2">
                  対戦相手の判断を待っています...
                </p>
                <p className="text-slate-400">
                  {opponentName}がステージを受け入れるか拒否するか判断中です
                </p>
              </div>
            </div>
          )}

          {/* 結果表示 */}
          {!waiting && (
            <>
              <div className={`backdrop-blur-sm border-2 rounded-lg p-8 mb-6 ${
                opponentBanned 
                  ? 'bg-red-600/20 border-red-500/50' 
                  : 'bg-green-600/20 border-green-500/50'
              }`}>
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {opponentBanned ? '❌' : '✅'}
                  </div>
                  <p className="text-white text-2xl font-bold mb-2">
                    {opponentBanResult}
                  </p>
                  {opponentBanned && (
                    <p className="text-red-300">
                      別のステージを選択してください
                    </p>
                  )}
                  {!opponentBanned && (
                    <p className="text-green-300">
                      このステージで対戦が行われます
                    </p>
                  )}
                </div>
              </div>

              {/* ボタン */}
              <div className="space-y-4">
                {opponentBanned ? (
                  <button
                    onClick={handleReselect}
                    className="w-full px-8 py-6 bg-primary-600 text-white font-bold text-xl rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    別のステージを選ぶ
                  </button>
                ) : (
                  <button
                    onClick={handleProceed}
                    className="w-full px-8 py-6 bg-primary-600 text-white font-bold text-xl rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    対戦開始
                  </button>
                )}
              </div>
            </>
          )}

          {/* ヘルプ */}
          <div className="mt-8 bg-slate-800/30 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="text-slate-300 text-sm">
                <p className="font-semibold mb-2">ステージ拒否について</p>
                <p className="text-slate-400">
                  対戦相手はあなたが選んだステージを拒否することができます。拒否された場合は別のステージを選択してください。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
