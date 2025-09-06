# KamuiOS

## Setup

### 基本セットアップ

```bash
git clone https://github.com/dai-motoki/kamuios.git
cd kamuios
hugo server -D -p 1313
```

アクセス: http://localhost:1313/

### Dynamic Media Gallery の起動

メディアギャラリー機能を使用する場合は、追加でNode.jsサーバーを起動します：

```bash
# 初回のみ: 環境設定（プロジェクトルートで実行）
cp .env.sample .env
# .envを編集してSCAN_PATHを設定（例: /Users/yourname/kamuios/static/images）

# 別のターミナルで実行
cd backend
node server.js
```

Media Gallery: http://localhost:1313/#dynamic-media-gallery

### サーバー構成

- **Hugo Server**: ポート1313（メインサイト）
- **Media Gallery Server**: ポート7777（メディアファイル配信）

### トラブルシューティング

ポートが使用中の場合:
```bash
# Hugoサーバーを停止
pkill hugo

# Node.jsサーバーを停止
lsof -i :7777
kill -9 <PID>
```