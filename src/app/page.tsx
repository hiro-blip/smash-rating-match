import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* ヘッダー */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              🎮 スマブラレーティング
            </h1>
            <nav className="flex gap-4">
              <Link href="/login" className="px-4 py-2 text-white hover:text-primary-400 transition-colors">
                ログイン
              </Link>
              <Link href="/signup" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                新規登録
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-16">
        {/* ヒーローセクション */}
        <section className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            スマブラで腕試し
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            レーティングシステムで自分の実力を測ろう
          </p>
          <Link href="/signup" className="inline-block px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl">
            今すぐ始める
          </Link>
        </section>

        {/* 機能紹介 */}
        <section className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-700">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">
              レーティングシステム
            </h3>
            <p className="text-slate-300">
              Elo レーティングで正確な実力を数値化
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-700">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-white mb-2">
              スマートマッチング
            </h3>
            <p className="text-slate-300">
              同じレベルの対戦相手と自動マッチング
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-700">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-white mb-2">
              ランキング
            </h3>
            <p className="text-slate-300">
              全国のプレイヤーと競い合おう
            </p>
          </div>
        </section>

        {/* 統計情報 */}
        <section className="text-center">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/30 backdrop-blur-sm p-8 rounded-lg border border-slate-700">
              <div className="text-4xl font-bold text-primary-400 mb-2">
                0
              </div>
              <div className="text-slate-300">登録プレイヤー</div>
            </div>
            <div className="bg-slate-800/30 backdrop-blur-sm p-8 rounded-lg border border-slate-700">
              <div className="text-4xl font-bold text-primary-400 mb-2">
                0
              </div>
              <div className="text-slate-300">総対戦数</div>
            </div>
            <div className="bg-slate-800/30 backdrop-blur-sm p-8 rounded-lg border border-slate-700">
              <div className="text-4xl font-bold text-primary-400 mb-2">
                0
              </div>
              <div className="text-slate-300">オンライン中</div>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-slate-900 border-t border-slate-700 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-slate-400">
          <p>&copy; 2025 スマブラレーティングマッチング. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
