# 2026-07-16 商談ステータス通知

- 対象: `nobledashboard/deal-app`
- 目的: 成約時と事務承認差し戻し時の通知を、既存の通知基盤と Web Push に接続する

## 決定事項

- `contract_complete` 通知は現行仕様では使わない
- 商談が「面談実施済み」の流れを経て `成約` になったとき、事務/管理者向け通知を送る
- この成約通知は Web Push を伴う通知とする
- 事務承認で差し戻しされたときは、営業担当 `assigned_to` に通知を送る
- 差し戻し通知も Web Push を伴う通知とする

## 実装方針

- 通知種別を `deal_contracted` と `approval_rejected` に整理する
- 商談更新 API `src/app/api/deals/[id]/route.ts` で前後状態を比較し、通知条件を判定する
- 通知送信処理は `src/lib/deal-status-notifications.ts` に切り出す
- 成約通知の送信先は既存の `admin_staff` audience ルールを流用し、`manager` ロール全員へ送る
- 差し戻し通知の送信先は既存の `sales` audience ルールを流用し、`assigned_to` へ送る
- `read_at` カラム未反映環境でも通知一覧・詳細・既読 API が落ちないよう、`notifications-server.ts` にフォールバックを入れる
