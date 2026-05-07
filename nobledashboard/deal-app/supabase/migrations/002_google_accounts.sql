-- Google OAuth token storage per user (minimal)

CREATE TABLE IF NOT EXISTS google_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE google_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'google_accounts'
      AND policyname = 'google_accounts_select_own'
  ) THEN
    CREATE POLICY google_accounts_select_own
      ON google_accounts
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'google_accounts'
      AND policyname = 'google_accounts_insert_own'
  ) THEN
    CREATE POLICY google_accounts_insert_own
      ON google_accounts
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'google_accounts'
      AND policyname = 'google_accounts_update_own'
  ) THEN
    CREATE POLICY google_accounts_update_own
      ON google_accounts
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

