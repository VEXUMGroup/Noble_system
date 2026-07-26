# 2026-07-16 通知対象者ルール

## 対象
- `nobledashboard/deal-app/src/lib/notification-targets.ts`
- `nobledashboard/deal-app/src/app/api/notifications/payment-reminders/route.ts`
- `SPEC.md`

## 決定事項
- 営業向け通知の通知先は `deals.assigned_to` の 1 名とする。
- 事務向け通知の通知先は、ひとまず `m_users.role = 'manager'` かつ `is_active = true` の全員とする。
- 通知先の決定ロジックは各 API に分散させず、共通関数で解決する。

## 実装方針
- `src/lib/notification-targets.ts` を追加し、通知 audience ごとの受信者一覧を返す。
- audience はまず `sales` / `admin_staff` の 2 種類で管理する。
- `sales` は `assignedTo` をそのまま返す。
- `admin_staff` は `m_users` から active な `manager` 全員を取得して返す。
- 将来、通知種別と audience の対応表が必要になったら、この共通層に集約する。

## 今回の適用範囲
- 既存の `payment-reminders` API は、共通関数経由で営業向け通知先を解決する。
- 事務向け通知は通知イベントが固まり次第、同じ共通関数を利用して展開する。

## 期待結果
- 通知対象者ルールが仕様とコードで一貫する。
- 事務向け通知追加時に recipient 判定をコピペせずに拡張できる。
