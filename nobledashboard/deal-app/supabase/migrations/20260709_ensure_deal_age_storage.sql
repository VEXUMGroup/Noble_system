-- 20260709_ensure_deal_age_storage.sql
-- 目的:
--   年齢の保存先を本番DBでも確実に用意する。
--   既存環境では 20260528_deal_custom_fields.sql / 20260625_add_age_to_deals.sql が
--   未適用のまま運用されている可能性があるため、両方を冪等に保証する。

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS custom_data JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS age VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_deals_age ON deals(age);
CREATE INDEX IF NOT EXISTS idx_deals_custom_data_gin ON deals USING GIN (custom_data);

UPDATE deals
SET age = NULLIF(TRIM(custom_data->>'age'), '')
WHERE (age IS NULL OR TRIM(age) = '')
  AND custom_data ? 'age'
  AND NULLIF(TRIM(custom_data->>'age'), '') IS NOT NULL;

UPDATE deals
SET custom_data = jsonb_set(custom_data, '{age}', to_jsonb(age), true)
WHERE age IS NOT NULL
  AND TRIM(age) <> ''
  AND NULLIF(TRIM(custom_data->>'age'), '') IS NULL;
