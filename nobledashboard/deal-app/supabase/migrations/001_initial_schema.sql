-- Initial schema for Deal Management System (商談管理システム)

-- Create m_users table
CREATE TABLE m_users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('sales', 'admin_staff', 'manager')),
  email VARCHAR(200) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create m_sources table
CREATE TABLE m_sources (
  code VARCHAR(30) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create m_statuses table
CREATE TABLE m_statuses (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  sort_order INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create m_plans table
CREATE TABLE m_plans (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create m_agencies table
CREATE TABLE m_agencies (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  contact VARCHAR(200),
  bank_info TEXT,
  commission_rate DECIMAL(5, 2) DEFAULT 0.25,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create deals table
CREATE TABLE deals (
  id VARCHAR(20) PRIMARY KEY,
  customer_name VARCHAR(200) NOT NULL,
  assigned_to VARCHAR(50) NOT NULL REFERENCES m_users(id),
  deal_date DATE NOT NULL,
  source VARCHAR(30) NOT NULL REFERENCES m_sources(code),
  media VARCHAR(100),
  campaign_id VARCHAR(200),
  status VARCHAR(20) NOT NULL REFERENCES m_statuses(code),
  retirement_date DATE,
  agency_code VARCHAR(20) REFERENCES m_agencies(code),
  memo TEXT,
  plan_code VARCHAR(20) REFERENCES m_plans(code),
  amount INT,
  payment_method VARCHAR(20),
  payment_deadline DATE,
  address TEXT,
  contract_date DATE,
  payment_status VARCHAR(20),
  total_paid INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by VARCHAR(50) NOT NULL REFERENCES m_users(id),
  updated_by VARCHAR(50) NOT NULL REFERENCES m_users(id)
);

-- Create agency_commissions table
CREATE TABLE agency_commissions (
  id SERIAL PRIMARY KEY,
  deal_id VARCHAR(20) NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  agency_code VARCHAR(20) NOT NULL REFERENCES m_agencies(code),
  trigger_amount INT,
  commission_amount INT,
  status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create deal_status_history table
CREATE TABLE deal_status_history (
  id SERIAL PRIMARY KEY,
  deal_id VARCHAR(20) NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  from_status VARCHAR(20) REFERENCES m_statuses(code),
  to_status VARCHAR(20) NOT NULL REFERENCES m_statuses(code),
  changed_by VARCHAR(50) NOT NULL REFERENCES m_users(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  comment TEXT
);

-- Create notifications table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  deal_id VARCHAR(20) REFERENCES deals(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX idx_deals_retirement_date ON deals(retirement_date);
CREATE INDEX idx_deals_agency_code ON deals(agency_code);
CREATE INDEX idx_agency_commissions_deal_id ON agency_commissions(deal_id);
CREATE INDEX idx_deal_status_history_deal_id ON deal_status_history(deal_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Insert sample seed data

-- Insert users
INSERT INTO m_users (id, name, role, email) VALUES
('USR001', '市岡', 'sales', 'ichioka@company.com'),
('USR002', '田中', 'admin_staff', 'tanaka@company.com'),
('USR003', '管理者', 'manager', 'admin@company.com');

-- Insert sources
INSERT INTO m_sources (code, name) VALUES
('WEB', 'Web'),
('REFERRAL', '紹介'),
('PHONE', '電話'),
('LINE', 'LINE');

-- Insert statuses
INSERT INTO m_statuses (code, name, sort_order) VALUES
('NEW', '新規', 1),
('INTERVIEWED', '面談済', 2),
('CONTRACTED', '成約', 3),
('CONSIDERING', '検討', 4),
('OUT_OF_SCOPE', '対象外', 5),
('DETAIL_ENTERED', '詳細入力済', 6),
('APPROVED', '事務承認済', 7),
('AWAITING_CONTRACT', '締結待ち', 8),
('CONTRACT_SIGNED', '締結済', 9),
('PAYMENT_MANAGING', '支払管理中', 10),
('COMPLETED', '完了', 11);

-- Insert plans
INSERT INTO m_plans (code, name, description, price) VALUES
('PLAN_10M', '10ヶ月プラン', '10ヶ月の給付金サポートプラン', 330000),
('PLAN_28M', '28ヶ月プラン', '28ヶ月の給付金サポートプラン', 550000),
('PLAN_28M_SPLIT', '28ヶ月分割プラン', '28ヶ月の分割払いプラン', 660000);

-- Insert agencies
INSERT INTO m_agencies (code, name, contact, commission_rate) VALUES
('AG001', '代理店A', '03-XXXX-XXXX', 0.25),
('AG002', '代理店B', '03-YYYY-YYYY', 0.25);

-- Insert sample deals
INSERT INTO deals (
  id, customer_name, assigned_to, deal_date, source, status,
  retirement_date, agency_code, memo, plan_code, amount,
  payment_method, payment_deadline, address, contract_date,
  payment_status, created_by, updated_by
) VALUES
('DEAL001', '田中太郎', 'USR001', '2026-04-01', 'WEB', 'INTERVIEWED',
 '2026-05-01', 'AG001', '初回面談完了', 'PLAN_10M', 330000,
 '銀行振込', '2026-05-15', '東京都渋谷区', NULL, NULL, 'USR001', 'USR001'),

('DEAL002', '佐藤花子', 'USR001', '2026-04-05', 'REFERRAL', 'CONTRACTED',
 '2026-06-01', 'AG002', '成約済み', 'PLAN_28M', 550000,
 '銀行振込', '2026-06-15', '東京都新宿区', '2026-04-10', 'PAYMENT_MANAGING', 'USR001', 'USR001'),

('DEAL003', '鈴木次郎', 'USR002', '2026-04-08', 'PHONE', 'DETAIL_ENTERED',
 '2026-07-01', NULL, '詳細情報入力完了待ち事務承認', 'PLAN_28M_SPLIT', 660000,
 '分割払い', '2026-07-20', '大阪府大阪市', NULL, NULL, 'USR002', 'USR002'),

('DEAL004', '加藤美咲', 'USR001', '2026-04-10', 'LINE', 'NEW',
 '2026-08-01', NULL, 'LINE経由の新規案件', NULL, NULL,
 NULL, NULL, '名古屋市中区', NULL, NULL, 'USR001', 'USR001'),

('DEAL005', '伊藤健二', 'USR003', '2026-03-15', 'WEB', 'COMPLETED',
 '2026-04-15', 'AG001', '完了案件', 'PLAN_10M', 330000,
 '銀行振込', '2026-04-20', '福岡県福岡市', '2026-03-20', 'COMPLETED', 'USR003', 'USR003');
