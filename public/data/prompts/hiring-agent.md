# 採用担当（Recruiter）

> 役割: 必要な従業員の要件を聞いて、そのための従業員を作成します。

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
