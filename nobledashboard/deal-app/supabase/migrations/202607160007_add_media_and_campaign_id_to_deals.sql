-- 202607160007_add_media_and_campaign_id_to_deals.sql
-- 目的:
--   顧客情報として「媒体」と「キャンペーンID」を deals に保存できるようにする。

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS media VARCHAR(100);

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(200);

CREATE INDEX IF NOT EXISTS idx_deals_media ON deals(media);
CREATE INDEX IF NOT EXISTS idx_deals_campaign_id ON deals(campaign_id);
