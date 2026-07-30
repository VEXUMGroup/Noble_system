# 通知センター機能まとめ

最終更新: 2026-07-30

このドキュメントは `nobledashboard/deal-app` の通知センター（アプリ内通知一覧・既読管理・Web Push）に関わる実装を横断的にまとめた技術リファレンス。個別の設計判断の経緯は `design-docs/` 配下の各設計書を参照。仕様上の確定事項は `SPEC.md` を正とする（本ファイルと矛盾する場合は `SPEC.md` を優先）。

## 1. 全体像

```
通知の発生源（cron / API操作）
   → notifications テーブルへ保存（重複防止つき）
   → 購読中デバイスへ Web Push 送信
   → ユーザーがPush通知タップ or アプリ内導線から /notifications/{id} を開く
   → 開いた瞬間に既読化 → /deals/{id} へ遷移可能
```

- アプリ内一覧: `/notifications`（時系列、未読/既読が視覚的に分かる）
- 通知詳細: `/notifications/{id}`（開いた瞬間に既読化、関連商談への導線）
- ダッシュボード右側の通知欄: 直近の通知サマリーを表示し「一覧を見る」で `/notifications` へ
- サイドバー: 通知センターボタン（未読件数バッジ付き）

参照設計書: `design-docs/20260716-notification-center.md`（軽設計）

## 2. 通知種別一覧

`src/lib/notifications.ts` の `NotificationType` で定義。タイトル文言・アイコンもここで種別ごとに分岐。

| type | タイトル | 発生条件 | 通知先 | 保存経路 | 状態 |
|---|---|---|---|---|---|
| `payment_due_3days` | 支払期日3日前の未入金通知 | `deals.payment_deadline` が3日後、かつ未入金 | 担当営業1名（`assigned_to`） | `/api/notifications/payment-reminders`（cron日次） | ✅実装済み |
| `deal_contracted` | 成約通知 | 面談実施済みを経て成約になったとき | `manager` ロール全員 | `deals/[id]` API更新時に `deal-status-notifications.ts` が判定 | ✅実装済み |
| `approval_rejected` | 事務承認差し戻し通知 | 事務承認が差し戻しされたとき | 担当営業1名（`assigned_to`） | 同上 | ✅実装済み |
| `next_action_today` | 本日の次回アクション通知 | 検討管理ステータス（`RS_IN_PROG`/`RS_REDEAL`）かつ `next_action_date` が本日 | 担当営業1名（`assigned_to`） | `/api/notifications/next-action-today`（cron日次） | ✅実装済み（2026-07-30追加、実データでの動作確認は未実施） |
| `retirement_alert` | 退職日アラート | 検討管理ステータス（`RS_IN_PROG`/`RS_REDEAL`）かつ `retirement_date` の残り日数がちょうど14日 | 担当営業1名（`assigned_to`） | `/api/notifications/retirement-alerts`（cron日次） | ✅実装済み（2026-07-30追加、実データでの動作確認は未実施）。**別途**、ダッシュボードには14日以内を継続表示するポップアップ/一覧UIが独立して存在（並存方針、下記4.4参照） |

いずれも通知キー（`notification_key`）に案件ID・対象日・受信者IDを含めて冪等化しており、同一案件・同一日付・同一受信者への重複保存を防止する。

## 3. データモデル

### `notifications` テーブル
- 主なカラム: `id`, `user_id`, `deal_id`, `type`, `message`, `is_read`, `created_at`, `read_at`, `notification_key`
- `read_at` と `notification_key` は後発マイグレーションで追加（`202607160009_notifications_read_at.sql`, `202607160006_push_notifications.sql`）。
- `notifications-server.ts` は `read_at` カラム未反映環境でも動くよう、select/updateでカラム欠落エラーを検知してフォールバックするガードを持つ。

### `push_subscriptions` テーブル
- `user_id`, `endpoint`（unique）, `subscription`（JSONB、Web Push購読情報一式）, `device_name`, `user_agent`, `is_active`
- 購読はデバイス単位。同一ユーザーが複数デバイスを持てば複数行になる。

## 4. コード構成

### 4.1 データ層 / 共通ロジック（`src/lib/`）
| ファイル | 役割 |
|---|---|
| `notifications.ts` | `NotificationType`、`AppNotification`型、タイトル/詳細URL/日時フォーマットのヘルパー |
| `notifications-server.ts` | 一覧取得・未読数取得・ID指定取得・既読化（Supabase admin client使用） |
| `notification-targets.ts` | `resolveNotificationRecipientUserIds({audience, assignedTo})` — 営業(`sales`)は`assigned_to`本人のみ、事務(`admin_staff`)は`manager`ロール全員 |
| `notification-events.ts` | `NOTIFICATIONS_UPDATED_EVENT` のdispatch/listen（既読化後などにクライアント側の一覧を再取得させる） |
| `useNotifications.ts` | 一覧+未読数を取得するReact hook（ダッシュボード・通知一覧ページ・サイドバーで共用） |
| `useNotificationDetail.ts` | 通知詳細1件を取得するReact hook |
| `push-notifications.ts` | 購読の保存/削除/取得、`insertNotificationLog`（重複時は`inserted:false`を返す）、`sendPushNotifications`（web-push） |
| `payment-reminders.ts` | 支払期日3日前の対象抽出（純粋関数） |
| `deal-status-notifications.ts` | 成約通知・差し戻し通知の判定＋送信 |
| `next-action-notifications.ts` | 次回アクション当日通知の対象抽出（純粋関数） |
| `retirement-alerts.ts` | 退職日アラート（通知センター向け）の対象抽出（純粋関数） |

### 4.2 APIルート（`src/app/api/`）
| ルート | 用途 |
|---|---|
| `GET /api/notifications` | ログインユーザーの通知一覧+未読数 |
| `GET /api/notifications/[id]` | 通知詳細1件 |
| `POST /api/notifications/[id]/read` | 既読化 |
| `GET /api/notifications/payment-reminders` | 支払期日3日前通知（cron） |
| `GET /api/notifications/next-action-today` | 次回アクション当日通知（cron） |
| `GET /api/notifications/retirement-alerts` | 退職日アラート（cron） |
| `POST /api/push/subscribe` | Push購読登録 |
| `POST /api/push/unsubscribe` | Push購読解除 |
| `POST /api/push/test` | Pushテスト送信 |

cron系ルートは `Authorization: Bearer $CRON_SECRET` またはURLクエリ `?token=$CRON_SECRET` での認可、もしくは通常のログインセッションでも実行可能（動作確認用）。

### 4.3 UI（`src/app/(authenticated)/notifications/`, `src/components/`）
- `notifications/page.tsx`: 一覧画面。`useNotifications(100)`で取得し、未読は背景色で強調。
- `notifications/[id]/page.tsx`: 詳細画面。マウント時に未読なら`/read`を叩いて既読化し、`dispatchNotificationsUpdated()`で他画面に反映。
- `components/notifications/NotificationCenterButton.tsx`: ベルアイコン+未読バッジ、`/notifications`へのリンク。`Sidebar.tsx`から呼ばれている。
- `components/notifications/NotificationIcon.tsx`: 種別ごとのアイコン切り替え。
- `dashboard/page.tsx`: 右側に直近通知サマリー＋「一覧を見る」リンク。

### 4.4 退職日アラートのポップアップ（別系統・注意）
`dashboard/page.tsx` と `review/page.tsx` には、`deals`テーブルから都度クライアント側で計算する「退職予定日14日以内」のポップアップ／一覧表示が別途存在する。これは`notifications`テーブルとは無関係で、通知センターの既読管理・履歴には残らない。2026-07-30時点で「並存」方針を決定し、通知センター向けの`retirement_alert`保存処理を別途追加したが、このポップアップUI自体には手を加えていない（表示条件は「14日以内」の範囲、通知センター側は「ちょうど14日」の一致のみで挙動が異なる点に注意）。

### 4.5 Web Push
- Service Worker: `src/app/sw.js/route.ts`（動的に生成されるJS。`push`イベントで`showNotification`、`notificationclick`で`event.notification.data.url`へ遷移／フォーカス）
- 登録: `src/components/pwa/PwaRegistration.tsx`（`AuthenticatedShell`でマウント）
- VAPID鍵: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`
- Push送信時のペイロードには常に`data.url`として通知詳細ページ（`/notifications/{id}`）を含める設計で統一されている。

### 4.6 定期実行（`vercel.json`）
```json
"crons": [
  { "path": "/api/notifications/payment-reminders", "schedule": "0 0 * * *" },
  { "path": "/api/notifications/next-action-today", "schedule": "0 0 * * *" },
  { "path": "/api/notifications/retirement-alerts", "schedule": "0 0 * * *" }
]
```
`0 0 * * *`はUTC 0時（JST 9時）に毎日実行。**要確認**: Vercel Hobbyプランはcronが2件までかつ日次実行のみの制限があるため、3件登録した状態でデプロイ先プランの上限に抵触しないか要確認。

## 5. 既知の懸念事項

- `src/components/layout/Header.tsx` に未配線（クリックしても遷移しない）の通知ベルUIが残っており、かつこの`Header`コンポーネント自体がどこからも呼ばれていない（未使用コード）。通知センターの導線としては`Sidebar.tsx`内の`NotificationCenterButton`が実際の入り口になっている。
- `next_action_today` と `retirement_alert` は2026-07-30に実装したが、開発用サンドボックス環境からSupabaseへのネットワーク到達性がなく、実データでの動作確認（cron認可・対象抽出・重複防止・Push送信）はまだ実施できていない。ネットワーク到達可能な環境での確認が必要。

## 6. 関連ドキュメント
- `design-docs/20260716-notification-center.md` — 通知センター全体の軽設計
- `design-docs/20260716-considering-action-notification.md` — 次回アクション当日通知の設計
- `design-docs/20260716-deal-status-notifications.md` — 成約通知・差し戻し通知の設計
- `design-docs/20260716-notification-recipient-rules.md` — 通知対象者ルール
- `design-docs/20260730-retirement-alert-notification-center.md` — 退職日アラートの通知センター統合設計
- `SPEC.md` — 確定事項（本ファイルより優先）
