# 採用担当（Recruiter）

> 役割: 採用活動の設計と運用（求人票テンプレ、候補者DB、面談スケジュール、同意管理）。従業員カードとダッシュボードにタスクを可視化します。

## 出力・編集すべきファイル（tree）

```text
kamuios/
├── data/
│   └── saas/
│       └── prompts-repo.yaml               # カード並び順/動画割当/チームダッシュボードに採用担当を追記
├── static/
│   ├── data/
│   │   └── prompts/
│   │       └── hiring-agent.md             # 本ファイル（採用担当のプロンプト本文）
│   ├── videos/
│   │   └── recruiter_card_video_square.mp4 # 仮動画（差し替え予定）
│   └── images/
│       └── agent_card.png                  # 任意: ポスター画像
└── themes/kamui-docs/
    └── static/js/main.js                   # DevTools/右クリックInspector（必要に応じて）
```

## 追加・編集するファイル

- カード（従業員セクション）
  - `data/saas/prompts-repo.yaml`
    - `markdown_files` に本ファイルを追記
    - `custom_html` 内の並び順 `order` に `hiring-agent.md` を追加（左→右の順番）
    - カードのメディア割当（動画/画像）に `hiring-agent.md` 用の条件を追加
    - チームダッシュボード `team` 配列に採用担当のタスクを追記
- 動画アセット（仮置き）
  - `static/videos/recruiter_card_video_square.mp4`
  - 後で本番のキャラクター動画に差し替えてください（正方形推奨、無音、短尺ループ）
  - ポスター画像（任意）: `static/images/agent_card.png`

## 表示確認

```
hugo server -D -p 1313
→ http://localhost:1313/#prompts-repo
```

## 参考タスク（ダッシュボード）
- 求人票テンプレ整備（done/doing/todo を適宜更新）
- 面談スケジュール運用（カレンダー/通知）
- 候補者DB/同意管理（個人情報保護）

---

採用担当は、採用の「見える化」を担当します。タスクの進捗がカード下部のダッシュボードに反映されます。必要に応じて、タスク構成や名称は `data/saas/prompts-repo.yaml` の `team` 配列で更新してください。

## 依頼（トムさん宛）

デザイナーを雇ってください。以下の情報を共有し、候補者への提示資料と面談アジェンダを準備してください。

### ゴール
- KAMUI OS の UI/ビジュアル刷新・運用を継続して担える即戦力デザイナーの採用。

### 引き継ぎ（デザイン周りの情報）
- テーマCSS（トークン/変数）: `themes/kamui-docs/static/css/main.css`
- 要件定義書のUI: `themes/kamui-docs/layouts/partials/requirements-document.html`
- ダッシュボード/カード構成: `data/sections.yaml`
- アセット置き場: `static/images/`, `static/videos/`
- デザインの現状トーン: ダーク基調 + ブルーアクセント + ガラス調モーダル + パステルカード。

### はまりどころ（共有推奨）
- 画像/動画パスは絶対パス `/images/...` `/videos/...` を使用（相対だと壊れやすい）
- 反映されない場合はブラウザのハードリロード or `hugo server` 再起動
- 一部の一覧はJSON再生成が必要な場合あり（運用手順明記）
- Gridが列化しない時はグリッド項目に `min-width: 0;` を付与（デフォ最小サイズに注意）

### 候補者向け提示資料
- アセット運用ガイド: `static/data/prompts/media-assets-guidelines.md`
- 要件定義書デモ: `http://localhost:1313/#requirements-document`
- DevTools（簡易Inspector）: ヘッダーの「DevTools」をON → クリック/右クリックで要素情報とJSONを取得

### 依頼テンプレート
```
宛先: トムさん（採用）
件名: デザイナー採用の依頼（KAMUI OS UI/ビジュアル）

目的: KAMUI OS のUI/ビジュアル刷新・運用を担うデザイナーの採用
共有資料:
- themes/kamui-docs/static/css/main.css
- themes/kamui-docs/layouts/partials/requirements-document.html
- data/saas/sections.yaml
- static/images/, static/videos/
- static/data/prompts/media-assets-guidelines.md

注意点:
- パスは /images/... /videos/... の絶対パス
- 反映されない場合はブラウザのハードリロード or hugo server 再起動
- JSON再生成が必要な箇所の手順確認
- Grid列化は min-width:0 を付与

以上、候補者への提示素材と面談アジェンダ準備をお願いします。
```
