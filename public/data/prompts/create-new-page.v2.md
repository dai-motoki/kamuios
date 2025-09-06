# 新規ページ追加（外部YAML基準）

> 目的: `data/saas/*.yaml` でページを定義し、テンプレート側が自動集約。`sections.yaml` に本文を重複定義しない。

## 入力テンプレート

```text
[page-id]: my-new-page
[category]: 2
[category_name]: 要件定義・開発
[title]: 新規ページのタイトル
[content]: （任意。空でも可）
[custom_html]: （任意。必要時のみ）
[needs_dashboard_card]: true|false（ダッシュボードにカードを出すか）
[assets]: （任意。配置予定の静的ファイル一覧）
```

## 出力・編集すべきファイル（tree）

```text
mcp-saas-handwriteref/
└── requirement-docs/
    ├── data/
    │   ├── saas/
    │   │   └── <page-id>.yaml              # 必須: ページ本体定義
    │   └── sections.yaml                   # 任意: ダッシュボードのカードを足す場合
    ├── static/
    │   ├── data/
    │   │   └── pages/
    │   │       └── <page-id>.md            # 任意: Markdown本文を外出ししたい場合
    │   └── images/ ...                     # 任意: 画像などのアセット
    ├── themes/kamui-docs/
    │   └── layouts/index.html              # 既に対応済み（markdown_fileの読込）。通常は変更不要
    └── content/pages/                      # 個別ページ化する場合のみ（現状は未使用: 擬似遷移）
```

### 1) ページ定義 `data/saas/<page-id>.yaml`（必須）

配列1要素で定義します（既存ページと同じ形式）。

```yaml
- id: my-new-page
  category: 2                # 章番号（例: 2=要件定義・開発, 3=メディアエディタ, 6=事業構築など）
  category_name: 要件定義・開発
  title: 新規ページのタイトル
  content: ""                # そのままMarkdownとして描画可（必要に応じて）
  # どちらかを使う: content か custom_html か markdown_file
  # markdown_file を使う場合は static 配下の .md を参照
  # 例) markdown_file: static/data/pages/my-new-page.md
  # markdown_file: static/data/pages/my-new-page.md
  # custom_html: |
  #   <div class="my-new-page">ここにHTMLを書く</div>
```

### 2) ダッシュボードカードを追加（任意）

ダッシュボードにカードを出したい場合のみ `data/sections.yaml` のダッシュボードHTMLブロックにリンクを追加します。

```html
<!-- 例: ダッシュボードのカード群の中に追加 -->
<a href="#my-new-page" class="saas-app-card" onclick="showSectionById('my-new-page'); return false;">
  <div class="saas-app-title">
    新規ページのタイトル
    <span class="saas-app-arrow">→</span>
  </div>
  <div class="saas-app-description">ページの要約</div>
</a>
```

### 3) 外部Markdown本文（任意）

本文を別Markdownにしたい場合は、`static/data/pages/<page-id>.md` を作成し、YAMLに `markdown_file` を指定します。

```text
requirement-docs/static/data/pages/
└── my-new-page.md
```

```yaml
- id: my-new-page
  category: 2
  category_name: 要件定義・開発
  title: 新規ページのタイトル
  markdown_file: static/data/pages/my-new-page.md
```

### 4) 静的アセット（任意）

画像・動画などは `requirement-docs/static/` 配下に置き、本文から `/images/...` のように参照します。

```markdown
![UIサンプル](/images/creative-tools-ui-1.png)
```

## ビルド/確認（Hugo）

```bash
cd requirement-docs
hugo server -D -p 1313   # ローカル確認
# → http://localhost:1313/#<page-id>

hugo --gc                # 本番ビルド
```

## 備考

- `themes/kamui-docs/layouts/index.html` は `.Site.Data.sections` と `data/saas/*.yaml` を自動統合済み。通常は変更不要。
- `data/saas` 下の `<page-id>.yaml` は `.Site.Data.saas["<page-id>"]` で参照されます。

## チェックリスト（必要箇所の更新）

- [ ] `data/saas/<page-id>.yaml` を作成し、`id/category/category_name/title` を設定
- [ ] 本文は `content` または `markdown_file`（`static/data/pages/<page-id>.md`）で供給
- [ ] ダッシュボードにカードを出すなら `data/sections.yaml` のカード群へ `<a href="#<page-id>">` を追加
- [ ] 画像等のアセットがあれば `static/images/` 等に配置し、本文から相対パスで参照
- [ ] `hugo server -D` でローカル確認、`#<page-id>` のハッシュ直リンクで表示を検証
