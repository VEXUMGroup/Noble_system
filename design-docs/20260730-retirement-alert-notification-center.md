# 2026-07-30 退職日アラートの通知センター統合

## 前提
- [20260716-notification-center.md](20260716-notification-center.md) で「退職日アラート」は通知センターの初期対象候補とされていたが、実装を確認した結果、ダッシュボードのポップアップ／一覧表示はクライアント側で `deals` テーブルから都度計算しているのみで、`notifications` テーブルには保存されておらず、通知センター・Push・既読管理の対象外だった。
- 開発者確認の結果、方針は「並存」に決定：既存のダッシュボードポップアップ（`retirement_date` が14日以内の商談中・再商談案件を表示するUI）はそのまま残し、それとは別に `notifications` テーブルへの保存・Push送信を追加する。

## 決定事項
- 通知対象は `deals.status` が `RS_IN_PROG`（商談中）または `RS_REDEAL`（再商談）の案件とする（`/review` 画面・ダッシュボードのアラート抽出条件と同じ集合）。
- 判定条件は `deals.retirement_date` の残り日数が **ちょうど14日** の案件のみとする。
  - ダッシュボードポップアップは「14日以内」の範囲表示を維持するが、通知センター側は `payment_due_3days` と同じ「ちょうどN日前」方式に統一し、案件が14日以内の間毎日重複通知が積み上がるのを防ぐ。
- 通知送信先は、その案件の担当営業 `deals.assigned_to` の1名のみとする。
- 通知手段は Web Push とする。
- 同一案件・同一日付の重複通知は防止する（`notification_key` に `deal_id` と対象日を含めて冪等化）。

## 実装方針
- 既存の支払期日前通知 (`src/app/api/notifications/payment-reminders/route.ts` / `src/lib/payment-reminders.ts`) と同じ構成で実装する。
  - `src/lib/retirement-alerts.ts`: 純粋関数 `buildRetirementAlertTargets(deals, referenceDate)` で対象抽出ロジックを実装（テスト容易性のため route から分離）。
  - `src/app/api/notifications/retirement-alerts/route.ts`: cron 認可 or セッション認可、対象抽出、`resolveNotificationRecipientUserIds({ audience: 'sales', assignedTo })` で受信者解決、`insertNotificationLog` で保存、Push購読があれば `sendPushNotifications` で送信。
- 通知種別は既存定義済みの `retirement_alert` を使う（`src/lib/notifications.ts` にタイトル・アイコン定義は既にあるため追加不要）。
- Push の遷移先は他の通知種別と同様に `getNotificationDetailUrl(id)`（通知詳細ページ経由）とする。通知詳細ページから「関連商談を開く」で `/deals/{dealId}` に遷移できる（既存の詳細ページ実装をそのまま利用）。
- `vercel.json` の `crons` に `/api/notifications/retirement-alerts` を追加する（`payment-reminders` と同じ日次スケジュール）。

## 通知文面
- タイトル: `退職日アラート`（既存の `getNotificationTitle('retirement_alert')` を利用）
- 本文: `{customer_name} 様の退職予定日まであと14日です。`

## 非対象
- ダッシュボードポップアップUIの変更・削除
- 14日以外のタイミングでの通知（前日・数日前・再通知は行わない）
- メール通知、複数営業への同報

## 確認観点
- `RS_IN_PROG` / `RS_REDEAL` かつ `retirement_date` の残り日数がちょうど14日の案件だけが対象になる。
- `assigned_to` に紐づく営業1名にだけ通知される。
- 同じ案件で API を複数回叩いても通知ログ重複で二重送信されない。
- Push購読済み端末では通知が届き、未購読端末でもAPIが異常終了しない。
- ダッシュボードの既存ポップアップ表示（14日以内の一覧）が変わらず動作する。
