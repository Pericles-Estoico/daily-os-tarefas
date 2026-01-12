// Tipos base do sistema OS Execução

export type SemaforoStatus = 'verde' | 'amarelo' | 'vermelho';
export type TaskStatus = 'todo' | 'doing' | 'done' | 'blocked';
export type Priority = 'normal' | 'high' | 'urgent';
export type Frequencia = 'diario' | 'semanal' | 'mensal';
export type Periodo = 'semana' | 'mes' | 'trimestre';
export type PointType = 'pena' | 'premio';
export type ExperimentDecision = 'duplicar' | 'iterar' | 'matar' | 'pendente';

export interface Owner {
  id: string;
  nome: string;
  cargo: string;
  avatarColor: string;
}

export interface Sector {
  id: string;
  nome: string;
  ownerId: string;
}

export interface RoutineTask {
  id: string;
  sectorId: string;
  nome: string;
  horario: string;
  dod: string;
  checklist: { id: string; text: string; checked: boolean }[];
  evidencia: string;
  prioridade: Priority;
  status: TaskStatus;
  recorrencia: boolean;
  diasSemana: number[];
  pontosOnDone: number;
  pontosOnFail: number;
  isCritical: boolean;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface OKR {
  id: string;
  sectorId: string;
  titulo: string;
  descricao: string;
  ownerId: string;
  status: TaskStatus;
  periodo: Periodo;
  semaforo: SemaforoStatus;
}

export interface KR {
  id: string;
  okrId: string;
  nome: string;
  definicao: string;
  meta: number;
  frequencia: Frequencia;
  valorAtual: number;
  semaforo: SemaforoStatus;
  fonte: string;
  evidencia: string;
  notes: string;
}

export interface Incident {
  id: string;
  sectorId: string;
  titulo: string;
  descricao: string;
  evidencia: string;
  causaRaiz: string;
  acaoCorretiva: string;
  ownerId: string;
  prazo: string;
  prioridade: Priority;
  status: TaskStatus;
  validacao: { id: string; text: string; checked: boolean }[];
  createdAt: string;
}

export interface Experiment {
  id: string;
  titulo: string;
  hipotese: string;
  variavel: string;
  ownerId: string;
  metricaSucesso: string;
  resultado: string;
  decisao: ExperimentDecision;
  evidencia: string;
  dataInicio: string;
  dataFim: string;
  status: TaskStatus;
}

export interface ScoreEntry {
  id: string;
  date: string;
  receita: number;
  pedidos: number;
  ticketMedio: number;
  margemBruta: number;
  gastoMidia: number;
  cpa: number;
  semaforoGeral: SemaforoStatus;
  observacoes: string;
  evidenciaLinks: string[];
}

export interface WeeklyCanvas {
  id: string;
  weekStart: string;
  weekEnd: string;
  metaDiaria: number;
  metaSemanal: number;
  metaMensal: number;
  ofertaAncora: string;
  ticketAlvo: number;
  margemAlvo: number;
  drivers: Record<string, string>;
  checklistSemanal: { id: string; text: string; checked: boolean }[];
  testesSemana: string[];
  pedrasTop3: string[];
  decisoesCEO: { decisao: string; aprovado: boolean; proximoPasso: string }[];
  recompensaPenaSemana: string;
}

export interface PointsLedger {
  id: string;
  date: string;
  tipo: PointType;
  referenciaType: 'routine' | 'okr' | 'kr' | 'incident';
  referenciaId: string;
  pontos: number;
  ownerId: string;
  motivo: string;
}

export interface WorkspaceConfig {
  nome: string;
  metaDiaria: number;
  moeda: string;
  toleranciaSemaforo: number;
  isOnboarded: boolean;
}

export interface AppState {
  config: WorkspaceConfig;
  owners: Owner[];
  sectors: Sector[];
  routineTasks: RoutineTask[];
  okrs: OKR[];
  krs: KR[];
  incidents: Incident[];
  experiments: Experiment[];
  scoreEntries: ScoreEntry[];
  weeklyCanvas: WeeklyCanvas[];
  pointsLedger: PointsLedger[];
}
