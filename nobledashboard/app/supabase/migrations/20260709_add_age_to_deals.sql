-- 20260709_add_age_to_deals.sql
-- 目的:
--   deals の年齢情報をトップレベル列でも保持できるようにする。

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS age VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_deals_age ON deals(age);
