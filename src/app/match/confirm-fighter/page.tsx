'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { fighters, getFighterName, getSortedFighters } from '@/lib/fighters'
import Link from 'next/link'

export default function ConfirmFighterPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const opponentName = searchParams.get('opponentName') || '対戦相手'
  const opponentRating = searchParams.get('opponentRating') || '1500'
  const opponentFighter = searchParams.get('opponentFighter') || ''
  const opponentMainFighter = searchParams.get('opponentMainFighter') || ''
  
  const [profile, setProfile] = useState<{ mainFighter: string } | null>(null)
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      // プロフィールからメインファイターを読み込む
      const savedProfile = localStorage.getItem(`profile_${user.id}`)
      if (savedProfile) {
        const data = JSON.parse(savedProfile)
        setProfile({ mainFighter: data.mainFighter || '' })
        setSelectedFighter(data.mainFighter || null)
      }
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

  const sortedFighters = getSortedFighters()
  const filteredFighters = sortedFighters.filter(fighter => 
    fighter.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConfirm = () => {
    if (selectedFighter) {
      router.push(
        `/match/result?opponentName=${encodeURIComponent(opponentName)}&opponentRating=${opponentRating}&fighter=${selectedFighter}&opponentFighter=${opponentFighter}`
      )
    }
  }

  const handleUseMain = () => {
    if (profile?.mainFighter) {
      setSelectedFighter(profile.mainFighter)
      setIsChanging(false)
    }
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
        <div className="max-w-4xl mx-auto">
          {/* タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              ファイター確認
            </h1>
            <p className="text-slate-300 text-lg">
              対戦相手のファイターを確認して、あなたのファイターを選択してください
            </p>
          </div>

          {/* 対戦相手のファイター情報 */}
          <div className="bg-gradient-to-r from-red-600/20 to-red-800/20 border-2 border-red-500/50 rounded-lg p-6 mb-8">
            <div className="text-center">
              <div className="text-red-400 text-sm mb-2">対戦相手のファイター</div>
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <div className="text-white text-2xl font-bold">{opponentName}</div>
                  <div className="text-slate-400 text-sm">Rating: {opponentRating}</div>
                </div>
              </div>
              <div className="space-y-2">
                {opponentFighter ? (
                  <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 inline-block">
                    <div className="text-red-300 text-sm mb-1">選択したファイター</div>
                    <div className="text-white text-3xl font-bold">
                      {getFighterName(opponentFighter)}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">
                    ファイター未選択
                  </div>
                )}
                {opponentMainFighter && (
                  <div className="text-slate-400 text-sm">
                    メインファイター: {getFighterName(opponentMainFighter)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 自分のファイター選択 */}
          {!isChanging ? (
            <div className="bg-gradient-to-r from-primary-600/20 to-primary-800/20 border-2 border-primary-500/50 rounded-lg p-8 mb-6">
              <div className="text-center mb-6">
                <div className="text-primary-400 text-sm mb-2">あなたの使用ファイター</div>
                {selectedFighter ? (
                  <div className="mb-4">
                    <div className="text-white text-4xl font-bold mb-2">
                      {getFighterName(selectedFighter)}
                    </div>
                    <div className="text-slate-400 text-sm">
                      {selectedFighter === profile?.mainFighter ? 'メインファイター' : 'カスタム選択'}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 mb-4">
                    ファイターを選択してください
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {profile?.mainFighter && (
                  <button
                    onClick={handleUseMain}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    メインを使用: {getFighterName(profile.mainFighter)}
                  </button>
                )}
                <button
                  onClick={() => setIsChanging(true)}
                  className="flex-1 px-6 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors"
                >
                  ファイターを変更
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 検索バー */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="ファイター名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              {/* ファイター一覧 */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold">ファイター選択</h3>
                  <button
                    onClick={() => setIsChanging(false)}
                    className="text-slate-400 hover:text-slate-300 text-sm"
                  >
                    キャンセル
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto">
                  {filteredFighters.map((fighter) => (
                    <button
                      key={fighter.id}
                      onClick={() => {
                        setSelectedFighter(fighter.id)
                        setIsChanging(false)
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedFighter === fighter.id
                          ? 'bg-primary-600 border-primary-400 text-white'
                          : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-primary-500 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="text-xs text-slate-400 mb-1">No.{fighter.number}</div>
                      <div className={`font-bold text-sm ${
                        selectedFighter === fighter.id ? 'text-white' : 'text-white'
                      }`}>
                        {fighter.name}
                      </div>
                    </button>
                  ))}
                </div>
                
                {filteredFighters.length === 0 && (
                  <div className="text-center text-slate-400 py-8">
                    該当するファイターが見つかりません
                  </div>
                )}
              </div>
            </>
          )}

          {/* 決定ボタン */}
          <div className="flex gap-4">
            <Link
              href="/matching"
              className="flex-1 px-6 py-4 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors text-center"
            >
              キャンセル
            </Link>
            <button
              onClick={handleConfirm}
              disabled={!selectedFighter}
              className={`flex-1 px-6 py-4 font-semibold rounded-lg transition-colors ${
                selectedFighter
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              このファイターで対戦開始
            </button>
          </div>

          {/* ヘルプテキスト */}
          <div className="mt-6 bg-slate-800/30 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="text-slate-300 text-sm">
                <p className="font-semibold mb-2">ファイター選択のヒント</p>
                <ul className="space-y-1 text-slate-400">
                  <li>• 対戦相手のファイターを見て、有利なファイターを選びましょう</li>
                  <li>• メインファイターボタンで素早く選択できます</li>
                  <li>• いつでもファイターを変更できます</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
