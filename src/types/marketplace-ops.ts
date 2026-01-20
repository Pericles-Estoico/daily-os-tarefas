// ============================================
// Marketplace Ops OS - Type Definitions
// v1.0 - Frontend Only
// ============================================

// ============================================
// 1. OWNER (Personas / User)
// ============================================
export interface Owner {
  id: string;
  name: string;
  role: string;
  initials: string;
  color?: string;
  isManager: boolean; // Péricles = true, can edit descriptions/templates
  active: boolean;
}

// ============================================
// 2. MARKETPLACE
// ============================================
export type MarketplacePriority = 'P0' | 'P1' | 'P2' | 'P3';
export type MarketplaceStage = 'SCALE' | 'SETUP_SPRINT' | 'RECOVER' | 'WEEKLY' | 'PAUSED';
export type MarketplaceCadence = 'DAILY' | 'WEEKLY' | 'SETUP_SPRINT' | 'RECOVER_SPRINT';

export interface Marketplace {
  id: string;
  name: string;
  slug: string; // ex: "mercado_livre_matriz"
  priority: MarketplacePriority;
  stage: MarketplaceStage;
  cadence: MarketplaceCadence;
  ownerId: string;
  isSelling: boolean;
  active: boolean;
  notes: string;
  playbookMarkdown: string;
}

// ============================================
// 3. PRODUCT (SKU)
// ============================================
export type ProductTypeStrategy = 'SINGLE' | 'KIT' | 'BOTH';

export interface Product {
  sku: string;
  name: string;
  category: string;
  typeStrategy: ProductTypeStrategy;
  isChampion: boolean;
  notes: string;
}

// ============================================
// 4. KPI DIÁRIO (por marketplace)
// ============================================
export interface KPIDaily {
  dateISO: string;
  marketplaceId: string;
  gmv: number;
  orders: number;
  items?: number;
  ticketAvg?: number;
  cancelRate?: number;
  slaMinutes?: number;
  rating?: number;
  evidenceLinks: string[];
  note: string;
}

// ============================================
// 5. SALES BY SKU (janela)
// ============================================
export interface SalesBySKU {
  dateStart: string;
  dateEnd: string;
  marketplaceId: string;
  sku: string;
  revenue: number;
  qty: number;
  orders: number;
  listPrice?: number;
  discountsTotal?: number;
  feesTotal?: number;
  netRevenue?: number;
  notes?: string;
}

// ============================================
// 6. DAILY ANALYSIS (Análise Inteligente)
// ============================================
export interface DailyAnalysis {
  dateISO: string;
  goalDaily: number;
  totalGMV: number;
  totalOrders: number;
  totalItems: number;
  goalReached: boolean;
  percentOfGoal: number;
  
  marketplaceBreakdown: {
    marketplaceId: string;
    gmv: number;
    orders: number;
    items: number;
    percentOfTotal: number;
  }[];
  
  topProducts: {
    sku: string;
    revenue: number;
    qty: number;
    percentOfTotal: number;
  }[];
  
  autoIncidents: {
    severity: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    marketplaceId: string;
    issue: string;
    suggestion: string;
  }[];
  
  evolution: {
    vsYesterday?: number;
    vsLastWeek?: number;
    monthProjection?: number;
  };
  
  analyzed: boolean;
  analyzedAt: string | null;
}

// ============================================
// 7. DAILY IMPORT SESSION (Sessão de Import)
// ============================================
export interface DailyImportSession {
  dateISO: string;
  goalDaily: number;
  importedMarketplaces: string[];
  pendingMarketplaces: string[];
  totalGMV: number;
  completed: boolean;
  completedAt: string | null;
}

// ============================================
// 8. TASK TEMPLATE
// ============================================
export type TaskType = 'GLOBAL' | 'HIGIENE' | 'PROTECAO' | 'CRESCIMENTO' | 'ESTRATEGIA' | 'SETUP';
export type TaskSeverity = 'NORMAL' | 'CRITICA';

export interface TaskTemplateStep {
  label: string;
  required: boolean;
}

export interface TaskTemplate {
  id: string;
  title: string;
  marketplaceId: string | null; // null = "Global"
  ownerId: string; // OBRIGATÓRIO
  timeHHMM: string; // HH:mm format
  type: TaskType;
  severity: TaskSeverity;
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  DoD: string; // Definition of Done
  isCritical: boolean;
  requireEvidence: boolean;
  active: boolean;
  description: string; // Instrução completa editável por gestor
  steps: TaskTemplateStep[];
  expectedMinutes: number;
  toolsLinks: string[];
  whenToOpenIncident: string;
  escalationRule: string;
  points: number; // pontuação ao concluir
  penaltyPoints: number; // penalidade se falhar crítica
}

// ============================================
// 9. TASK INSTANCE
// ============================================
export type TaskStatus = 'TODO' | 'DOING' | 'DONE' | 'SKIPPED';

export interface TaskInstanceStepState {
  label: string;
  checked: boolean;
}

export interface TaskInstance {
  id: string;
  templateId: string | null;
  dateISO: string; // YYYY-MM-DD
  timeHHMM: string; // HH:mm
  title: string;
  marketplaceId: string | null;
  ownerId: string;
  type: TaskType;
  status: TaskStatus;
  isCritical: boolean;
  requireEvidence: boolean;
  DoD: string;
  description: string;
  evidenceUrl: string | null;
  completedAt: string | null; // datetime ISO
  skippedReason: string | null;
  pointsAwarded: number | null;
  stepsState: TaskInstanceStepState[];
  notes: string;
}

// ============================================
// 10. INCIDENTE
// ============================================
export type IncidentSeverity = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type IncidentStatus = 'A_FAZER' | 'EM_PROGRESSO' | 'RESOLVIDO';

export interface IncidentValidationTest {
  label: string;
  done: boolean;
}

export interface Incident {
  id: string;
  createdAt: string;
  marketplaceId: string;
  ownerId: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  evidenceLinks: string[];
  rootCause: string;
  correctiveAction: string;
  validationTests: IncidentValidationTest[];
  status: IncidentStatus;
  dueDate: string | null;
  autoCreated?: boolean;
}

// ============================================
// 11. PONTOS
// ============================================
export type PointSource = 'TASK_DONE' | 'TASK_SKIPPED' | 'INCIDENT_RESOLVED' | 'MANUAL';

export interface Points {
  ownerId: string;
  dateISO: string;
  points: number;
  reason: string;
  source: PointSource;
}

// ============================================
// 12. OKR
// ============================================
export interface Objective {
  id: string;
  title: string;
  ownerId: string;
  dueDate: string;
  description: string;
}

export interface KeyResult {
  id: string;
  objectiveId: string;
  metricName: string;
  unit: string;
  baseline: number;
  target: number;
  current: number;
}

// ============================================
// 13. TESTE
// ============================================
export type TestDecision = 'MANTER' | 'MATAR' | 'PENDENTE';

export interface Test {
  id: string;
  createdAt: string;
  marketplaceId: string;
  ownerId: string;
  hypothesis: string;
  change: string;
  dateStart: string;
  dateEnd: string;
  result: string;
  decision: TestDecision;
  notes: string;
}

// ============================================
// 14. SETTINGS
// ============================================
export interface Settings {
  currentOwnerId: string;
  appVersion: string;
  lastImportDate: string | null;
  dailyGoal: number;
}

// ============================================
// 15. APP STATE
// ============================================
// ============================================
// Import Staging Types
// ============================================

export interface StagedDailySales {
  id: string;
  marketplaceId: string;
  dateISO: string;
  fileName: string;
  sales: SalesBySKU[];
  uploadedAt: string;
}

export interface StagedDailySummary {
  dateISO: string;
  fileName: string;
  kpis: KPIDaily[];
  uploadedAt: string;
}

export interface ImportStaging {
  dailySales: StagedDailySales[];
  dailySummary: StagedDailySummary | null;
}

// ============================================
// App State
// ============================================

export interface AppState {
  owners: Owner[];
  marketplaces: Marketplace[];
  products: Product[];
  kpis: KPIDaily[];
  salesBySku: SalesBySKU[];
  templates: TaskTemplate[];
  tasks: TaskInstance[];
  incidents: Incident[];
  points: Points[];
  objectives: Objective[];
  keyResults: KeyResult[];
  tests: Test[];
  settings: Settings;
  dailyAnalyses: DailyAnalysis[];
  importSessions: DailyImportSession[];
  importStaging: ImportStaging;
}

// ============================================
// 16. DEFAULTS
// ============================================
export const DEFAULT_OWNERS: Owner[] = [
  { id: 'pericles', name: 'Péricles', role: 'CEO', initials: 'PC', color: '#8B5CF6', isManager: true, active: true },
  { id: 'stella', name: 'Stella', role: 'CFO', initials: 'ST', color: '#10B981', isManager: false, active: true },
  { id: 'walistter', name: 'Walistter', role: 'CMO', initials: 'WA', color: '#F59E0B', isManager: false, active: true },
  { id: 'elisangela', name: 'Elisangela', role: 'Gestora de marketing/vendas/marketplaces/CRM', initials: 'EL', color: '#EC4899', isManager: false, active: true },
];

export const DEFAULT_SETTINGS: Settings = {
  currentOwnerId: 'pericles',
  appVersion: '1.0.0',
  lastImportDate: null,
  dailyGoal: 10000,
};

export const INITIAL_APP_STATE: AppState = {
  owners: DEFAULT_OWNERS,
  marketplaces: [],
  products: [],
  kpis: [],
  salesBySku: [],
  templates: [],
  tasks: [],
  incidents: [],
  points: [],
  objectives: [],
  keyResults: [],
  tests: [],
  settings: DEFAULT_SETTINGS,
  dailyAnalyses: [],
  importSessions: [],
  importStaging: {
    dailySales: [],
    dailySummary: null,
  },
};
