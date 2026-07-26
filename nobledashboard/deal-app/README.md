# deal-app (Next.js)

このディレクトリは商談管理（`deal-app`）の Next.js アプリです。

## 前提

- Node.js: `>=20 <21`（推奨: Node 20）
- npm: Node 同梱のものを使用

確認:

```sh
cd nobledashboard/deal-app
node -v
npm -v
```

`node -v` が `v20.x` になっていない場合、まず Node 20 に切り替えてください。

## 起動（最短）

```sh
cd nobledashboard/deal-app
npm install
npm run dev
```

ブラウザで `http://127.0.0.1:3000` を開きます。

## 通知設定

スマホ通知を使う場合は `.env.local` に以下も必要です。

```sh
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@example.com
```

値を追加・変更したあとは `npm run dev` を再起動してください。

## Node 20 に切り替える方法

### nvm を使う（推奨）

このディレクトリには `.nvmrc` があるので、nvm が入っていれば以下で OK です。

```sh
cd nobledashboard/deal-app
nvm install
nvm use
node -v
```

### Homebrew の node@20 を使う（nvm が無い場合）

Homebrew で `node@20` が入っている前提です。

```sh
cd nobledashboard/deal-app
export PATH="/opt/homebrew/Cellar/node@20/20.19.5/bin:$PATH"
node -v
```

注: 上のバージョン（`20.19.5`）はこのリポジトリ作業環境で確認できたものです。あなたの環境で別バージョンの場合は、インストールされているパスに合わせてください。

## よくあるエラーと対処

### `npm warn EBADENGINE ... current: node v25.x`

Node のバージョンが新しすぎます。Node 20 に切り替えてから再実行してください。

### `sh: next: command not found`

依存が壊れている/未インストールの可能性が高いです。

```sh
cd nobledashboard/deal-app
rm -rf node_modules .next
npm install
```

### `listen EPERM: operation not permitted ... :3000`

何らかの制約（実行環境の権限/セキュリティ設定など）でポート待受がブロックされています。

回避としてホスト/ポートを明示して起動します:

```sh
cd nobledashboard/deal-app
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## 社内向け運用マニュアル

実運用時の利用手順は [docs/operation-manual.md](docs/operation-manual.md) を参照してください。
