-- ユーザーごとの iCal URL を保存するテーブル
create table if not exists user_calendar_settings (
  user_id  text primary key,
  ical_url text not null,
  updated_at timestamptz not null default now()
);

-- RLS は使わず、サーバーサイドの admin client のみからアクセス
alter table user_calendar_settings enable row level security;

-- サービスロール（admin）は全操作可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_calendar_settings'
      AND policyname = 'service role full access'
  ) THEN
    CREATE POLICY "service role full access"
      ON user_calendar_settings
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
