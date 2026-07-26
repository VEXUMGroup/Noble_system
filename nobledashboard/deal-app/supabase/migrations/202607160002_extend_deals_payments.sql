-- 202607160002_extend_deals_payments.sql
-- 目的：
--   1) deals テーブルに Deal 型（フロント）の全フィールドを反映
--   2) m_statuses に LOST（失注）を追加
--   3) payments テーブル新設（mockPaymentRecords 相当）
--   4) updated_at トリガ・インデックス・RLS 無効化（開発用）

-- =========================================
-- 1. m_statuses に LOST を追加
-- =========================================
INSERT INTO m_statuses (code, name, sort_order)
VALUES ('LOST', '失注', 12)
ON CONFLICT (code) DO NOTHING;

-- =========================================
-- 2. deals テーブル拡張
-- =========================================
ALTER TABLE deals ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS email VARCHAR(200);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contract_confirmation VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS payment_plan VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contract_plan VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contract_plan_other VARCHAR(200);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS irregular_notes TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS hr_proposal VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS hr_feasibility VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS hr_target_28m BOOLEAN;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS considering_reason VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS considering_reason_comment TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS out_of_scope_reason VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS out_of_scope_reason_comment TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lost_reason VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lost_reason_comment TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS referrer VARCHAR(200);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS prospect_level VARCHAR(10);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS next_action_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS interview_status VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS result_status VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS agency_type VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS proposal_content TEXT;

-- 既存列の制約を緩和（フロント側でオプショナルなので NULL 許容にする）
ALTER TABLE deals ALTER COLUMN source DROP NOT NULL;
ALTER TABLE deals ALTER COLUMN status DROP NOT NULL;
ALTER TABLE deals ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE deals ALTER COLUMN updated_by DROP NOT NULL;

-- updated_at 自動更新トリガ（002 の set_updated_at 関数を流用）
DROP TRIGGER IF EXISTS trg_deals_updated_at ON deals;
CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================
-- 3. payments テーブル新設
-- =========================================
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(30) PRIMARY KEY,
  deal_id VARCHAR(20) NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount INT NOT NULL,
  method VARCHAR(50) NOT NULL,
  payer_name VARCHAR(200),
  payment_status VARCHAR(50),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_payments_deal_id ON payments(deal_id);
CREATE INDEX IF NOT EXISTS idx_payments_date    ON payments(date);

-- =========================================
-- 4. 開発用：RLS 無効化（本番投入前にポリシー再設計）
-- =========================================
ALTER TABLE deals               DISABLE ROW LEVEL SECURITY;
ALTER TABLE deal_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE agency_commissions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments            DISABLE ROW LEVEL SECURITY;

-- =========================================
-- 5. 補助インデックス
-- =========================================
CREATE INDEX IF NOT EXISTS idx_deals_deal_date  ON deals(deal_date);
CREATE INDEX IF NOT EXISTS idx_deals_source     ON deals(source);
