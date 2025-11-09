# Supabaseセットアップガイド

このガイドでは、Supabaseプロジェクトを作成し、認証機能を有効にする手順を説明します。

## 1. Supabaseアカウントの作成

1. [Supabase](https://supabase.com) にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ（または新規作成）

## 2. 新しいプロジェクトの作成

1. ダッシュボードで「New Project」をクリック
2. 以下の情報を入力：
   - **Name**: `smash-rating-match`（任意の名前）
   - **Database Password**: 強力なパスワードを設定（メモしておく）
   - **Region**: `Northeast Asia (Tokyo)` を選択（日本の場合）
3. 「Create new project」をクリック
4. プロジェクトの作成を待つ（1-2分）

## 3. APIキーの取得

1. 左サイドバーの「Settings」（歯車アイコン）をクリック
2. 「API」セクションを選択
3. 以下の情報をコピー：
   - **Project URL** (`https://xxxxx.supabase.co`の形式)
   - **anon public** キー（`eyJ...`で始まる長い文字列）

## 4. 環境変数の設定

プロジェクトの `.env.local` ファイルを開き、以下のように更新：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=あなたのProject URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのanon publicキー
```

例：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 5. 認証設定

1. Supabaseダッシュボードの左サイドバーで「Authentication」をクリック
2. 「Providers」タブを選択
3. 「Email」が有効になっていることを確認
4. 「Settings」タブで以下を設定：
   - **Enable email confirmations**: オフにする（開発時のみ。本番環境ではオンにする）
   - **Site URL**: `http://localhost:3000`

## 6. データベーステーブルの作成（オプション）

後でユーザープロフィール情報を保存するためのテーブルを作成します：

1. 左サイドバーの「Table Editor」をクリック
2. 「Create a new table」をクリック
3. テーブル名: `profiles`
4. 以下のカラムを追加：
   - `id` (uuid, primary key) - User ID
   - `username` (text) - ユーザー名
   - `rating` (int4, default: 1500) - レーティング
   - `wins` (int4, default: 0) - 勝利数
   - `losses` (int4, default: 0) - 敗北数
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

## 7. 開発サーバーの再起動

環境変数を更新した後、開発サーバーを再起動してください：

```bash
# 現在のサーバーを停止（Ctrl + C）
# 再起動
npm run dev
```

## 8. 動作確認

1. http://localhost:3000 にアクセス
2. 「新規登録」をクリック
3. ユーザー名、メールアドレス、パスワードを入力
4. 登録が成功すれば、Supabaseの設定は完了です！

## トラブルシューティング

### 「Invalid API key」エラー
- `.env.local`ファイルの値が正しいか確認
- 開発サーバーを再起動

### メール確認が必要と言われる
- Supabase Dashboard > Authentication > Settings
- 「Enable email confirmations」をオフにする

### データベース接続エラー
- プロジェクトURLが正しいか確認
- Supabaseプロジェクトが「Active」状態か確認

## 次のステップ

Supabaseの設定が完了したら、以下の機能を追加できます：

1. **プロフィール情報の保存**: データベースにユーザー情報を保存
2. **レーティングシステム**: Eloアルゴリズムの実装
3. **リアルタイムマッチング**: Supabase Realtimeを使用
4. **ランキング機能**: データベースクエリでランキング表示
