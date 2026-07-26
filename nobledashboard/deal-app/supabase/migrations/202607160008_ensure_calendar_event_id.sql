-- 202607160008_ensure_calendar_event_id.sql
-- 目的:
--   既存DBで deals.calendar_event_id が欠けている環境を補正する。
--   以前の migration history repair により 20260521 系が applied 扱いでも、
--   列と一意インデックスはこの migration で冪等に保証する。

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_deals_calendar_event_id
  ON deals(calendar_event_id)
  WHERE calendar_event_id IS NOT NULL;
