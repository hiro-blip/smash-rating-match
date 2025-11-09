# スマブラレーティングマッチングサイト

スマメイトのようなスマブラのゲーミングレートマッチングサイトです。

## 開発環境のセットアップ

### 依存関係のインストール
```bash
npm install
```

### 開発サーバーの起動
```bash
npm run dev
```

# スマブラレーティングマッチングサイト

大乱闘スマッシュブラザーズのオンライン対戦用レーティングマッチングサイトです。

## 機能

- 🎮 **レーティングシステム**: Eloアルゴリズムによる実力測定
- 🤝 **リアルタイムマッチング**: Supabaseを使用した即座のマッチング
- 👤 **プロフィール管理**: ユーザー名、フレンドコード、メインファイター設定
- 🥊 **ファイター選択**: 81体の全ファイターから選択可能
- 🏟️ **ステージ選択**: スタンダード/カウンターピックステージの選択と拒否機能
- 📊 **ランキング**: トップ200プレイヤーの表示
- 📝 **対戦履歴**: 過去の対戦記録とレーティング変動

## セットアップ

### 1. 必要要件

- Node.js 18.x 以上
- npm または yarn
- Supabaseアカウント

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスしてアカウント作成
2. 新しいプロジェクトを作成
3. プロジェクトのURLとAPIキーを取得

### 3. データベースのセットアップ

Supabaseダッシュボードで以下を実行：

1. 左メニューの「SQL Editor」を開く
2. `supabase-setup.sql`の内容をコピー＆ペースト
3. 「Run」をクリックしてテーブルを作成

### 4. 環境変数の設定

```bash
# .env.local.exampleをコピー
cp .env.local.example .env.local

# .env.localを編集してSupabaseの情報を入力
NEXT_PUBLIC_SUPABASE_URL=あなたのプロジェクトURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのAnonキー
```

### 5. 依存関係のインストールと起動

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:3000` (または3001)を開く

## マッチングの流れ

1. **マッチング範囲選択**: ±50〜制限なしまで選択可能
2. **マッチング開始**: 
   - 既に待機中のプレイヤーがいればマッチング成立
   - いなければ自分が部屋を建てて待機
3. **ファイター選択**: 
   - メインファイターで対戦するか変更するか選択
   - 相手の選択も確認可能
4. **ステージ選択**: 
   - スタンダード/カウンターピックから選択
   - 相手が拒否した場合は再選択
5. **対戦結果入力**: 勝敗を入力してレーティング更新

## 技術スタック

- **フロントエンド**: Next.js 14, React, TypeScript
- **スタイリング**: Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL, Realtime, Auth)
- **レーティング**: Eloアルゴリズム (K-factor: 32)

## ディレクトリ構造

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # ダッシュボード
│   ├── login/             # ログイン
│   ├── matching/          # マッチング
│   ├── match/             # 対戦関連ページ
│   ├── profile/           # プロフィール
│   └── ranking/           # ランキング
├── components/            # 再利用可能なコンポーネント
├── contexts/              # React Context (認証等)
└── lib/                   # ユーティリティ関数
    ├── fighters.ts        # ファイターデータ
    ├── stages.ts          # ステージデータ
    ├── rating.ts          # レーティング計算
    ├── matchingQueue.ts   # マッチングキュー管理
    └── supabase.ts        # Supabase クライアント
```

## データベーススキーマ

### matching_queue
マッチング待機キュー

- `id`: UUID
- `user_id`: ユーザーID
- `username`: ユーザー名
- `rating`: レーティング
- `main_fighter`: メインファイター
- `min_rating`: 最小レーティング範囲
- `max_rating`: 最大レーティング範囲
- `status`: 待機/マッチング済/キャンセル

### profiles
ユーザープロフィール

- `id`: ユーザーID
- `username`: ユーザー名
- `friend_code`: フレンドコード
- `bio`: 自己紹介
- `comments`: ひとこと
- `avatar_url`: アバター画像URL
- `main_fighter`: メインファイター

### ratings
レーティング情報

- `user_id`: ユーザーID
- `rating`: 現在のレーティング
- `wins`: 勝利数
- `losses`: 敗北数

### matches
対戦履歴

- `user_id`: ユーザーID
- `opponent_name`: 対戦相手名
- `opponent_rating`: 相手のレーティング
- `my_fighter`: 使用ファイター
- `opponent_fighter`: 相手のファイター
- `stage`: 対戦ステージ
- `result`: 勝敗
- `rating_change`: レーティング変動

## デプロイ

### Vercelへのデプロイ（推奨）

このサイトは誰でもアクセスできるように公開できます。

詳しいデプロイ手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

#### クイックスタート

1. GitHubリポジトリを作成してコードをプッシュ
2. [Vercel](https://vercel.com)でアカウント作成（GitHubで連携）
3. リポジトリをインポート
4. 環境変数を設定（`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
5. デプロイ！

数分で `https://your-project.vercel.app` のような公開URLが発行されます。

### その他のデプロイ方法

- **Netlify**: Next.jsに対応
- **Railway**: フルスタックアプリケーションに対応
- **自己ホスティング**: `npm run build` → `npm start`

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL, Realtime, Auth)
- **ホスティング**: Vercel (推奨)
- **レーティング**: Eloアルゴリズム

## 実装済み機能

- ✅ ユーザー登録・ログイン機能
- ✅ プレイヤープロフィール（ユーザー名、フレンドコード、メインファイター）
- ✅ レーティングシステム（Eloアルゴリズム）
- ✅ リアルタイムマッチング機能
- ✅ ファイター・ステージ選択
- ✅ 対戦履歴の記録
- ✅ ランキング表示（TOP 200）
- ✅ ベストオブ3方式

## 今後の機能追加予定

- [ ] フレンド機能
- [ ] チャット機能
- [ ] トーナメントモード
- [ ] 戦績統計（ファイター別勝率など）
- [ ] リプレイ共有機能
- [ ] プッシュ通知

## ライセンス

MIT
