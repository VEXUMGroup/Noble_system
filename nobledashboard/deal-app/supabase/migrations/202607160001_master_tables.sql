-- 202607160001_master_tables.sql
-- 目的：
--   1) 4つのマスタ（m_users / m_sources / m_plans / m_agencies）に対する
--      フロントエンドからのCRUDを成立させる
--   2) updated_at の自動更新トリガを共通化
--   3) 開発用にRLSは無効化（本番投入時に再設計する想定）
--
-- 前提：
--   001_initial_schema.sql 適用後に流す。冪等になるよう IF [NOT] EXISTS / OR REPLACE を使用。

-- =========================================
-- 1. updated_at 自動更新の共通トリガ関数
-- =========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 2. マスタ4テーブルにトリガを付与
-- =========================================
DROP TRIGGER IF EXISTS trg_m_users_updated_at ON m_users;
CREATE TRIGGER trg_m_users_updated_at
  BEFORE UPDATE ON m_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_m_sources_updated_at ON m_sources;
CREATE TRIGGER trg_m_sources_updated_at
  BEFORE UPDATE ON m_sources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_m_plans_updated_at ON m_plans;
CREATE TRIGGER trg_m_plans_updated_at
  BEFORE UPDATE ON m_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_m_agencies_updated_at ON m_agencies;
CREATE TRIGGER trg_m_agencies_updated_at
  BEFORE UPDATE ON m_agencies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================
-- 3. 並び順カラム（マスタ画面の表示順用）
--    m_sources / m_plans / m_agencies に sort_order を追加
--    （m_statuses にはすでに存在、m_users はロール+名前順で十分なので追加しない）
-- =========================================
ALTER TABLE m_sources  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE m_plans    ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE m_agencies ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- =========================================
-- 4. 開発用：RLSを無効化（マスタ画面で anon キーから直接CRUDするため）
--    本番では RLS を有効化し、role に応じたポリシーを別途追加すること
-- =========================================
ALTER TABLE m_users    DISABLE ROW LEVEL SECURITY;
ALTER TABLE m_sources  DISABLE ROW LEVEL SECURITY;
ALTER TABLE m_plans    DISABLE ROW LEVEL SECURITY;
ALTER TABLE m_agencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE m_statuses DISABLE ROW LEVEL SECURITY;

-- =========================================
-- 5. マスタ取得用インデックス（is_active による絞り込みが頻発するため）
-- =========================================
CREATE INDEX IF NOT EXISTS idx_m_users_active     ON m_users(is_active);
CREATE INDEX IF NOT EXISTS idx_m_sources_active   ON m_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_m_plans_active     ON m_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_m_agencies_active  ON m_agencies(is_active);
