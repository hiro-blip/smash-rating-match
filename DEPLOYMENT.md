# デプロイ手順

このドキュメントでは、スマブラレーティングマッチングサイトをVercelにデプロイする方法を説明します。

## 前提条件

- GitHubアカウント
- Vercelアカウント（GitHubアカウントで作成可能）
- Supabaseプロジェクト（既に作成済み）

## ステップ1: GitHubリポジトリの作成

1. [GitHub](https://github.com)にログイン
2. 「New repository」をクリック
3. リポジトリ名を入力（例: `smash-rating-match`）
4. Public または Private を選択
5. 「Create repository」をクリック

## ステップ2: コードをGitHubにプッシュ

ターミナルでプロジェクトのディレクトリに移動し、以下を実行：

```bash
# Gitリポジトリを初期化（まだの場合）
git init

# .gitignoreの確認
# .env.localが含まれていることを確認（機密情報を公開しないため）

# 全てのファイルをステージング
git add .

# コミット
git commit -m "Initial commit"

# GitHubリポジトリをリモートとして追加
git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git

# プッシュ
git branch -M main
git push -u origin main
```

## ステップ3: Vercelアカウントの作成

1. [Vercel](https://vercel.com)にアクセス
2. 「Sign Up」をクリック
3. 「Continue with GitHub」を選択してGitHubアカウントで登録

## ステップ4: プロジェクトをVercelにインポート

1. Vercelダッシュボードで「Add New...」→「Project」をクリック
2. GitHubリポジトリの一覧から作成したリポジトリを選択
3. 「Import」をクリック

## ステップ5: 環境変数の設定

「Environment Variables」セクションで以下を追加：

### 必須の環境変数

| 変数名 | 値 | 取得方法 |
|--------|-----|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | あなたのSupabaseプロジェクトURL | Supabaseダッシュボード → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | あなたのSupabase Anon Key | Supabaseダッシュボード → Settings → API → Project API keys → anon public |

### 環境変数の追加手順

1. 「Environment Variables」の入力欄に変数名を入力
2. 値を入力
3. 環境を選択（Production, Preview, Development すべてチェック推奨）
4. 「Add」をクリック
5. 両方の環境変数を追加

## ステップ6: デプロイ

1. 「Deploy」ボタンをクリック
2. ビルドとデプロイが自動的に開始されます（2-5分程度）
3. デプロイが完了すると、URLが表示されます

例: `https://your-project-name.vercel.app`

## ステップ7: デプロイ後の確認

1. 表示されたURLにアクセス
2. サイトが正常に表示されることを確認
3. ログイン機能が動作することを確認
4. マッチング機能が動作することを確認

## Supabaseの設定確認

デプロイ後、Supabaseの設定を確認：

### 1. 認証設定の確認

Supabaseダッシュボード → Authentication → URL Configuration で以下を追加：

- **Site URL**: `https://your-project-name.vercel.app`
- **Redirect URLs**: 
  - `https://your-project-name.vercel.app/**`

### 2. RLSポリシーの確認

すべてのテーブルでRow Level Security (RLS)が有効になっていることを確認。

## 自動デプロイの設定

Vercelは自動的に以下の設定になります：

- **mainブランチにプッシュ** → 本番環境に自動デプロイ
- **Pull Request作成** → プレビュー環境に自動デプロイ

## カスタムドメインの設定（オプション）

独自ドメインを使用したい場合：

1. Vercelダッシュボードでプロジェクトを選択
2. 「Settings」→「Domains」をクリック
3. ドメイン名を入力
4. DNSレコードの設定指示に従う

## トラブルシューティング

### ビルドエラーが発生する場合

1. ローカルで `npm run build` を実行してエラーを確認
2. TypeScriptエラーを修正
3. 修正後、再度GitHubにプッシュ

### 環境変数が反映されない場合

1. Vercelダッシュボードで環境変数を確認
2. 変数名のスペルミスがないか確認
3. 環境変数を更新した場合は「Redeploy」をクリック

### データベース接続エラーが発生する場合

1. Supabaseの環境変数が正しいか確認
2. SupabaseダッシュボードでAPIキーが有効か確認
3. ネットワークエラーでないか確認

### 認証エラーが発生する場合

1. SupabaseのSite URLとRedirect URLsが正しいか確認
2. Vercelのデプロイ済みURLと一致しているか確認

## 更新のデプロイ

コードを更新した場合：

```bash
# 変更をコミット
git add .
git commit -m "Update: 変更内容の説明"

# GitHubにプッシュ
git push

# Vercelが自動的に検知して再デプロイします
```

## パフォーマンス最適化

デプロイ後、以下を確認してパフォーマンスを最適化：

1. **画像の最適化**: Next.jsのImage コンポーネントを使用
2. **キャッシュ設定**: Vercelは自動的に最適なキャッシュ設定を行います
3. **リージョン設定**: `vercel.json`で日本リージョン（hnd1）を指定済み

## セキュリティ

- `.env.local`はGitHubにプッシュしない（.gitignoreに含まれています）
- Supabase APIキーはSupabaseダッシュボードで管理
- 本番環境では必ずRLSポリシーを有効にする

## モニタリング

Vercelダッシュボードで以下を確認できます：

- デプロイ履歴
- アクセス数
- エラーログ
- パフォーマンス指標

## コスト

- Vercelの無料プラン（Hobby）で十分な機能が使えます
- Supabaseも無料プランで開始できます
- トラフィックが増えた場合は有料プランへのアップグレードを検討

## サポート

問題が発生した場合：

- [Vercelドキュメント](https://vercel.com/docs)
- [Supabaseドキュメント](https://supabase.com/docs)
- [Next.jsドキュメント](https://nextjs.org/docs)

## まとめ

これで、あなたのスマブラレーティングマッチングサイトが世界中からアクセス可能になりました！

デプロイが完了したら、URLを共有して友達と対戦を楽しんでください！
