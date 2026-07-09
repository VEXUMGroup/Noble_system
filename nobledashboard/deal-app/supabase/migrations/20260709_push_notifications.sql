-- Web Push 通知と支払期日リマインドのための追加スキーマ

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS notification_key VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_notification_key
  ON notifications(notification_key);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  subscription JSONB NOT NULL,
  device_name TEXT,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_is_active
  ON push_subscriptions(is_active);

