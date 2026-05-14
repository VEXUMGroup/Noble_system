# 本日のTODO | 2026-05-14

## 進め方の優先順位
1. **マスター機能実装**（ローカルで開発・確認）
2. **クライアント Vercel デプロイ**
3. **認証を本番移行**（Google Console 設定含む）

---

## ① マスター機能実装

### 方針
- **配置**: 既存の `/src/app/master/page.tsx` を拡張
- **対象テーブル**: `m_users`, `m_sources`, `m_statuses`, `m_plans`, `m_agencies`
- **権限**: `admin_staff` ロールのみ編集可能
- **UI**: タブ形式で各テーブルを切り替え表示
- **入力方式**: 手動で1件ずつ（CSVインポートなし）

### テーブル別の実装内容

#### 1. **m_users** (ユーザー管理)
- [ ] テーブル表示：id, name, role, email, is_active
- [ ] 追加モーダル：name, role (select), email, is_active (checkbox)
- [ ] 編集機能：既存行をクリックして編集
- [ ] 削除機能：is_active フラグで論理削除

#### 2. **m_sources** (流入経路)
- [ ] テーブル表示：code, name, is_active
- [ ] 追加モーダル：code, name, is_active
- [ ] 編集・削除機能

#### 3. **m_statuses** (ステータス)
- [ ] テーブル表示：code, name, category, sort_order, is_active
- [ ] category: interview, result, contract_confirm, contract, support, payment
- [ ] 追加モーダル：code, name, category (select), sort_order, is_active
- [ ] 編集・削除機能

#### 4. **m_plans** (プラン)
- [ ] テーブル表示：code, name, description, price, is_active
- [ ] 追加モーダル：code, name, description, price, is_active
- [ ] 編集・削除機能

#### 5. **m_agencies** (代理店)
- [ ] テーブル表示：code, name, contact, commission_rate, is_active
- [ ] 追加モーダル：code, name, contact, commission_rate, is_active
- [ ] 編集・削除機能

### 実装ステップ

#### Step 1: Supabase CRUD 関数の実装
- [ ] `src/lib/supabase-master.ts` 新規作成
  - `fetchMasterData(table)` - テーブル全件取得
  - `addMasterData(table, data)` - 追加
  - `updateMasterData(table, code, data)` - 更新
  - `deleteMasterData(table, code)` - 削除（論理削除）

#### Step 2: 権限チェック機能
- [ ] `isMasterAdmin(user)` - ログインユーザーが admin_staff か確認
- [ ] master page 読み込み時に権限チェック
- [ ] 権限がない場合はリダイレクト

#### Step 3: UI コンポーネント構築
- [ ] タブの追加：users, sources, statuses, plans, agencies
- [ ] 汎用テーブルコンポーネント `<MasterTable />` 
- [ ] 汎用モーダルコンポーネント `<MasterModal />`
- [ ] form フィールドの動的生成（テーブル定義に応じて）

#### Step 4: 既存モックから Supabase データへ切り替え
- [ ] mockDeals, mockUsers 等の参照をモックから Supabase に変更
- [ ] ダッシュボード全体でマスターデータを参照

#### Step 5: ローカルで動作確認
- [ ] 各テーブルの追加・編集・削除が機能すること
- [ ] 権限チェックが機能すること
- [ ] 入力値のバリデーション
- [ ] エラーハンドリング（通信失敗時など）

### CSV マッピング（参考）
- **担当名** → m_users
- **商談ステータス** → m_statuses (category='interview')
- **結果ステータス** → m_statuses (category='result')
- **WEB経由** → m_sources
- **代理店経由** → m_agencies
- **人材提案** → m_statuses (category='hr_proposal')
- **人材可否** → m_statuses (category='hr_feasibility')

---

## ② クライアント Vercel デプロイ

### デプロイ前準備
- [ ] ローカルで全機能テスト完了
- [ ] `main` ブランチに commit & push
- [ ] 環境変数確認

### デプロイ実行
- [ ] クライアント側 Vercel アカウントで本番環境にデプロイ
- [ ] デプロイ後の動作確認

---

## ③ 認証を本番移行

### 準備
- [ ] 川崎さんのアカウントで Google Console 設定
  - OAuth クライアント ID 取得
  - リダイレクト URI 設定（クライアント本番環境に合わせる）
- [ ] クライアント側の `.env.local` に反映

### 実装
- [ ] Supabase 認証設定を本番に更新
- [ ] Google OAuth ログイン動作確認
- [ ] ログアウト機能確認
- [ ] 未認証ユーザーのリダイレクト確認
- [ ] メール/パスワードログイン削除確認

---

## メモ
- マスター機能→デプロイ→認証移行の順番で進める
- 各段階終了後に確認・テストを十分に行う
