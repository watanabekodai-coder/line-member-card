# LINE会員証機能 スターターキット

自社LINE公式アカウントに会員証機能（ポイント／会員名／会員番号／バーコード）を追加するための最小構成です。

## 構成

```
line-member-card/
├── db/
│   └── schema.sql       ← Supabaseで実行するテーブル定義
├── server/
│   ├── index.js          ← バックエンドAPI(Node.js/Express)
│   ├── package.json
│   └── .env.example
└── liff/
    └── index.html         ← LINEのLIFF上で開く会員証ページ
```

## セットアップ手順

### 1. Supabaseプロジェクトを作成
1. https://supabase.com でプロジェクトを新規作成
2. SQL Editorで `db/schema.sql` の内容を実行
3. Project Settings → API から `URL` と `service_role key` を控える（service_role keyは絶対にフロントに書かない）

### 2. バックエンドAPIを起動
```bash
cd server
cp .env.example .env   # SUPABASE_URLなどを記入
npm install
npm start
```
ローカル確認後、Render / Railway / Vercel(Functions) などにデプロイしてURLを発行してください。

### 3. LINE Developersの設定
1. https://developers.line.biz でチャネルを開き、LIFFアプリを追加
2. Endpoint URLに `liff/index.html` をホスティングしたURLを設定
3. 発行された **LIFF ID** を控える

### 4. フロント側の設定を反映
`liff/index.html` 内の以下を書き換えてください。
```js
const LIFF_ID = "YOUR_LIFF_ID";
const API_BASE_URL = "https://your-api-domain.example.com";
```

### 5. リッチメニューに会員証ボタンを追加
LINE Official Account Managerでリッチメニューを作成し、「会員証」ボタンのリンク先を
`https://liff.line.me/{LIFF_ID}` に設定します。

## 今後の拡張の進め方

このスターターは「会員テーブル」「ポイント履歴テーブル」を最初から分けてあるので、
以下のような機能は既存構成を壊さずに追加できます。

| 追加したい機能 | 追加箇所の目安 |
|---|---|
| ポイント自動付与(購入連携) | `POST /points/add` を外部システムから呼び出す |
| クーポン配布 | `coupons` テーブル＋関連APIを追加 |
| 会員ランク制度 | `members.rank` を条件分岐に使い、UIにランクバッジ追加 |
| 来店スタンプ | `stamps` テーブルを新設し会員証UIにスタンプ枠を追加 |
| 誕生日特典・通知 | Messaging APIのプッシュ送信をcronで実行 |

Claude Codeなどに「〇〇機能を追加して」と伝えれば、このディレクトリ構成を土台に
実装を進めてもらえます。
