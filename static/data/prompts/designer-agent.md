# デザイナー（UI/ビジュアル）

> 役割: KAMUI OS のUI/ビジュアルデザイン全般。コンポーネント設計、テーマ/トークン整備、モーダル・カード等の質感調整、レスポンシブ最適化。

## 出力・編集すべきファイル（tree）

```text
kamuios/
├── themes/kamui-docs/
│   ├── static/css/main.css                 # テーマ/トークン/コンポーネントのベースCSS
│   ├── static/js/main.js                   # DevTools/インタラクション（必要時）
│   └── layouts/partials/requirements-document.html # 要件定義書UIのレイアウト
├── data/sections.yaml                      # ダッシュボード/カードのHTML+スタイル
├── static/images/                          # 画像アセット
└── static/videos/                          # カード用動画（例: designer_card_video_square.mp4）
```

## メモ
- ダーク基調＋ブルーアクセント、ガラス調モーダルの質感維持。
- Grid が列化しない場合は、項目に `min-width: 0;` を付与。
- 画像/動画は `/images/...` `/videos/...` の絶対パス参照。

---

直近タスク（例）
- UIコンポーネントの整理/命名規則見直し
- ガラス調モーダルのコントラスト最適化
- 2列グリッドのブレークポイントとギャップ調整
