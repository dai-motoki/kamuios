# X投稿SaaS実装計画

## ブランチ名
`feature/ken/x-posting-saas`

## 実装概要
- YAMLファイルで定義されたX投稿用SaaSページの作成
- 複数アカウント対応のX投稿機能

## 実装タスク

### 1. フロントエンド
- **YAMLファイル作成**: `/data/saas/x-posting.yaml`
  - ページ定義とUI構成
- **投稿フォームUI**
  - アカウント選択ドロップダウン（環境変数のキーセットを選択）
  - テキスト入力エリア
  - 動画アップロード機能
  - 投稿ボタン

### 2. バックエンド
- **APIエンドポイント**: `/api/x-post`
  - POSTリクエスト処理
  - 選択されたアカウントに応じたAPI認証
- **X API連携**
  - 選択されたアカウント番号に応じた環境変数取得
  - メディアアップロード対応
  - エラーハンドリング

### 3. セキュリティ
- 環境変数での認証情報管理
- APIレート制限対応

## 必要な環境変数
- アカウント1
  - `X_ACCESS_TOKEN_1`
  - `X_ACCESS_TOKEN_SECRET_1`
- アカウント2
  - `X_ACCESS_TOKEN_2`
  - `X_ACCESS_TOKEN_SECRET_2`
- アカウント3（必要に応じて追加）
  - `X_ACCESS_TOKEN_3`
  - `X_ACCESS_TOKEN_SECRET_3`