# 画像/動画アセットの置き場所と参照ルール

このドキュメントは、ドキュメント内で利用する画像・動画・補助データの配置場所と参照方法をまとめたものです。

## 配置場所（基本）

```text
└── static/
    ├── images/                 # 画像（PNG/JPG/GIF/SVG/WebP）
    ├── videos/                 # 動画（MP4/WEBM など）※必要に応じて作成
    └── data/                   # JSON/CSV/追加のMarkdownなど
```

- ブラウザからの参照パスは `/images/...`, `/videos/...`, `/data/...` になります。
- 例: `![UI](/images/creative-tools-ui-1.png)`, `<video src="/videos/demo.mp4" controls>`

## ファイル命名とサブフォルダ
- 名前は用途が分かる英語スネーク/ケバブ推奨（例: `ui_dashboard_v1.png`, `storyboard_page-01.png`）。
- 分類のためにサブフォルダを使ってもOK（例: `images/ui/`, `images/storyboard/`）。

## UIビューのギャラリー連携
- `ui-views` ページでは `/data/images_list.json` を読み込み、画像ギャラリーに反映します。
- リストは `requirement-docs/static/data/images_list.json` から配信されます。
- ローカルで簡単に更新したい場合は、`requirement-docs/server.js` を起動して `/api/images` を叩くと `images/` フォルダの一覧から JSON を再生成します。

```bash
# 別シェルで起動
node requirement-docs/server.js
# JSONを再生成（images配下をスキャン）
curl http://localhost:3001/api/images
```

## Markdown からの参照例

```markdown
![UIプレビュー](/images/whiteboard_saas_ui_1_full.png)

<video src="/videos/feature-intro.mp4" controls muted playsinline width="960"></video>

[JSONサンプル](/data/kamui-doc-menus.json)
```

## よくあるハマりどころ
- 画像が表示されない → 先頭スラッシュ付きの絶対パス `/images/...` を使う。
- 変更が反映されない → ブラウザをハードリロード（キャッシュ無効） or `hugo server` を再起動。
- 画像一覧が古い → `/api/images` を叩いて `images_list.json` を更新。

## 推奨運用
- 大きな動画はGitに入れず、必要なら外部ストレージか軽量版（低ビットレート）を配置。
- 参照が増えるアセットはサブフォルダで整理し、命名にバージョンを含める（`v1`, `v2`）。
