# MCP SaaS Handwrite Reference

このプロジェクトは、Hugo静的サイトジェネレーターを使用したSaaSアプリケーションのドキュメントサイトです。

## プロジェクト構造

```
mcp-saas-handwriteref/
├── README.md                    # このファイル
├── .gitignore                   # Git除外設定
├── prompts/                     # プロンプトテンプレート
│   ├── create-new-chapter.md    # 新しい章を作成するプロンプト
│   └── create-new-page.md       # 新しいページを作成するプロンプト
├── requirement-docs/            # Hugoサイトのルートディレクトリ
│   ├── config.yaml              # Hugo設定ファイル
│   ├── data/                    # データファイル
│   │   ├── sections.yaml        # メインコンテンツ定義
│   │   └── saas/                # SaaSアプリケーション定義
│   │       ├── requirements-document.yaml      # 要件定義書
│   │       ├── ui-views.yaml                   # UIビュー一覧
│   │       ├── ai-portrait-generator.yaml      # AI Portrait Generator
│   │       ├── storyboard-video-content.yaml   # ビデオビューアー
│   │       └── storyboard-viewer.yaml          # ストーリーボードビューアー
│   ├── themes/                  # Hugoテーマ
│   │   └── kamui-docs/          # カスタムテーマ
│   │       ├── layouts/         # レイアウトテンプレート
│   │       │   ├── index.html   # メインページテンプレート
│   │       │   ├── _default/    # デフォルトレイアウト
│   │       │   └── partials/    # 部分テンプレート
│   │       └── static/          # 静的ファイル
│   │           ├── css/         # スタイルシート
│   │           │   └── main.css # メインCSS
│   │           └── js/          # JavaScript
│   │               └── main.js  # メインJS
│   ├── pencil_drawings/         # 鉛筆画像アセット
│   ├── storyboard_images/       # ストーリーボード画像
│   └── storyboard_videos/       # ストーリーボード動画
└── prompts/                     # プロンプトテンプレート
    └── create-new-page.md       # 新しいページ作成用プロンプト
```

## プロンプトテンプレートについて

`prompts/` ディレクトリには、サイトを拡張する際に使用するプロンプトテンプレートが含まれています：

### create-new-chapter.md
新しい章（カテゴリ）を追加する際のプロンプトテンプレート。複数のページを含む新しいセクションを一度に作成できます。

### create-new-page.md
既存の章に新しいページを追加する際のプロンプトテンプレート。単一のページを既存のカテゴリに追加できます。

### エージェント（参照ファイルの場所）
- 表示ページ: `http://localhost:1313/#prompts-repo`
- 参照ファイルの置き場所: `requirement-docs/static/data/prompts/`
  - 例: `requirement-docs/static/data/prompts/create-new-page.v2.md`
- 参照設定: `requirement-docs/data/saas/prompts-repo.yaml` の `markdown_file` に相対パスを指定します。
  - 例: `markdown_file: static/data/prompts/create-new-page.v2.md`
- 反映手順: ファイルを追加・更新 → `hugo server -D` 実行中ならブラウザをハードリロード（キャッシュ無効）

複数のプロンプト文書を用意し切り替えたい場合は、`static/data/prompts/` にファイルを追加し、`markdown_file` を差し替えてください。

## コンテンツ構造

サイトは以下の3つのカテゴリで構成されています：

### 1. ダッシュボード（カテゴリ1）
- **概要**: 全体の入り口となるダッシュボード
- **内容**: 要件定義・開発とメディアエディタへのカードリンク

### 2. 要件定義・開発（カテゴリ2）
- **要件定義書**: システムの要件定義書
  - プロジェクト概要
  - 機能要件・非機能要件
  - 技術スタック
  - 開発スケジュール
  - 制約事項
- **UIビュー一覧**: システムのUI画面一覧と設計仕様
  - 画面構成図
  - コンポーネント一覧
  - デザインシステム

### 3. メディアエディタ（カテゴリ3）
- **AI Portrait Generator**: 手書きスケッチからAI画像生成
- **ビデオビューアー**: ストーリーボードとビデオコンテンツ管理
- **ストーリーボードビューアー**: 絵コンテの見開き表示

## 技術仕様

### ナビゲーション
- URLハッシュベースのSPA（Single Page Application）ルーティング
- 例: `#saas-ai-portrait`, `#requirements-document`

### データ管理
- `data/sections.yaml`: メインのセクション定義
- `data/saas/`: 個別のSaaSアプリケーション定義（現在は未使用、将来の拡張用）

### スタイリング
- ダークテーマ対応
- レスポンシブデザイン
- CSS変数による一貫したテーマ管理

## 開発環境

### 必要なツール
- Hugo (静的サイトジェネレーター)
- Git (バージョン管理)

### ローカル開発
```bash
# Hugoサーバーの起動
cd requirement-docs
hugo server -D

# サイトは http://localhost:1313/ でアクセス可能
```

### ビルド
```bash
# 本番用ビルド
cd requirement-docs
hugo

# publicディレクトリに静的ファイルが生成される
```

## 主要ファイルの説明

### data/sections.yaml
サイトの全セクションを定義する中心的なファイル。各セクションには以下が含まれます：
- `id`: セクションの一意識別子
- `category`: カテゴリ番号（表示順序）
- `category_name`: サイドバーに表示されるカテゴリ名
- `title`: セクションのタイトル
- `content`: Markdown形式のコンテンツ
- `custom_html`: カスタムHTML（アプリケーションの埋め込みなど）

### themes/kamui-docs/
カスタムHugoテーマ。以下の特徴があります：
- サイドバーナビゲーション
- ダークモード対応
- SPAライクな動的コンテンツ切り替え
- レスポンシブデザイン

## サイトの拡張方法

### 新しい章を追加する場合
`prompts/create-new-chapter.md` のプロンプトテンプレートを使用してください。

### 既存の章に新しいページを追加する場合
`prompts/create-new-page.md` のプロンプトテンプレートを使用してください。

## 注意事項

- `public/`と`resources/`ディレクトリはGitで管理されません（.gitignoreで除外）
- メディアファイル（画像・動画）は適切なディレクトリに配置してください
- YAMLファイルの編集時はインデントに注意してください
- 新しいコンテンツを追加する際は、必ずプロンプトテンプレートを使用することを推奨します
