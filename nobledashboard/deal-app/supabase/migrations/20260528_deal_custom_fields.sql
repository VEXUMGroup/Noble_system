-- 20260528_deal_custom_fields.sql
-- 目的：
--   商談(deals)のカスタム項目（定義 + 値）を管理画面から設定できるようにする。
--   定義: deal_custom_fields
--   値: deals.custom_data (JSONB)

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS custom_data JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS deal_custom_fields (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  key_name      VARCHAR(50)  NOT NULL UNIQUE,
  field_type    VARCHAR(20)  NOT NULL CHECK (field_type IN ('text','number','date','select','checkbox')),
  options_json  JSONB DEFAULT NULL,
  required      BOOLEAN NOT NULL DEFAULT FALSE,
  order_index   INT NOT NULL DEFAULT 0,
  visible_roles JSONB NOT NULL DEFAULT '["manager"]'::jsonb,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_deal_custom_fields_updated_at ON deal_custom_fields;
CREATE TRIGGER trg_deal_custom_fields_updated_at
  BEFORE UPDATE ON deal_custom_fields
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_deal_custom_fields_order ON deal_custom_fields(order_index);
CREATE INDEX IF NOT EXISTS idx_deal_custom_fields_key_name ON deal_custom_fields(key_name);

-- JSONB検索のためのインデックス（必要になったら利用）
CREATE INDEX IF NOT EXISTS idx_deals_custom_data_gin ON deals USING GIN (custom_data);
