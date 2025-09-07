# 要件定義執筆担当（KAMUI OS / KAMUI CODE）

> 役割: 本リポジトリの要件定義書（KAMUI CODE / KAMUI OS）を編集・追加・導線調整する担当。ディレクトリ構成と表示ロジックを理解し、最短手順で改修を行う。

## ディレクトリ構成（要点）

```text
data/
  sections.yaml                        # ダッシュボードHTML + 遷移関数（showRequirements 等）
  saas/
    requirements-document.yaml         # 2-1 要件定義書（KAMUI CODE）
    requirements-kamui-os.yaml         # KAMUI OS 要件定義書

themes/kamui-docs/
  layouts/
    index.html                         # セクション合成と「カード→本文」切替
    partials/requirements-document.html# 要件定義書の共通テンプレート
  static/
    js/main.js                         # 目次生成（2-1配下に 2-1-1/2-1-2 を追加）
    css/main.css                       # 共通スタイル

static/
  images/                              # カード画像等（requirements_doc_card.png ほか）
  data/prompts/                        # 本ページのプロンプトMarkdown置き場
```

## 主要ルール
- 要件書データは `data/saas/*.yaml` に1要素の配列で定義（`id`, `title`, `tabs`, `functional_requirements` 等）。
- 描画は `partials/requirements-document.html`（同一テンプレで複数ドキュメント対応）。
- `index.html` は該当セクションを「カード→本文」の二段表示にする（DOM id: `requirementsDocCard-<sectionId>`, `requirementsDocBody-<sectionId>`）。
- TOCは `main.js` が生成し、2-1の子としてサブ項目を追加。クリックで本文を自動展開。
- 新しい「要件定義書（requirements-...）」は原則「2-1. 要件定義書」の配下サブ項目として登録し、トップレベルには出さない（重複防止）。
- 2-1 セクションの初期ビューは「カード一覧」を必ず表示する。新規要件書を追加した場合は、2-1 のカード一覧にもリンクカードを追加する（計4件以上になってもOK）。

## よく使う改修
- KAMUI OS 要件書を編集: `data/saas/requirements-kamui-os.yaml`
- KAMUI CODE 要件書を編集: `data/saas/requirements-document.yaml`
- 2-1 内のカード表示を調整: `themes/kamui-docs/layouts/index.html`（requirements-document ブロック）
- TOCの並び/子項目: `themes/kamui-docs/static/js/main.js`（buildToc の特別処理）

## 手順テンプレート（新しい要件書を追加）
1) `data/saas/requirements-<slug>.yaml` を作成（既存YAMLをコピーし `id`, `title`, `tabs` を調整）
2) 画像は `static/images/` に配置し、YAMLの `image:` にパスを設定
3) 2-1 のカード一覧にリンクカードを追加（`themes/kamui-docs/layouts/index.html` の requirements-document ブロック）
4) 必要に応じて TOC の子項目に追加（`main.js` のサブ項目配列に `<slug>` を追記）
5) `hugo server -D` で `#requirements-<slug>` を確認

## 受け入れ基準
- 2-1 の下に新規要件書のタイトルが `2-1-N` として表示され、クリックで本文が直接開く
- 直リンク `#requirements-<slug>` で「カード→本文」構造が機能し、本文に到達できる
- ダッシュボードのカード導線（必要な場合）が正しく遷移（`showRequirements('<slug>')`）

## トラブルシュート
- YAML文法エラー → バッククォートやコロンを含む場合は値をダブルクォートで囲む
- 目次の重複 → `main.js` の並べ替え時に重複除外済み。新規子追加時はIDの重複に注意
- 直リンクで本文が開かない → `requirementsDocCard-<sectionId>` と `requirementsDocBody-<sectionId>` のID整合を確認

## 依頼テンプレート（本件の要望）
- 1) KAMUI OS の npm パッケージ化に関する要件定義書を作成してください。
  - `id: requirements-kamui-os-npm`、カテゴリは「要件定義・開発」
  - 目的/対象/機能要件（CLI, テンプレ同期, 型定義, プラグイン）/非機能/構成表/Mermaid/利用例コードを含むこと
- 2) SNS マーケティングのためのダッシュボード要件定義書を作成してください。
  - `id: requirements-sns-marketing`、カテゴリは「SNS・マーケティング」
  - 既存の運用方針を、KPIダッシュボード/投稿カレンダー/レポート出力に落とし込むこと
  - チャネル（X, IG, YT, TikTok, LinkedIn）と取り込み方式（API/CSV/手動）を明記
