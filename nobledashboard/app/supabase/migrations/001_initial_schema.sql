-- Initial schema for Deal Management System (商談管理システム)
-- 3テーブル構造: deals(商談) → customers(顧客) → payments(入金)

-- ========== マスタテーブル ==========

CREATE TABLE m_users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('sales', 'admin_staff', 'manager')),
  email VARCHAR(200) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE m_sources (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE m_statuses (
  code VARCHAR(30) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('interview', 'result', 'contract_confirm', 'contract', 'support', 'payment')),
  sort_order INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE m_plans (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- ========== 商談管理テーブル (deals) ==========

CREATE TABLE deals (
  id VARCHAR(20) PRIMARY KEY,
  assigned_to VARCHAR(50) NOT NULL REFERENCES m_users(id),
  deal_month VARCHAR(7) NOT NULL,
  deal_date DATE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  prospect_level VARCHAR(30),
  source VARCHAR(50) NOT NULL,
  referrer VARCHAR(100),
  agency_type VARCHAR(10),
  interview_status VARCHAR(30) NOT NULL,
  result_status VARCHAR(20),
  contract_confirm VARCHAR(20),
  contract_date DATE,
  proposal_content VARCHAR(200),
  amount INT,
  retirement_date DATE NOT NULL,
  next_action_date DATE,
  deal_notes TEXT,
  recording_url TEXT,
  hr_proposal VARCHAR(20),
  hr_feasibility VARCHAR(20),
  hr_reason TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by VARCHAR(50) NOT NULL REFERENCES m_users(id),
  updated_by VARCHAR(50) NOT NULL REFERENCES m_users(id)
);

-- ========== 顧客管理テーブル (customers) ==========

CREATE TABLE customers (
  customer_id VARCHAR(20) PRIMARY KEY,
  deal_id VARCHAR(20) REFERENCES deals(id),
  sim_number VARCHAR(50),
  contract_month VARCHAR(7) NOT NULL,
  deal_date DATE NOT NULL,
  assigned_to VARCHAR(50) NOT NULL REFERENCES m_users(id),
  customer_name VARCHAR(100) NOT NULL,
  furigana VARCHAR(100) NOT NULL,
  payment_name VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(200),
  address TEXT,
  retirement_date DATE,
  contract_plan VARCHAR(50) NOT NULL,
  payment_plan VARCHAR(20) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  contract_amount INT NOT NULL,
  payment_count INT,
  payment_notes TEXT,
  contract_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  support_status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
  customer_notes TEXT,
  contract_signed BOOLEAN NOT NULL DEFAULT false,
  contract_date DATE,
  payment_guide_sent BOOLEAN NOT NULL DEFAULT false,
  first_payment_due DATE,
  orientation_date DATE,
  pre_survey_sent BOOLEAN NOT NULL DEFAULT false,
  total_paid INT DEFAULT 0,
  payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
  subsequent_pay_due DATE,
  source VARCHAR(50),
  referrer_1 VARCHAR(100),
  referral_fee_1 INT,
  referrer_2 VARCHAR(100),
  referral_fee_2 INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by VARCHAR(50) NOT NULL REFERENCES m_users(id),
  updated_by VARCHAR(50) NOT NULL REFERENCES m_users(id)
);

-- ========== 入金管理テーブル (payments) ==========

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(20) NOT NULL REFERENCES customers(customer_id),
  payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
  contract_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  support_status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
  payment_name VARCHAR(100),
  payment_plan VARCHAR(20) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  payment_count INT,
  paid_count INT DEFAULT 0,
  payment_notes TEXT,
  unpaid_amount INT DEFAULT 0,
  paid_amount INT DEFAULT 0,
  first_payment_notified BOOLEAN NOT NULL DEFAULT false,
  installment_notice_status VARCHAR(20),
  payment_due_date DATE,
  installment_schedule VARCHAR(100),
  next_billing_addition INT DEFAULT 0,
  total_late_fee INT DEFAULT 0,
  cancellation_fee INT DEFAULT 0,
  refund_amount INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by VARCHAR(50) NOT NULL REFERENCES m_users(id),
  updated_by VARCHAR(50) NOT NULL REFERENCES m_users(id)
);

-- ========== 補助テーブル ==========

CREATE TABLE agency_commissions (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(20) NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  agency_code VARCHAR(20) NOT NULL REFERENCES m_agencies(code),
  trigger_amount INT,
  commission_amount INT,
  status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deal_status_history (
  id SERIAL PRIMARY KEY,
  deal_id VARCHAR(20) NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  changed_by VARCHAR(50) NOT NULL REFERENCES m_users(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  comment TEXT
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  deal_id VARCHAR(20) REFERENCES deals(id) ON DELETE CASCADE,
  customer_id VARCHAR(20) REFERENCES customers(customer_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========== インデックス ==========

CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX idx_deals_interview_status ON deals(interview_status);
CREATE INDEX idx_deals_result_status ON deals(result_status);
CREATE INDEX idx_deals_retirement_date ON deals(retirement_date);
CREATE INDEX idx_deals_deal_month ON deals(deal_month);

CREATE INDEX idx_customers_assigned_to ON customers(assigned_to);
CREATE INDEX idx_customers_contract_status ON customers(contract_status);
CREATE INDEX idx_customers_payment_status ON customers(payment_status);
CREATE INDEX idx_customers_deal_id ON customers(deal_id);

CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_payment_status ON payments(payment_status);
CREATE INDEX idx_payments_payment_due_date ON payments(payment_due_date);

CREATE INDEX idx_agency_commissions_customer_id ON agency_commissions(customer_id);
CREATE INDEX idx_deal_status_history_deal_id ON deal_status_history(deal_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ========== シードデータ ==========

INSERT INTO m_users (id, name, role, email) VALUES
('USR001', '市岡', 'sales', 'ichioka@company.com'),
('USR002', '田中', 'admin_staff', 'tanaka@company.com'),
('USR003', '青木', 'sales', 'aoki@company.com'),
('USR004', '西山', 'manager', 'nishiyama@company.com');

INSERT INTO m_sources (code, name) VALUES
('WEB_META', 'WEBシーズ_Meta'),
('GOOGLE_ADS', 'Googleリスティング'),
('TIKTOK', 'TikTok'),
('DIRECT_LINE', '直LINE'),
('REFERRAL', '紹介'),
('PHONE', '電話');

INSERT INTO m_plans (code, name, description, price) VALUES
('PLAN_10M', '10ヶ月プラン', '10ヶ月の給付金サポートプラン', 330000),
('PLAN_28M', '28ヶ月プラン', '28ヶ月の給付金サポートプラン', 550000),
('PLAN_28M_SPLIT', '28ヶ月分割プラン', '28ヶ月の分割払いプラン', 660000);

INSERT INTO m_agencies (code, name, contact, commission_rate) VALUES
('AG001', '代理店A', '浦川聖哉', 0.25),
('AG002', '代理店B', '高山優希', 0.25);
