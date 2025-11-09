'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { fighters, getSortedFighters, getFighterName } from '@/lib/fighters'
import Link from 'next/link'

export default function SelectFighterPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const opponentName = searchParams.get('opponentName') || '対戦相手'
  const opponentRating = searchParams.get('opponentRating') || '1500'
  const opponentMainFighter = searchParams.get('opponentMainFighter') || ''

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
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

  const handleSelectFighter = () => {
    if (selectedFighter) {
      // 自分のファイター選択を確認ページに遷移
      router.push(
        `/match/confirm-fighter?opponentName=${encodeURIComponent(opponentName)}&opponentRating=${opponentRating}&opponentFighter=${selectedFighter}&opponentMainFighter=${opponentMainFighter || ''}`
      )
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
              対戦相手のファイター選択
            </h1>
            <p className="text-slate-300 text-lg">
              対戦相手が使用するファイターを選んでください
            </p>
          </div>

          {/* 対戦相手情報 */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-slate-400 text-sm mb-2">対戦相手</div>
              <div className="text-white text-2xl font-bold mb-1">{opponentName}</div>
              {opponentMainFighter && (
                <div className="text-primary-400 text-sm mb-1">
                  メインファイター: {getFighterName(opponentMainFighter)}
                </div>
              )}
              <div className="text-primary-400 text-lg">Rating: {opponentRating}</div>
            </div>
          </div>

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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto">
              {filteredFighters.map((fighter) => (
                <button
                  key={fighter.id}
                  onClick={() => setSelectedFighter(fighter.id)}
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

          {/* 選択確認と決定ボタン */}
          {selectedFighter && (
            <div className="bg-gradient-to-r from-red-600/20 to-red-800/20 border-2 border-red-500/50 rounded-lg p-6 mb-6">
              <div className="text-center mb-4">
                <div className="text-red-400 text-sm mb-2">対戦相手が選択したファイター</div>
                <div className="text-white text-3xl font-bold">
                  {fighters.find(f => f.id === selectedFighter)?.name}
                </div>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-4">
            <Link
              href="/matching"
              className="flex-1 px-6 py-4 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors text-center"
            >
              キャンセル
            </Link>
            <button
              onClick={handleSelectFighter}
              disabled={!selectedFighter}
              className={`flex-1 px-6 py-4 font-semibold rounded-lg transition-colors ${
                selectedFighter
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              次へ（対戦相手として設定）
            </button>
          </div>

          {/* ヘルプテキスト */}
          <div className="mt-6 text-center text-slate-400 text-sm">
            <p>💡 対戦相手が使用するファイターを選択してください</p>
            <p className="mt-1">次のページであなたのファイターを選択します</p>
          </div>
        </div>
      </main>
    </div>
  )
}
