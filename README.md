# KamuiOS

空間コンピューティング時代のWebOS。AR/VR環境で動作する3D空間インターフェースを提供し、ファイルシステムやアプリケーションを物理空間に配置して操作できます。AIツールとの統合により、次世代の作業環境を実現します。

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

### トラブルシューティング

ポートが使用中の場合:
```bash
# Hugoサーバーを停止
pkill hugo

# Node.jsサーバーを停止
lsof -i :7777
kill -9 <PID>
```

## Directory Graph 3D AR/VR

ディレクトリ構造を3D空間で可視化し、AR/VR体験ができる機能です。

### セットアップ

1. **バックエンドサーバーの起動**（プロジェクトルートで実行）
```bash
npm install  # 初回のみ
npm start    # または node server.js
```

2. **ngrokのセットアップ**（AR/VR体験に必須）

WebXR（AR/VR）はHTTPS接続が必要なため、ngrokを使用してローカルサーバーを公開します。

```bash
# ngrokのインストール（Homebrewを使用）
brew install ngrok

# または、公式サイトからダウンロード
# https://ngrok.com/download

# ngrokアカウントの作成とトークン設定（初回のみ）
# 1. https://ngrok.com/ でアカウント作成
# 2. ダッシュボードからAuthトークンを取得
# 3. トークンを設定
ngrok authtoken YOUR_AUTH_TOKEN

# Hugoサーバー（ポート1313）をHTTPSで公開
ngrok http 1313

# 表示されるForwarding URLをメモ
# 例: https://abc123.ngrok.app
```

3. **アクセス方法**
- Web版: http://localhost:1313/dir-graph-ar.html
- ngrok経由（AR/VR用）: https://YOUR_NGROK_URL.ngrok.app/dir-graph-ar.html?backend=/backend
  - 例: https://abc123.ngrok.app/dir-graph-ar.html?backend=/backend

### 機能説明

#### 表示方式
- **3次元放射状レイアウト**: ルートを中心に、各階層が球面状に広がる
- **画像の自動表示**: 画像ファイルは実際のサムネイルとして表示
- **色分け**: ファイルタイプごとに異なる色で表示
  - 赤: ルートディレクトリ
  - 緑: フォルダ
  - オレンジ: 画像ファイル
  - 紫: 動画ファイル
  - その他: ファイルタイプごとに色分け

#### 操作方法

**Web表示**
- マウスドラッグ: 視点の回転
- マウスホイール: ズーム
- ダブルクリック: 視点のリセット

**ボタン機能**
- **リンク表示**: ノード間の接続線の表示/非表示（デフォルト: OFF）
- **START AR**: ARモードで起動（スマートフォン/ARグラス用）
- **START VR**: VRモードで起動（VRヘッドセット用）

#### AR/VR体験

**AR（拡張現実）**
- スマートフォンやARグラスで現実空間にディレクトリ構造を重ねて表示
- カメラ権限が必要
- HTTPS接続が必須（ngrok推奨）

**VR（仮想現実）**
- Meta Quest等のVRヘッドセットで没入型3D空間として体験
- ディレクトリ構造の中を自由に移動可能
- **動作確認済み**: Meta Quest 3

### 技術仕様

- **レンダリング**: Three.js
- **WebXR**: AR/VR体験
- **データソース**: backend/server.jsのディレクトリスキャンAPI
- **対応ファイル形式**:
  - 画像: jpg, jpeg, png, gif, webp, svg
  - 動画: mp4, mov, avi, mkv, webm
  - 音声: mp3, wav, ogg, flac, m4a
  - コード: js, ts, py, rb, go, etc.
  - ドキュメント: pdf, doc, ppt, xls, etc.

### Meta Quest 3での使用方法

1. **Quest 3のブラウザでアクセス**
   - Quest 3を装着してMeta Quest Browserを起動
   - ngrok URLにアクセス（例: https://abc123.ngrok.app/dir-graph-ar.html?backend=/backend）

2. **VRモードに入る**
   - ページが読み込まれたら「START VR」ボタンをクリック
   - 権限の許可を求められたら「許可」を選択

3. **VR内での操作**
   - コントローラーのトリガーでポインティング
   - グリップボタンでつかんで移動
   - スティックで視点の移動

### トラブルシューティング

**ngrok関連**
- `ERR_NGROK_108`: 無料プランの制限に達した場合は、しばらく待つかアカウントをアップグレード
- 接続が遅い場合: 地理的に近いリージョンを選択 `ngrok http 1313 --region=jp`

**Quest 3関連**
- VRボタンが表示されない: ブラウザがWebXR対応か確認（Meta Quest Browserを使用）
- 「START VR」クリック後に何も起こらない: ページをリロードして再試行
- パフォーマンスが悪い: ファイル数が多すぎる場合は、スキャン対象ディレクトリを限定

## アーキテクチャ

### サーバー構成

KamuiOSは2つのサーバーで構成されています：

#### 1. **メインサーバー** (`/server.js`)
- **ポート**: 3001
- **役割**: プロキシサーバー + 静的ファイル配信
- **機能**:
  - `public/`ディレクトリの静的ファイル配信
  - WebXR/AR対応（Permissions-Policy設定）
  - `/backend`へのリクエストをバックエンドサーバーにプロキシ
  - ngrok経由での単一エンドポイント提供

#### 2. **バックエンドサーバー** (`/backend/server.js`)
- **ポート**: 7777
- **役割**: メディアスキャナー + APIサーバー
- **機能**:
  - ディレクトリスキャン（`/api/scan`）
  - メディアファイル一覧取得（`/api/media`）
  - 個別ファイル配信
  - ファイルの追加・削除
  - SCAN_PATH監視

```
[ブラウザ] → [server.js:3001] → [backend/server.js:7777]
                ↓
          静的ファイル配信
          WebXR対応
          プロキシ機能
```

**注意**: 通常は`npm start`でメインサーバーのみ起動すれば、プロキシ経由でバックエンドAPIも利用可能です。