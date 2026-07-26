# Noble System

## プロジェクト概要
営業活動を支援するダッシュボードおよび商談管理システムです。Google OAuth による認証と、Google Calendar を起点にした商談登録フローの整備を進めています。

主な機能:
- Google OAuth ログイン
- 商談データの登録・一覧表示
- ダッシュボード表示
- Google Calendar 予定の取り込み

## セットアップ手順
前提:
- Node.js
- npm

インストール手順:
```bash
npm install
cd nobledashboard/deal-app
npm install
```

環境変数:
- `.env.example` は未整備です
- Supabase 接続情報
- Google OAuth 関連設定
- `NEXT_PUBLIC_SITE_URL`

## 実行方法
起動コマンド:
```bash
cd nobledashboard/deal-app
npm run dev
```

動作確認URL:
- `http://localhost:3000`

主要な画面:
- `/` ログインページ
- `/dashboard` ダッシュボード
- `/deals/new` 新規商談登録
