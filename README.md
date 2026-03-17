# 冷蔵庫献立アシスタント

冷蔵庫にある食材を入力すると、Claude AI が今日の献立を3品提案するフルスタック Web アプリです。

## 機能

- **タグ形式の食材入力** — Enter・カンマ・スペースで追加、バックスペースで末尾削除、×ボタンで個別削除
- **カテゴリ別プリセットボタン** — 肉・野菜・きのこ豆腐・主食を1タップで追加、4件超は折りたたみ
- **AI献立カード** — 料理名・説明・調理時間・難易度・食材・手順をカード形式で表示
- **レスポンシブデザイン** — スマートフォン〜デスクトップに対応（モバイルは手順折りたたみ）
- **レートリミット** — 1 IP につき 1分あたり 10リクエストまで（`X-RateLimit-*` ヘッダー付き）
- **セキュリティ** — API キーはサーバー側のみ、CORS 制御、セキュリティヘッダー

## ディレクトリ構成

```
fridge-to-meal/                   ← Vercel プロジェクトルート
│
├── api/                          ← Vercel Serverless Functions (Node.js ESM)
│   ├── _lib/
│   │   ├── cors.js               ← CORS ヘルパー（ALLOWED_ORIGINS 制御）
│   │   └── rateLimit.js          ← インメモリ レートリミッター
│   └── suggest.js                ← POST /api/suggest エンドポイント
│
├── src/                          ← React + Vite フロントエンド
│   ├── components/
│   │   ├── IngredientInput.jsx   ← タグ入力 + カテゴリ別プリセット
│   │   ├── IngredientInput.css
│   │   ├── MealSuggestions.jsx   ← 献立カード（手順折りたたみ）
│   │   └── MealSuggestions.css
│   ├── App.jsx                   ← ルートコンポーネント・API 呼び出し
│   ├── App.css
│   ├── index.css                 ← CSS 変数・グローバルリセット
│   └── main.jsx
│
├── public/
│   └── favicon.svg
├── index.html
├── package.json                  ← フロント・バックエンド共通依存
├── vite.config.js                ← Vite 設定 + ローカル dev プロキシ
├── vercel.json                   ← デプロイ設定・ルーティング・ヘッダー
├── .env.example
└── .gitignore
```

> **モノレポ構成について**
> フロントエンド (`src/`) とバックエンド (`api/`) を単一リポジトリで管理する Vercel 推奨のモノレポ構成です。
> `api/` 配下のファイルは自動で Serverless Function として認識されます（`_` プレフィックスのサブディレクトリは除外）。
> 依存パッケージは `package.json` で一元管理します。

## 技術スタック

| 層 | 技術 |
|---|---|
| フロントエンド | React 18 + Vite 5 |
| バックエンド | Node.js (Vercel Serverless Functions) |
| AI | Claude Opus 4.6 (Anthropic SDK) |
| デプロイ | Vercel |

---

## ローカル開発

### 前提条件

- Node.js 18 以上
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)
- Anthropic API キー（[取得はこちら](https://console.anthropic.com/settings/keys)）

### 手順

```bash
# 1. リポジトリをクローン
git clone <your-repo-url>
cd fridge-to-meal

# 2. 依存インストール
npm install

# 3. 環境変数を設定
cp .env.example .env
# .env を編集して ANTHROPIC_API_KEY を設定

# 4. 開発サーバー起動（フロント + サーバーレス関数を同時起動）
npm run dev
# → http://localhost:3000
```

`npm run dev` は内部で `vercel dev` を実行します。
フロントエンドのビルドのみ確認する場合は `npm run build` を使用してください。

---

## Vercel へのデプロイ

### 1. Vercel にログイン・プロジェクト作成

```bash
vercel login
vercel          # ウィザードに従ってプロジェクトを作成
```

### 2. 環境変数の設定（重要）

Vercel ダッシュボード → プロジェクト → **Settings → Environment Variables** で以下を設定します。

| 変数名 | 値 | 必須 |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` （Anthropic の API キー） | ✅ 必須 |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app,https://your-domain.com` | 任意 |

> **セキュリティ注意事項**
> - `ANTHROPIC_API_KEY` は **Environment: Production / Preview / Development** すべてに設定してください。
> - この値はサーバー側のみで使用され、フロントエンドには一切渡りません。
> - `ALLOWED_ORIGINS` を未設定にすると `localhost:*` と `*.vercel.app` が自動で許可されます。カスタムドメインを使う場合は必ず設定してください。

CLI からも設定できます:

```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY preview
vercel env add ANTHROPIC_API_KEY development
```

### 3. デプロイ実行

```bash
# プレビューデプロイ（動作確認用）
vercel

# 本番デプロイ
vercel --prod
```

以降は `git push` で自動デプロイされます（Vercel Git 連携済みの場合）。

---

## API リファレンス

### `POST /api/suggest`

食材リストを受け取り、献立3品を返します。

**リクエスト**

```json
{
  "ingredients": ["卵", "鶏肉", "玉ねぎ", "にんじん"]
}
```

**レスポンス (200)**

```json
{
  "meals": [
    {
      "name": "親子丼",
      "description": "卵と鶏肉の定番丼。出汁の効いた甘辛いタレが絶品。",
      "ingredients": ["鶏もも肉 200g", "卵 3個", "玉ねぎ 1/2個"],
      "steps": ["鶏肉を一口大に切る", "玉ねぎを薄切りにする", "..."],
      "time": "20分",
      "difficulty": "簡単"
    }
  ]
}
```

**レートリミットヘッダー**

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1710000060
Retry-After: 42          # 429 時のみ
```

**エラーレスポンス**

| ステータス | 原因 |
|---|---|
| 400 | 食材が空 / 不正な形式 |
| 403 | 許可されていない Origin |
| 405 | POST 以外のメソッド |
| 429 | レートリミット超過 |
| 500 | サーバーエラー / API キー未設定 |
| 503 | Claude API の過負荷 / 接続エラー |

---

## 設定

### レートリミットの変更

`api/_lib/rateLimit.js` の先頭定数を変更してください。

```js
const WINDOW_MS    = 60_000  // ウィンドウ幅（ミリ秒）
const MAX_REQUESTS = 10      // ウィンドウあたりの上限リクエスト数
```

> **スケールアップ時**: 複数の Vercel インスタンス間でカウントを共有するには、`store`（Map）を [Vercel KV](https://vercel.com/docs/storage/vercel-kv) に置き換えてください。`checkRateLimit` 関数のシグネチャは変えずに内部実装のみ変更できます。

### CORS の変更

`ALLOWED_ORIGINS` 環境変数にカンマ区切りで許可オリジンを列挙します。

```
ALLOWED_ORIGINS=https://example.com,https://staging.example.com
```

未設定時の自動信頼ルール（`api/_lib/cors.js`）:
- `localhost:*`
- `127.0.0.1:*`
- `*.vercel.app`

### 提案品数・モデルの変更

`api/suggest.js` のプロンプトと `model` 定数を変更してください。

```js
// モデル変更例（コスト削減）
model: 'claude-haiku-4-5',

// 提案品数変更（プロンプト内の "3つ" を変更）
`献立を5つ提案してください。`
```
