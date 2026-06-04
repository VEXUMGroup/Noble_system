# AGENTS.md｜壁打ちメモ

> ここに「今やりたいこと」を書き出す壁打ち用ドキュメント。
> Codex はこのファイルを読んで作業内容を理解する。

---

## 1. 今やりたいこと（ゴール）

### Phase 1: Google OAuth ログイン（進行中）
- Google OAuth ログイン機能を実装
- 既存のメール/パスワードログインを削除
- ログイン後は自動的にダッシュボードにリダイレクト
- セッション管理を実装

### Phase 2: Google Calendar 連携（計画中）
- Google Calendar から予定を取得・ダッシュボードに表示
- **カレンダーの予定をベースに新規商談を登録できる機能を実装**
- Google OAuth スコープに Calendar.readonly を追加

---

## 2. 背景・現状

### Phase 1 関連
- 既存のメール/パスワードログインは単純な検証のみで、実際の認証機能なし
- Supabase が設定済みで、Google OAuth の設定も完了
- より堅牢で使いやすい認証方式への移行が必要

### Phase 2 関連（Calendar 連携）
- ユーザーのビジネス課題：営業活動を効率化したい
- **カレンダー上の客先訪問や会議の予定を商談データとして記録する必要性**
- Google Calendar API は Supabase 認証情報で連携可能

---

## 3. 対象範囲

<!-- どのファイル・どの画面・どのブランチを触るか -->

- 対象ブランチ: main
- 対象画面 / ファイル（Phase 1）:
  - `src/app/page.tsx` (ログインページ)
  - `src/lib/supabase.ts` (認証関連の関数追加)
  - `.env.local` (Google OAuth 設定追加)
  - 認証チェック用のコンポーネント・ミドルウェア

- 対象画面 / ファイル（Phase 2）:
  - `src/lib/google-calendar.ts` (新規・Google Calendar API 関数)
  - `src/components/dashboard/CalendarWidget.tsx` (新規・カレンダー表示用コンポーネント)
  - `src/app/deals/new-from-calendar.tsx` (新規・カレンダーから商談登録ページ)
  - `src/lib/supabase.ts` (scopes に calendar.readonly を追加)

- 触らない範囲: 既存のダッシュボード・商談管理のビジネスロジック

---

## 4. 残したいこと / 戻したいこと

| 項目 | 残す | 戻す | メモ |
|---|---|---|---|
|  |  |  |  |

---

## 5. 判断に迷っているところ

<!-- Codex に相談したい論点 -->

### 技術的な実装方法について

#### 1. Google Calendar イベント → 商談データへのマッピング（決定済み）
- **イベントのタイトル** → `customer_name`（クライアント名・そのまま使用）
- **イベントの開始時刻** → `deal_date`（初回訪問日）
- **イベントの説明欄** → `deal_notes`（商談メモ）
- **ログイン中のユーザー** → `assigned_to`（担当営業）
- **固定値** → `source: 'CALENDAR'`（流入経路として記録）
- **手動入力** → `retirement_date`（クローズ予定日）

#### 2. フロー・UX の設計（決定済み）
**ユーザーフロー：**
1. ダッシュボード訪問
2. Calendar ウィジェット初表示時に「Calendar へのアクセスを許可しますか？」
3. ユーザーが許可 → Google 認可画面へ → 権限許可
4. Calendar イベント一覧を取得して表示（リスト表示で十分）
5. イベントをクリック → **マッピング済みのフォームが事前入力済みで表示される**
   - このフローは既存の `/deals/new` フォームを活用、Calendar イベント情報でプリセット
6. ユーザーが `retirement_date` などを手動入力・修正
7. 「商談として登録」ボタンで Deals テーブルに INSERT
8. 新規商談が商談一覧に表示される（既存フローと同じ）

#### 3. 重複登録の防止（決定済み）
**対策：**
- Google Calendar のイベント ID（event.id）を deals テーブルに新規カラム `calendar_event_id` として保存
- 同じイベント ID で既に登録済みかチェック
- **1イベント = 1商談のみ**（同じイベントから複数登録は不可）

#### 4. スコープ・権限管理（決定済み）
- Google OAuth スコープに `calendar.readonly` を追加
- **ダッシュボード初訪問時に個別リクエスト**（ログイン時ではなく）
- Calendar ウィジェットが初めて表示される際にリクエストを出す

---

## 6. 完了の定義

### Phase 1（Google OAuth）
- Google OAuth ログインが機能する
- ログイン後は自動的にダッシュボードにリダイレクト
- ログアウトボタンからログアウトできる
- 未認証ユーザーが保護されたページにアクセスするとログインページにリダイレクト
- メール/パスワードログインは削除完了

### Phase 2（Google Calendar 連携）
- ダッシュボードに Google Calendar ウィジェットが表示される
- ユーザーが Calendar へのアクセスを許可すると予定が表示される
- カレンダー上の予定をクリックして新規商談が登録できる
- 登録した商談が商談管理画面に表示される

---

## 7. メモ・参考リンク

### Phase 1
- Supabase Google OAuth 設定完了
- NEXT_PUBLIC_SITE_URL=http://localhost:3000 に設定

### Phase 2
- Google Calendar API v3 を使用予定
- OAuth scopes: `calendar.readonly` を追加
- 参考: [Google Calendar API Docs](https://developers.google.com/calendar/api/guides/overview)

### 実装内容

#### Phase 1（Google OAuth ログイン）
1. **ログインページ** (`src/app/page.tsx`)
   - Google ログインボタンのみ
   - セッション自動チェック機能

2. **認証関数** (`src/lib/supabase.ts`)
   - `signInWithGoogle()` - Google OAuth ログイン
   - `signOut()` - ログアウト
   - `getSession()` - セッション取得
   - `onAuthStateChange()` - 認証状態リスナー

3. **ルートレベル認証** (`src/app/layout.tsx`)
   - ログインページ以外で認証をチェック
   - 未認証→ログインページへリダイレクト
   - 認証済みユーザー情報を AppShell に渡す

4. **ログアウト機能** (`src/components/layout/Header.tsx`)
   - ユーザーメニュー（ドロップダウン）
   - ログアウトボタン

#### Phase 2（Google Calendar 連携）

##### 2-1. Google Calendar API 関数 (`src/lib/google-calendar.ts`)
```typescript
// Google Calendar API のラッパー関数
- requestCalendarAccess()
  └─ Supabase のアクセストークンを使用して Google Calendar への権限をリクエスト
  
- getCalendarEvents(startDate, endDate)
  └─ 指定期間のカレンダーイベントを取得
  └─ 返り値: { id, summary, description, start, end, attendees, location }[]
  
- formatEventForDeal(event)
  └─ Calendar イベント → deals フォーム用データに変換
  └─ 返り値: { customer_name, deal_date, retirement_date, deal_notes, assigned_to, source }
  
- checkDuplicateDeal(eventId)
  └─ 同じイベント ID から既に登録済みの商談があるかチェック
```

##### 2-2. Calendar ウィジェット (`src/components/dashboard/CalendarWidget.tsx`)
```typescript
機能：
- 許可ステータスの表示＆許可ボタン
- カレンダー（月ビューまたはリスト）の表示
- イベントクリック時に詳細モーダルまたは遷移

フロー：
1. 初回マウント時に「Calendar へのアクセス許可をしますか？」
2. ユーザーが許可 → `requestCalendarAccess()` 実行
3. イベント一覧取得 → 表示
4. イベントクリック → `new-from-calendar` ページへ遷移
```

##### 2-3. Calendar からの商談登録ページ (`src/app/deals/new-from-calendar/[eventId]/page.tsx`)
```typescript
機能：
- URL パラメータから eventId を受け取る
- `formatEventForDeal(event)` でフォーム初期値を生成
- 既存の新規商談フォームを再利用（一部カスタマイズ）
- 「カレンダー連携」を示すバッジ表示
- ユーザーが修正・確認後「登録」

フロー：
1. マウント時に Calendar イベントを取得
2. 自動マッピング → フォームに事前入力
3. ユーザーが「修正」「確認」
4. 「登録」ボタンで `/deals` を新規作成
5. 成功後 `/deals/:id` に遷移
```

##### 2-4. Supabase スキーマ拡張
```sql
-- deals テーブルに新カラムを追加（重複登録防止用）
ALTER TABLE deals ADD COLUMN calendar_event_id VARCHAR(255) UNIQUE;

-- インデックス作成
CREATE INDEX idx_deals_calendar_event_id ON deals(calendar_event_id);
```

---

## 8. 実装ステップ（順序付き）

### ステップ 1: 基盤の準備
- [ ] Supabase の `deals` テーブルに `calendar_event_id` カラムを追加
  ```sql
  ALTER TABLE deals ADD COLUMN calendar_event_id VARCHAR(255) UNIQUE;
  CREATE INDEX idx_deals_calendar_event_id ON deals(calendar_event_id);
  ```
- [ ] Google OAuth スコープに `calendar.readonly` を追加（Supabase 設定）
- [ ] `.env.local` に必要な環境変数を追加

### ステップ 2: Google Calendar API 関数の実装
- [ ] `src/lib/google-calendar.ts` を作成
  - `getCalendarEvents(startDate, endDate)` - イベント一覧取得
  - `requestCalendarAccess()` - 権限リクエスト
  - `formatEventForDeal(event)` - イベント → フォームデータ変換
  - `checkDuplicateDeal(eventId)` - 重複チェック

### ステップ 3: Dashboard に Calendar ウィジェットを追加
- [ ] `src/components/dashboard/CalendarWidget.tsx` を作成
  - 権限ステータス確認 & リクエストボタン
  - イベント一覧をリスト表示
  - イベントクリック → `/deals/new?calendarEventId={eventId}` へリンク

### ステップ 4: Calendar イベントからの商談登録フロー
- [ ] `/deals/new` ページを拡張
  - URL パラメータ `calendarEventId` をサポート
  - 該当イベントのデータを取得して フォームに事前入力
  - 「カレンダー連携」バッジを表示
  - 登録時に `calendar_event_id` を deals テーブルに保存

### ステップ 5: テスト & 調整
- [ ] 権限リクエスト → 許可のフロー確認
- [ ] イベント取得 → 表示のテスト
- [ ] 商談登録完了後に商談一覧に反映されることを確認
- [ ] 重複登録のテスト（2回目のリクエストは失敗するはず）

### Phase 2（拡張・後日対応）
- カレンダービュー（月ビュー）の実装
- イベント詳細の高度な解析（参加者情報→顧客名推測）
- イベント更新時の同期機能
- リアルタイム同期

---

## 9. 実装前に確認すべき事項

### 環境確認
- [ ] Supabase Google OAuth が `calendar.readonly` スコープ対応しているか確認
- [ ] Google Calendar API v3 が利用可能か確認
- [ ] 既存の Supabase アクセストークン取得方法を確認

### 技術仕様の確認
- [ ] Google Calendar API のレート制限を確認（実装時の考慮）
- [ ] アクセストークン有効期限の管理方法を決定
- [ ] ユーザーが複数のカレンダーを持つ場合は「メインカレンダーのみ」を対象

### 既存コードの調査
- [ ] `src/lib/supabase.ts` でのトークン取得・利用方法
- [ ] `/deals/new` ページの既存実装を確認
- [ ] Dashboard ページのレイアウト確認（ウィジェット追加位置）

---

_最終更新：2026-05-21_
