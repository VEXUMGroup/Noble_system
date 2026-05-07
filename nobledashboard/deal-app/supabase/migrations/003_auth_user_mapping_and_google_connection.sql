ALTER TABLE m_users
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_m_users_auth_user_id
  ON m_users(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

ALTER TABLE m_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'm_users'
      AND policyname = 'm_users_select_self'
  ) THEN
    CREATE POLICY m_users_select_self
      ON m_users
      FOR SELECT
      TO authenticated
      USING (
        auth_user_id = auth.uid()
        OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'm_users'
      AND policyname = 'm_users_update_self_link'
  ) THEN
    CREATE POLICY m_users_update_self_link
      ON m_users
      FOR UPDATE
      TO authenticated
      USING (
        auth_user_id = auth.uid()
        OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      )
      WITH CHECK (
        auth_user_id = auth.uid()
        AND lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      );
  END IF;
END $$;

ALTER TABLE google_accounts
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS google_email TEXT,
  ADD COLUMN IF NOT EXISTS google_sub TEXT,
  ADD COLUMN IF NOT EXISTS scopes TEXT,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'google_accounts'
      AND policyname = 'google_accounts_delete_own'
  ) THEN
    CREATE POLICY google_accounts_delete_own
      ON google_accounts
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
