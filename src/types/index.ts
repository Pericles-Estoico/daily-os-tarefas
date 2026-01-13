// ============= OS Marketplaces — Execução 10K/DIA =============

// Enums e tipos base
export type MarketplacePriority = 'P0' | 'P1' | 'P2' | 'P3';
export type MarketplaceStage = 'SCALE' | 'SETUP' | 'RECOVER' | 'PAUSED';
export type MarketplaceCadence = 'DAILY' | 'WEEKLY' | 'SETUP_SPRINT' | 'RECOVER';
export type TaskType = 'HIGIENE' | 'PROTECAO' | 'CRESCIMENTO' | 'SETUP' | 'ATIVACAO' | 'WEEKLY';
export type TaskStatus = 'TODO' | 'DOING' | 'DONE' | 'SKIPPED';
export type SemaforoStatus = 'GREEN' | 'YELLOW' | 'RED';
export type IncidentSeverity = 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'VALIDATED';
export type ExperimentStatus = 'RUNNING' | 'WON' | 'LOST' | 'ITERATE' | 'KILLED';
export type ExperimentDecision = 'DUPLICAR' | 'ITERAR' | 'MATAR' | null;
export type PointType = 'PENA' | 'PREMIO';
export type WorkSchedule = 'ALL_DAYS' | 'WEEKDAYS';

// Owners
export interface Owner {
  id: string;
  nome: string;
  cargo: string;
  avatarColor: string;
  schedule: WorkSchedule;
}

// Marketplaces
export interface MarketplaceModules {
  crm: boolean;
  paidAds: boolean;
  supportSla: boolean;
  live: boolean;
  affiliates: boolean;
}

export interface Marketplace {
  id: string;
  name: string;
  priority: MarketplacePriority;
  stage: MarketplaceStage;
  isSelling: boolean;
  cadence: MarketplaceCadence;
  ownerId: string;
  modulesEnabled: MarketplaceModules;
  cutoffTime: string;
  notes: string;
  createdAt: string;
}

// Step for checklist
export interface TaskStep {
  id: string;
  text: string;
  completed: boolean;
}

// Routine Tasks
export interface RoutineTask {
  id: string;
  marketplaceId: string | null; // null = tarefa global
  ownerId: string; // Dono da tarefa (obrigatório)
  cadence: MarketplaceCadence;
  time: string;
  type: TaskType;
  title: string;
  dod: string;
  // Novos campos operacionais (editáveis somente pelo gestor)
  description: string; // Descrição operacional (markdown)
  steps: TaskStep[]; // Checklist de passos
  inputs: string[]; // O que precisa antes de começar
  outputs: string[]; // O que entrega ao final
  commonMistakes: string[]; // Erros comuns a evitar
  timeboxMinutes: number; // Tempo estimado em minutos
  toolsLinks: { label: string; url: string }[]; // Links úteis
  evidenceExamples: string[]; // Exemplos de evidência aceitos
  escalationRule: string; // Regra de escalonamento
  // Campos de execução (editáveis pelo dono)
  evidenceRequired: boolean;
  critical: boolean;
  points: number;
  status: TaskStatus;
  evidenceLinks: string[];
  completedAt: string | null;
  completedByOwnerId: string | null;
  skipReason: string | null;
  date: string;
  createdAt: string;
}

// KPI Entries (por dia e marketplace)
export interface KPIValues {
  gmv: number;
  pedidos: number;
  ticketMedio: number;
  sessoes: number;
  conversao: number;
  itensVendidos: number;
  reputacao: number;
  slaExpedicao: number;
  // SETUP específicos
  catalogoAtivo?: number;
  checkoutOk?: boolean;
  primeiraVenda?: boolean;
}

export interface KPIEntry {
  id: string;
  date: string;
  marketplaceId: string;
  stageSnapshot: MarketplaceStage;
  values: KPIValues;
  semaforo: SemaforoStatus;
  notes: string;
  evidenceLinks: string[];
}

// Incidents (Pedras)
export type IncidentTag = 'checkout' | 'sla' | 'reputation' | 'rupture' | 'ads' | 'price' | 'other';

export interface Incident {
  id: string;
  marketplaceId: string | null;
  createdAt: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  triggerRule: string;
  ownerId: string;
  status: IncidentStatus;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  validationEvidenceLinks: string[];
  dueDate: string;
  tags: IncidentTag[];
}

// Experiments/Tests
export interface Experiment {
  id: string;
  marketplaceId: string | null;
  hypothesis: string;
  variable: string;
  metric: string;
  successCriteria: string;
  startDate: string;
  endDate: string | null;
  status: ExperimentStatus;
  resultNotes: string;
  evidenceLinks: string[];
  decision: ExperimentDecision;
  ownerId: string;
}

// Score semanal
export interface OwnerScore {
  ownerId: string;
  points: number;
  tasksCompleted: number;
  tasksMissed: number;
  criticalCompleted: number;
  criticalMissed: number;
}

export interface MarketplaceScore {
  marketplaceId: string;
  points: number;
  tasksCompleted: number;
  gmvTotal: number;
  incidentsOpen: number;
}

export interface ScoreWeek {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  ownerScores: OwnerScore[];
  marketplaceScores: MarketplaceScore[];
  penaltiesRewardsNotes: string;
  finalDecision: string;
}

// Points Ledger
export interface PointsLedger {
  id: string;
  date: string;
  tipo: PointType;
  referenciaType: 'routine' | 'kpi' | 'incident' | 'experiment';
  referenciaId: string;
  pontos: number;
  ownerId: string;
  marketplaceId: string | null;
  motivo: string;
}

// Workspace Config
export interface ModulesConfig {
  crm: boolean;
  paidAds: boolean;
  live: boolean;
  affiliates: boolean;
}

export interface WorkspaceConfig {
  nome: string;
  metaDiaria: number;
  moeda: string;
  isOnboarded: boolean;
  modulesEnabled: ModulesConfig;
  currentUserId: string | null; // Usuário atual (simulação)
  restrictViewToCurrentUser: boolean; // Restringir visão ao usuário atual
  globalTasksVisibleTo: 'CEO' | 'ALL'; // Quem pode ver tarefas globais
  scoreRules: {
    criticalTaskDone: number;
    normalTaskDone: number;
    criticalMissed: number;
    normalMissed: number;
  };
}

// Task Templates (recorrência mensal)
export type WeekDay = 'seg' | 'ter' | 'qua' | 'qui' | 'sex';

export interface TaskTemplate {
  id: string;
  marketplaceId: string | null;
  ownerId: string;
  time: string;
  type: TaskType;
  title: string;
  dod: string;
  // Campos operacionais detalhados (editáveis somente pelo gestor)
  description: string;
  steps: TaskStep[];
  inputs: string[];
  outputs: string[];
  commonMistakes: string[];
  timeboxMinutes: number;
  toolsLinks: { label: string; url: string }[];
  evidenceExamples: string[];
  escalationRule: string;
  // Campos de configuração
  evidenceRequired: boolean;
  critical: boolean;
  points: number;
  weekDays: WeekDay[];
  isActive: boolean;
  createdAt: string;
}

export interface TaskInstance extends RoutineTask {
  templateId: string;
  monthKey: string; // 'YYYY-MM' para identificar o mês
}

// App State
export interface AppState {
  config: WorkspaceConfig;
  owners: Owner[];
  marketplaces: Marketplace[];
  routineTasks: RoutineTask[];
  taskTemplates: TaskTemplate[];
  kpiEntries: KPIEntry[];
  incidents: Incident[];
  experiments: Experiment[];
  scoreWeeks: ScoreWeek[];
  pointsLedger: PointsLedger[];
  lastMonthGenerated: string | null; // 'YYYY-MM' do último mês gerado
}
