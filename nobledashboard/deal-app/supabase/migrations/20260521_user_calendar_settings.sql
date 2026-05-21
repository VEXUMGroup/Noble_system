-- ユーザーごとの iCal URL を保存するテーブル
create table if not exists user_calendar_settings (
  user_id  text primary key,
  ical_url text not null,
  updated_at timestamptz not null default now()
);

-- RLS は使わず、サーバーサイドの admin client のみからアクセス
alter table user_calendar_settings enable row level security;

-- サービスロール（admin）は全操作可能
create policy "service role full access"
  on user_calendar_settings
  for all
  to service_role
  using (true)
  with check (true);
