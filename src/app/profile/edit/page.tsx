'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { fighters, getFighterName } from '@/lib/fighters'
import Link from 'next/link'

export default function ProfileEditPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // フォームの状態
  const [username, setUsername] = useState('')
  const [friendCode, setFriendCode] = useState('')
  const [bio, setBio] = useState('')
  const [preMatchComment, setPreMatchComment] = useState('')
  const [postMatchComment, setPostMatchComment] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [mainFighter, setMainFighter] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      // ローカルストレージからユーザー情報を読み込む
      const savedProfile = localStorage.getItem(`profile_${user.id}`)
      if (savedProfile) {
        const profile = JSON.parse(savedProfile)
        setUsername(profile.username || user.user_metadata?.username || '')
        setFriendCode(profile.friendCode || '')
        setBio(profile.bio || '')
        setPreMatchComment(profile.preMatchComment || '')
        setPostMatchComment(profile.postMatchComment || '')
        setProfileImage(profile.profileImage || '👤')
        setMainFighter(profile.mainFighter || '')
      } else {
        // 初期値を設定
        setUsername(user.user_metadata?.username || '')
        setFriendCode('')
        setBio('')
        setPreMatchComment('よろしくお願いします！')
        setPostMatchComment('ありがとうございました！')
        setProfileImage('👤')
        setMainFighter('')
      }
    }
  }, [user, loading, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)

    // プロフィールデータを作成
    const profileData = {
      username,
      friendCode,
      bio,
      preMatchComment,
      postMatchComment,
      profileImage,
      mainFighter,
      updatedAt: new Date().toISOString(),
    }

    // ローカルストレージに保存
    if (user) {
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData))
    }

    // 保存処理の遅延（UIフィードバック用）
    await new Promise((resolve) => setTimeout(resolve, 500))

    setSaving(false)
    setSuccess(true)
    
    setTimeout(() => {
      setSuccess(false)
    }, 3000)
  }

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

  const avatarOptions = ['👤', '😀', '😎', '🎮', '⭐', '🔥', '⚡', '🎯', '🏆', '👑', '🦊', '🐱', '🐶', '🐼', '🦁', '🐯']

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* ヘッダー */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-white hover:text-primary-400 transition-colors">
              🎮 スマブラレーティング
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-slate-300">
                {user.user_metadata?.username || user.email}
              </span>
              <Link href="/dashboard" className="text-slate-400 hover:text-slate-300">
                ← ダッシュボード
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              プロフィール編集
            </h1>
            <p className="text-slate-400">
              あなたの情報を編集してください
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400">
              ✓ プロフィールを保存しました
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* プロフィール画像選択 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <label className="block text-white text-lg font-semibold mb-4">
                プロフィール画像
              </label>
              <div className="flex items-center gap-6 mb-4">
                <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center text-5xl">
                  {profileImage}
                </div>
                <div className="flex-1">
                  <p className="text-slate-300 text-sm mb-2">
                    アイコンを選択してください
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {avatarOptions.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setProfileImage(avatar)}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all ${
                      profileImage === avatar
                        ? 'bg-primary-600 scale-110'
                        : 'bg-slate-900/50 hover:bg-slate-700'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* ユーザー名 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <label htmlFor="username" className="block text-white text-lg font-semibold mb-2">
                ユーザー名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="ユーザー名を入力"
              />
              <p className="text-slate-400 text-sm mt-2">
                {username.length}/20文字
              </p>
            </div>

            {/* フレンドコード */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <label htmlFor="friendCode" className="block text-white text-lg font-semibold mb-2">
                フレンドコード
              </label>
              <input
                id="friendCode"
                type="text"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value)}
                placeholder="SW-0000-0000-0000"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-slate-400 text-sm mt-2">
                Nintendo SwitchのフレンドコードをSW-XXXX-XXXX-XXXX形式で入力
              </p>
            </div>

            {/* プロフィール */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <label htmlFor="bio" className="block text-white text-lg font-semibold mb-2">
                プロフィール
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={4}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="自己紹介を入力してください"
              />
              <p className="text-slate-400 text-sm mt-2">
                {bio.length}/200文字
              </p>
            </div>

            {/* メインファイター */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <label className="block text-white text-lg font-semibold mb-3">
                メインファイター
              </label>
              <select
                value={mainFighter}
                onChange={(e) => setMainFighter(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                {fighters.map((fighter) => (
                  <option key={fighter.id} value={fighter.id}>
                    No.{fighter.number} - {fighter.name}
                  </option>
                ))}
              </select>
              <p className="text-slate-400 text-sm mt-2">
                {mainFighter ? `選択中: ${getFighterName(mainFighter)}` : 'メインで使用するファイターを選択してください'}
              </p>
            </div>

            {/* 対戦前のコメント */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <label htmlFor="preMatchComment" className="block text-white text-lg font-semibold mb-2">
                対戦前のコメント
              </label>
              <input
                id="preMatchComment"
                type="text"
                value={preMatchComment}
                onChange={(e) => setPreMatchComment(e.target.value)}
                maxLength={50}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="対戦前に表示されるメッセージ"
              />
              <p className="text-slate-400 text-sm mt-2">
                {preMatchComment.length}/50文字 - マッチング成功時に対戦相手に表示されます
              </p>
            </div>

            {/* 対戦後のコメント */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <label htmlFor="postMatchComment" className="block text-white text-lg font-semibold mb-2">
                対戦後のコメント
              </label>
              <input
                id="postMatchComment"
                type="text"
                value={postMatchComment}
                onChange={(e) => setPostMatchComment(e.target.value)}
                maxLength={50}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="対戦後に表示されるメッセージ"
              />
              <p className="text-slate-400 text-sm mt-2">
                {postMatchComment.length}/50文字 - 対戦終了時に対戦相手に表示されます
              </p>
            </div>

            {/* 保存ボタン */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-4 bg-primary-600 text-white text-lg font-bold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '変更を保存'}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-4 bg-slate-700 text-white text-lg font-semibold rounded-lg hover:bg-slate-600 transition-colors text-center"
              >
                キャンセル
              </Link>
            </div>
          </form>

          {/* プレビュー */}
          <div className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <h3 className="text-white text-lg font-semibold mb-4">プレビュー</h3>
            <div className="bg-slate-900/50 rounded-lg p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-3xl">
                  {profileImage}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold text-xl">{username || 'ユーザー名'}</h4>
                  <p className="text-slate-400 text-sm">{friendCode}</p>
                  <p className="text-primary-400 text-sm mt-1">Rating: 1500</p>
                </div>
              </div>
              {bio && (
                <div className="mb-4">
                  <p className="text-slate-300 text-sm">{bio}</p>
                </div>
              )}
              {preMatchComment && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 mb-2">
                  <p className="text-blue-300 text-sm">
                    💬 対戦前: {preMatchComment}
                  </p>
                </div>
              )}
              {postMatchComment && (
                <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                  <p className="text-green-300 text-sm">
                    💬 対戦後: {postMatchComment}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
