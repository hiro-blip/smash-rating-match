'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { stages, getStageName } from '@/lib/stages'
import { getFighterName } from '@/lib/fighters'
import Link from 'next/link'

export default function StageSelectPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const opponentName = searchParams.get('opponentName') || '対戦相手'
  const opponentRating = searchParams.get('opponentRating') || '1500'
  const myFighter = searchParams.get('myFighter') || ''
  const opponentFighter = searchParams.get('opponentFighter') || ''
  
  const [selectedStage, setSelectedStage] = useState<string | null>(null)

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

  const handleConfirm = () => {
    if (selectedStage) {
      // 対戦相手のステージ拒否待ちページへ
      router.push(
        `/match/stage-ban?opponentName=${encodeURIComponent(opponentName)}&opponentRating=${opponentRating}&myFighter=${myFighter}&opponentFighter=${opponentFighter}&myStage=${selectedStage}`
      )
    }
  }

  const legalStages = stages.filter(s => s.category === 'legal')
  const counterpickStages = stages.filter(s => s.category === 'counterpick')

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
        <div className="max-w-4xl mx-auto">
          {/* タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              ステージ選択
            </h1>
            <p className="text-slate-300 text-lg">
              対戦で使用するステージを選んでください
            </p>
          </div>

          {/* 対戦情報 */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-8">
            <div className="grid md:grid-cols-2 gap-6">
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
          </div>

          {/* 法的ステージ */}
          <div className="mb-8">
            <h2 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-green-400">🏛️</span>
              スタンダードステージ
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {legalStages.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStage(stage.id)}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    selectedStage === stage.id
                      ? 'bg-primary-600 border-primary-400 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-primary-500 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="text-lg font-bold">{stage.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* カウンターピックステージ */}
          <div className="mb-8">
            <h2 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-yellow-400">⚡</span>
              カウンターピックステージ
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {counterpickStages.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStage(stage.id)}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    selectedStage === stage.id
                      ? 'bg-primary-600 border-primary-400 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-primary-500 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="text-lg font-bold">{stage.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 選択確認 */}
          {selectedStage && (
            <div className="bg-gradient-to-r from-primary-600/20 to-primary-800/20 border-2 border-primary-500/50 rounded-lg p-6 mb-6">
              <div className="text-center">
                <div className="text-primary-400 text-sm mb-2">選択中のステージ</div>
                <div className="text-white text-3xl font-bold">
                  {getStageName(selectedStage)}
                </div>
              </div>
            </div>
          )}

          {/* 決定ボタン */}
          <button
            onClick={handleConfirm}
            disabled={!selectedStage}
            className={`w-full px-8 py-6 font-bold text-xl rounded-lg transition-colors ${
              selectedStage
                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            このステージで決定
          </button>

          {/* ヘルプ */}
          <div className="mt-6 bg-slate-800/30 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="text-slate-300 text-sm">
                <p className="font-semibold mb-2">ステージ選択について</p>
                <ul className="space-y-1 text-slate-400">
                  <li>• スタンダードステージ：競技でよく使用される公平なステージ</li>
                  <li>• カウンターピックステージ：特定のファイターに有利なステージ</li>
                  <li>• 対戦相手はあなたが選んだステージを拒否できます</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
