// ============================================
// Supabase Database Types
// Auto-generated from schema
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================
// Enums
// ============================================
export type MarketplacePriority = 'P0' | 'P1' | 'P2' | 'P3';
export type MarketplaceStage = 'SCALE' | 'SETUP_SPRINT' | 'RECOVER' | 'WEEKLY' | 'PAUSED';
export type MarketplaceCadence = 'DAILY' | 'WEEKLY' | 'SETUP_SPRINT' | 'RECOVER_SPRINT';
export type ProductTypeStrategy = 'SINGLE' | 'KIT' | 'BOTH';
export type TaskType = 'GLOBAL' | 'HIGIENE' | 'PROTECAO' | 'CRESCIMENTO' | 'ESTRATEGIA' | 'SETUP';
export type TaskSeverity = 'NORMAL' | 'CRITICA';
export type TaskStatus = 'TODO' | 'DOING' | 'DONE' | 'SKIPPED';
export type IncidentSeverity = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type IncidentStatus = 'A_FAZER' | 'EM_PROGRESSO' | 'RESOLVIDO';
export type PointSource = 'TASK_DONE' | 'TASK_SKIPPED' | 'INCIDENT_RESOLVED' | 'MANUAL';
export type TestDecision = 'MANTER' | 'MATAR' | 'PENDENTE';
export type AppRole = 'ADMIN' | 'MEMBER';

// ============================================
// Table Row Types
// ============================================
export interface Owner {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string | null;
  is_manager: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  owner_id: string;
  role: AppRole;
  created_at: string;
}

export interface Marketplace {
  id: string;
  name: string;
  slug: string;
  priority: MarketplacePriority;
  stage: MarketplaceStage;
  cadence: MarketplaceCadence;
  owner_id: string | null;
  is_selling: boolean;
  active: boolean;
  notes: string | null;
  playbook_markdown: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  sku: string;
  name: string;
  category: string | null;
  type_strategy: ProductTypeStrategy;
  is_champion: boolean;
  notes: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface KpiDaily {
  id: string;
  date_iso: string;
  marketplace_id: string;
  gmv: number;
  orders: number;
  items: number | null;
  ticket_avg: number | null;
  cancel_rate: number | null;
  sla_minutes: number | null;
  rating: number | null;
  evidence_links: string[];
  note: string | null;
  created_at: string;
}

export interface SalesBySku {
  id: string;
  date_start: string;
  date_end: string;
  marketplace_id: string;
  sku: string | null;
  revenue: number;
  qty: number;
  orders: number;
  list_price: number | null;
  discounts_total: number | null;
  fees_total: number | null;
  net_revenue: number | null;
  notes: string | null;
  created_at: string;
}

export interface TaskTemplate {
  id: string;
  title: string;
  marketplace_id: string | null;
  owner_id: string;
  time_hhmm: string;
  type: TaskType;
  severity: TaskSeverity;
  days_of_week: number[];
  dod: string | null;
  is_critical: boolean;
  require_evidence: boolean;
  active: boolean;
  description: string | null;
  steps: { label: string; required: boolean }[];
  expected_minutes: number;
  tools_links: string[];
  when_to_open_incident: string | null;
  escalation_rule: string | null;
  points: number;
  penalty_points: number;
  created_at: string;
  updated_at: string;
}

export interface TaskInstance {
  id: string;
  template_id: string | null;
  date_iso: string;
  time_hhmm: string;
  title: string;
  marketplace_id: string | null;
  owner_id: string;
  type: TaskType;
  status: TaskStatus;
  is_critical: boolean;
  require_evidence: boolean;
  dod: string | null;
  description: string | null;
  evidence_url: string | null;
  completed_at: string | null;
  skipped_reason: string | null;
  points_awarded: number | null;
  steps_state: { label: string; checked: boolean }[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  marketplace_id: string;
  owner_id: string;
  severity: IncidentSeverity;
  title: string;
  description: string | null;
  evidence_links: string[];
  root_cause: string | null;
  corrective_action: string | null;
  validation_tests: { label: string; done: boolean }[];
  status: IncidentStatus;
  due_date: string | null;
  auto_created: boolean;
  created_at: string;
  updated_at: string;
}

export interface Points {
  id: string;
  owner_id: string;
  date_iso: string;
  points: number;
  reason: string | null;
  source: PointSource;
  created_at: string;
}

export interface Objective {
  id: string;
  title: string;
  owner_id: string | null;
  due_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface KeyResult {
  id: string;
  objective_id: string;
  metric_name: string;
  unit: string | null;
  baseline: number;
  target: number;
  current: number;
  created_at: string;
  updated_at: string;
}

export interface Test {
  id: string;
  marketplace_id: string;
  owner_id: string;
  hypothesis: string | null;
  change: string | null;
  date_start: string | null;
  date_end: string | null;
  result: string | null;
  decision: TestDecision;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  id: number;
  current_owner_id: string | null;
  app_version: string;
  last_import_date: string | null;
  daily_goal: number;
  monthly_goal: number;
  updated_at: string;
}

// ============================================
// Database Schema
// ============================================
export interface Database {
  public: {
    Tables: {
      owners: {
        Row: Owner;
        Insert: Omit<Owner, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<Owner, 'id'>>;
      };
      user_roles: {
        Row: UserRole;
        Insert: Omit<UserRole, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<UserRole, 'id'>>;
      };
      marketplaces: {
        Row: Marketplace;
        Insert: Omit<Marketplace, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<Marketplace, 'id'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<Product, 'sku'>>;
      };
      kpi_daily: {
        Row: KpiDaily;
        Insert: Omit<KpiDaily, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<KpiDaily, 'id'>>;
      };
      sales_by_sku: {
        Row: SalesBySku;
        Insert: Omit<SalesBySku, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<SalesBySku, 'id'>>;
      };
      task_templates: {
        Row: TaskTemplate;
        Insert: Omit<TaskTemplate, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<TaskTemplate, 'id'>>;
      };
      task_instances: {
        Row: TaskInstance;
        Insert: Omit<TaskInstance, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<TaskInstance, 'id'>>;
      };
      incidents: {
        Row: Incident;
        Insert: Omit<Incident, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<Incident, 'id'>>;
      };
      points: {
        Row: Points;
        Insert: Omit<Points, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Points, 'id'>>;
      };
      objectives: {
        Row: Objective;
        Insert: Omit<Objective, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<Objective, 'id'>>;
      };
      key_results: {
        Row: KeyResult;
        Insert: Omit<KeyResult, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<KeyResult, 'id'>>;
      };
      tests: {
        Row: Test;
        Insert: Omit<Test, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<Test, 'id'>>;
      };
      app_settings: {
        Row: AppSettings;
        Insert: Omit<AppSettings, 'updated_at'> & { updated_at?: string };
        Update: Partial<Omit<AppSettings, 'id'>>;
      };
    };
    Enums: {
      marketplace_priority: MarketplacePriority;
      marketplace_stage: MarketplaceStage;
      marketplace_cadence: MarketplaceCadence;
      product_type_strategy: ProductTypeStrategy;
      task_type: TaskType;
      task_severity: TaskSeverity;
      task_status: TaskStatus;
      incident_severity: IncidentSeverity;
      incident_status: IncidentStatus;
      point_source: PointSource;
      test_decision: TestDecision;
      app_role: AppRole;
    };
  };
}
