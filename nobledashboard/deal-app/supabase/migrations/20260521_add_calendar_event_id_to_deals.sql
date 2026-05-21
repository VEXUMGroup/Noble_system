ALTER TABLE deals ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS deal_notes TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_deals_calendar_event_id
  ON deals(calendar_event_id)
  WHERE calendar_event_id IS NOT NULL;
