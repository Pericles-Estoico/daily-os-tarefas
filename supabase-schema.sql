-- ============================================
-- Marketplace Ops OS - Database Schema
-- Execute this in your Supabase SQL Editor
-- Project: hhnalonntmpfizalvfnu
-- ============================================

-- ============================================
-- PHASE 1: Create ENUMs
-- ============================================

CREATE TYPE marketplace_priority AS ENUM ('P0', 'P1', 'P2', 'P3');
CREATE TYPE marketplace_stage AS ENUM ('SCALE', 'SETUP_SPRINT', 'RECOVER', 'WEEKLY', 'PAUSED');
CREATE TYPE marketplace_cadence AS ENUM ('DAILY', 'WEEKLY', 'SETUP_SPRINT', 'RECOVER_SPRINT');
CREATE TYPE product_type_strategy AS ENUM ('SINGLE', 'KIT', 'BOTH');
CREATE TYPE task_type AS ENUM ('GLOBAL', 'HIGIENE', 'PROTECAO', 'CRESCIMENTO', 'ESTRATEGIA', 'SETUP');
CREATE TYPE task_severity AS ENUM ('NORMAL', 'CRITICA');
CREATE TYPE task_status AS ENUM ('TODO', 'DOING', 'DONE', 'SKIPPED');
CREATE TYPE incident_severity AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');
CREATE TYPE incident_status AS ENUM ('A_FAZER', 'EM_PROGRESSO', 'RESOLVIDO');
CREATE TYPE point_source AS ENUM ('TASK_DONE', 'TASK_SKIPPED', 'INCIDENT_RESOLVED', 'MANUAL');
CREATE TYPE test_decision AS ENUM ('MANTER', 'MATAR', 'PENDENTE');
CREATE TYPE app_role AS ENUM ('ADMIN', 'MEMBER');

-- ============================================
-- PHASE 2: Owners Table
-- ============================================

CREATE TABLE owners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  initials TEXT NOT NULL,
  color TEXT,
  is_manager BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_owners_active ON owners(active);

-- ============================================
-- PHASE 3: User Roles Table (Security)
-- ============================================

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT REFERENCES owners(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (owner_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION has_role(_owner_id TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE owner_id = _owner_id AND role = _role
  )
$$;

-- ============================================
-- PHASE 4: Marketplaces Table
-- ============================================

CREATE TABLE marketplaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  priority marketplace_priority NOT NULL DEFAULT 'P2',
  stage marketplace_stage NOT NULL DEFAULT 'SETUP_SPRINT',
  cadence marketplace_cadence NOT NULL DEFAULT 'DAILY',
  owner_id TEXT REFERENCES owners(id),
  is_selling BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  notes TEXT,
  playbook_markdown TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketplaces_priority ON marketplaces(priority);
CREATE INDEX idx_marketplaces_active ON marketplaces(active);

-- ============================================
-- PHASE 5: Products Table
-- ============================================

CREATE TABLE products (
  sku TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  type_strategy product_type_strategy DEFAULT 'SINGLE',
  is_champion BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_champion ON products(is_champion);
CREATE INDEX idx_products_category ON products(category);

-- ============================================
-- PHASE 6: KPI Daily Table
-- ============================================

CREATE TABLE kpi_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_iso DATE NOT NULL,
  marketplace_id TEXT REFERENCES marketplaces(id) ON DELETE CASCADE NOT NULL,
  gmv DECIMAL(12,2) NOT NULL DEFAULT 0,
  orders INTEGER NOT NULL DEFAULT 0,
  items INTEGER,
  ticket_avg DECIMAL(10,2),
  cancel_rate DECIMAL(5,2),
  sla_minutes INTEGER,
  rating DECIMAL(3,2),
  evidence_links JSONB DEFAULT '[]',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (date_iso, marketplace_id)
);

CREATE INDEX idx_kpi_daily_date ON kpi_daily(date_iso);
CREATE INDEX idx_kpi_daily_marketplace ON kpi_daily(marketplace_id);

-- ============================================
-- PHASE 7: Sales By SKU Table
-- ============================================

CREATE TABLE sales_by_sku (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  marketplace_id TEXT REFERENCES marketplaces(id) ON DELETE CASCADE NOT NULL,
  sku TEXT REFERENCES products(sku),
  revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  qty INTEGER NOT NULL DEFAULT 0,
  orders INTEGER NOT NULL DEFAULT 0,
  list_price DECIMAL(10,2),
  discounts_total DECIMAL(10,2),
  fees_total DECIMAL(10,2),
  net_revenue DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_sku ON sales_by_sku(sku);
CREATE INDEX idx_sales_marketplace ON sales_by_sku(marketplace_id);
CREATE INDEX idx_sales_dates ON sales_by_sku(date_start, date_end);

-- ============================================
-- PHASE 8: Task Templates Table
-- ============================================

CREATE TABLE task_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  marketplace_id TEXT REFERENCES marketplaces(id) ON DELETE SET NULL,
  owner_id TEXT REFERENCES owners(id) NOT NULL,
  time_hhmm TEXT NOT NULL,
  type task_type NOT NULL DEFAULT 'GLOBAL',
  severity task_severity NOT NULL DEFAULT 'NORMAL',
  days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  dod TEXT,
  is_critical BOOLEAN DEFAULT false,
  require_evidence BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  description TEXT,
  steps JSONB DEFAULT '[]',
  expected_minutes INTEGER DEFAULT 15,
  tools_links JSONB DEFAULT '[]',
  when_to_open_incident TEXT,
  escalation_rule TEXT,
  points INTEGER DEFAULT 10,
  penalty_points INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_active ON task_templates(active);
CREATE INDEX idx_templates_owner ON task_templates(owner_id);

-- ============================================
-- PHASE 9: Task Instances Table
-- ============================================

CREATE TABLE task_instances (
  id TEXT PRIMARY KEY,
  template_id TEXT REFERENCES task_templates(id) ON DELETE SET NULL,
  date_iso DATE NOT NULL,
  time_hhmm TEXT NOT NULL,
  title TEXT NOT NULL,
  marketplace_id TEXT REFERENCES marketplaces(id) ON DELETE SET NULL,
  owner_id TEXT REFERENCES owners(id) NOT NULL,
  type task_type NOT NULL DEFAULT 'GLOBAL',
  status task_status NOT NULL DEFAULT 'TODO',
  is_critical BOOLEAN DEFAULT false,
  require_evidence BOOLEAN DEFAULT false,
  dod TEXT,
  description TEXT,
  evidence_url TEXT,
  completed_at TIMESTAMPTZ,
  skipped_reason TEXT,
  points_awarded INTEGER,
  steps_state JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_date ON task_instances(date_iso);
CREATE INDEX idx_tasks_owner ON task_instances(owner_id);
CREATE INDEX idx_tasks_status ON task_instances(status);

-- ============================================
-- PHASE 10: Incidents Table
-- ============================================

CREATE TABLE incidents (
  id TEXT PRIMARY KEY,
  marketplace_id TEXT REFERENCES marketplaces(id) ON DELETE CASCADE NOT NULL,
  owner_id TEXT REFERENCES owners(id) NOT NULL,
  severity incident_severity NOT NULL DEFAULT 'MEDIA',
  title TEXT NOT NULL,
  description TEXT,
  evidence_links JSONB DEFAULT '[]',
  root_cause TEXT,
  corrective_action TEXT,
  validation_tests JSONB DEFAULT '[]',
  status incident_status NOT NULL DEFAULT 'A_FAZER',
  due_date DATE,
  auto_created BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_marketplace ON incidents(marketplace_id);

-- ============================================
-- PHASE 11: Points Table (Gamification)
-- ============================================

CREATE TABLE points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT REFERENCES owners(id) ON DELETE CASCADE NOT NULL,
  date_iso DATE NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT,
  source point_source NOT NULL DEFAULT 'MANUAL',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_points_owner ON points(owner_id);
CREATE INDEX idx_points_date ON points(date_iso);

-- ============================================
-- PHASE 12: Objectives Table (OKRs)
-- ============================================

CREATE TABLE objectives (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  owner_id TEXT REFERENCES owners(id),
  due_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHASE 13: Key Results Table (OKRs)
-- ============================================

CREATE TABLE key_results (
  id TEXT PRIMARY KEY,
  objective_id TEXT REFERENCES objectives(id) ON DELETE CASCADE NOT NULL,
  metric_name TEXT NOT NULL,
  unit TEXT,
  baseline DECIMAL(12,2) DEFAULT 0,
  target DECIMAL(12,2) NOT NULL,
  current DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kr_objective ON key_results(objective_id);

-- ============================================
-- PHASE 14: Tests Table (A/B Testing)
-- ============================================

CREATE TABLE tests (
  id TEXT PRIMARY KEY,
  marketplace_id TEXT REFERENCES marketplaces(id) ON DELETE CASCADE NOT NULL,
  owner_id TEXT REFERENCES owners(id) NOT NULL,
  hypothesis TEXT,
  change TEXT,
  date_start DATE,
  date_end DATE,
  result TEXT,
  decision test_decision DEFAULT 'PENDENTE',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tests_marketplace ON tests(marketplace_id);
CREATE INDEX idx_tests_decision ON tests(decision);

-- ============================================
-- PHASE 15: App Settings Table
-- ============================================

CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_owner_id TEXT REFERENCES owners(id),
  app_version TEXT DEFAULT '1.0.0',
  last_import_date DATE,
  daily_goal DECIMAL(12,2) DEFAULT 10000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHASE 16: Enable RLS on All Tables
-- ============================================

ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_by_sku ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PHASE 17: RLS Policies (Open for now)
-- ============================================

CREATE POLICY "Allow all operations" ON owners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON user_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON marketplaces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON kpi_daily FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON sales_by_sku FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON task_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON task_instances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON incidents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON points FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON objectives FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON key_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- PHASE 18: Insert Default Data
-- ============================================

-- Insert default owners
INSERT INTO owners (id, name, role, initials, color, is_manager, active) VALUES
  ('pericles', 'Péricles', 'CEO', 'PC', '#8B5CF6', true, true),
  ('stella', 'Stella', 'CFO', 'ST', '#10B981', false, true),
  ('walistter', 'Walistter', 'CMO', 'WA', '#F59E0B', false, true),
  ('elisangela', 'Elisangela', 'Gestora de marketing/vendas/marketplaces/CRM', 'EL', '#EC4899', false, true);

-- Insert user roles
INSERT INTO user_roles (owner_id, role) VALUES
  ('pericles', 'ADMIN'),
  ('stella', 'MEMBER'),
  ('walistter', 'MEMBER'),
  ('elisangela', 'MEMBER');

-- Insert default app settings
INSERT INTO app_settings (id, current_owner_id, daily_goal) 
VALUES (1, 'pericles', 10000);

-- ============================================
-- DONE! Your database is ready.
-- ============================================
