'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { fighters, getSortedFighters, getFighterName } from '@/lib/fighters'
import { updateFighterSelection, confirmFighterSelection } from '@/lib/matchSession'
import Link from 'next/link'

export default function MyFighterSelectPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const roomCode = searchParams.get('roomCode') || ''
  const isPlayer2 = searchParams.get('isPlayer2') === 'true'
  
  const [profile, setProfile] = useState<{ mainFighter: string } | null>(null)
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
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

  const handleConfirm = async () => {
    if (selectedFighter && user) {
      // ファイター変更を保存
      const { success } = await updateFighterSelection(
        roomCode,
        user.id,
        selectedFighter,
        true  // 確認済みとしてマーク
      )
      
      if (success) {
        // wants_changeをfalseにリセット（変更完了）
        const { setWantsToChangeFighter } = await import('@/lib/matchSession')
        await setWantsToChangeFighter(roomCode, user.id, false)
        
        // opponent-changeページに遷移して相手の確認を待つ
        router.push(
          `/match/opponent-change?roomCode=${roomCode}&isPlayer2=${isPlayer2}`
        )
      }
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
              あなたのファイター選択
            </h1>
            <p className="text-slate-300 text-lg">
              使用するファイターを選んでください
            </p>
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
                  <div className="font-bold text-sm text-white">
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

          {/* 選択確認 */}
          {selectedFighter && (
            <div className="bg-gradient-to-r from-primary-600/20 to-primary-800/20 border-2 border-primary-500/50 rounded-lg p-6 mb-6">
              <div className="text-center">
                <div className="text-primary-400 text-sm mb-2">選択中のファイター</div>
                <div className="text-white text-3xl font-bold">
                  {getFighterName(selectedFighter)}
                </div>
              </div>
            </div>
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
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              このファイターで決定
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
