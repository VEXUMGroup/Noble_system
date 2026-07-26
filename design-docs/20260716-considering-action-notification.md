# 2026-07-16 検討管理の次回アクション当日通知

## 対象
- `nobledashboard/deal-app/src/app/api/notifications/payment-reminders/route.ts`
- `nobledashboard/deal-app/src/lib/notification-targets.ts`
- `nobledashboard/deal-app/src/lib/push-notifications.ts`
- `SPEC.md`

## 決定事項
- 通知対象は「検討管理に入った顧客」とする。
- 判定条件は、`deals.status` が検討管理系ステータスであり、かつ `deals.next_action_date` が当日であること。
- 通知送信先は、その顧客の担当営業 `deals.assigned_to` の 1 名のみとする。
- 通知手段は Web Push とする。
- 同一案件・同一日付に対する重複通知は防止する。

## 実装方針
- 既存の支払期日前通知 API と同じ構成で、検討管理向けの通知 API を追加する。
- 通知対象抽出では、`next_action_date = JST 当日` の案件のみを取得する。
- 受信者解決は既存の `resolveNotificationRecipientUserIds({ audience: 'sales', assignedTo })` を使い、担当営業 1 名に限定する。
- 通知ログは `notifications` テーブルへ保存し、通知キーに `deal_id` と `next_action_date` を含めて冪等化する。
- Push 購読がない担当者には保存ログのみ残し、Push 送信はスキップする。

## 通知文面
- タイトル: `本日の次回アクション通知`
- 本文: `{customer_name} 様の次回アクション日が本日です。`
- 遷移先: `/deals/{dealId}` を基本とする。

## 非対象
- メール通知
- 複数営業への同報
- 前日通知、数日前通知、再通知
- 検討管理ステータスの追加定義変更

## 確認観点
- 検討管理かつ `next_action_date = 当日` の案件だけが対象になる。
- `assigned_to` に紐づく営業 1 名にだけ通知される。
- 同じ案件で API を複数回叩いても通知ログ重複で二重送信されない。
- Push 購読済み端末ではブラウザ通知が届き、未購読端末では API が異常終了しない。
