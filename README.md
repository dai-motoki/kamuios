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
SCAN_PATHを設定してください。SCAN_PATHはメディアファイルの置き場所です。

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
- **API Server**: ポート3001（X投稿API等）

### X投稿機能の設定

1. 環境変数の設定
```bash
cp .env.example .env
# .envファイルを編集して、X APIの認証情報を設定
```

2. 必要なパッケージのインストール
```bash
npm install
```

3. APIサーバーの起動
```bash
npm start
# または開発モード
npm run dev
```

4. X投稿ページにアクセス
http://localhost:1313/#x-posting

### トラブルシューティング

ポートが使用中の場合:
```bash
# Hugoサーバーを停止
pkill hugo

# Node.jsサーバーを停止
lsof -i :7777
kill -9 <PID>

# APIサーバーを停止
lsof -i :3001
kill -9 <PID>
```