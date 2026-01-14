import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppState,
  Owner,
  Marketplace,
  Product,
  RoutineTask,
  TaskTemplate,
  KPIEntry,
  Incident,
  Experiment,
  ScoreWeek,
  PointsLedger,
  WorkspaceConfig,
} from '@/types';
import { generateSeedData } from './seedData';

interface AppStore extends AppState {
  // Config
  updateConfig: (config: Partial<WorkspaceConfig>) => void;
  completeOnboarding: () => void;
  
  // Owners CRUD
  addOwner: (owner: Owner) => void;
  updateOwner: (id: string, data: Partial<Owner>) => void;
  deleteOwner: (id: string) => void;
  
  // Marketplaces CRUD
  addMarketplace: (marketplace: Marketplace) => void;
  updateMarketplace: (id: string, data: Partial<Marketplace>) => void;
  deleteMarketplace: (id: string) => void;
  
  // Products CRUD
  addProduct: (product: Product) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Routine Tasks CRUD
  addRoutineTask: (task: RoutineTask) => void;
  updateRoutineTask: (id: string, data: Partial<RoutineTask>) => void;
  deleteRoutineTask: (id: string) => void;
  completeRoutineTask: (id: string, evidenceLinks: string[], ownerId: string) => void;
  skipRoutineTask: (id: string, reason: string) => void;
  
  // KPI Entries CRUD
  addKPIEntry: (entry: KPIEntry) => void;
  updateKPIEntry: (id: string, data: Partial<KPIEntry>) => void;
  deleteKPIEntry: (id: string) => void;
  
  // Incidents CRUD
  addIncident: (incident: Incident) => void;
  updateIncident: (id: string, data: Partial<Incident>) => void;
  deleteIncident: (id: string) => void;
  
  // Experiments CRUD
  addExperiment: (experiment: Experiment) => void;
  updateExperiment: (id: string, data: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;
  
  // Score Weeks CRUD
  addScoreWeek: (scoreWeek: ScoreWeek) => void;
  updateScoreWeek: (id: string, data: Partial<ScoreWeek>) => void;
  deleteScoreWeek: (id: string) => void;
  
  // Points Ledger
  addPoints: (entry: PointsLedger) => void;
  deletePoints: (id: string) => void;
  
  // Task Templates CRUD
  addTaskTemplate: (template: TaskTemplate) => void;
  updateTaskTemplate: (id: string, data: Partial<TaskTemplate>) => void;
  deleteTaskTemplate: (id: string) => void;
  generateMonthTasks: (monthKey: string) => void;
  setLastMonthGenerated: (monthKey: string) => void;
  
  // Utility
  loadSeedData: () => void;
  resetData: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;
}

const initialState: AppState = {
  config: {
    nome: '',
    metaDiaria: 10000,
    moeda: 'BRL',
    isOnboarded: false,
    modulesEnabled: {
      crm: false,
      paidAds: true,
      live: true,
      affiliates: false,
    },
    currentUserId: null,
    restrictViewToCurrentUser: true, // ON por default
    globalTasksVisibleTo: 'CEO',
    scoreRules: {
      criticalTaskDone: 3,
      normalTaskDone: 1,
      criticalMissed: -5,
      normalMissed: -2,
    },
  },
  owners: [],
  marketplaces: [],
  products: [],
  routineTasks: [],
  taskTemplates: [],
  kpiEntries: [],
  incidents: [],
  experiments: [],
  scoreWeeks: [],
  pointsLedger: [],
  lastMonthGenerated: null,
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      updateConfig: (config) =>
        set((state) => ({ config: { ...state.config, ...config } })),

      completeOnboarding: () =>
        set((state) => ({ config: { ...state.config, isOnboarded: true } })),

      // Owners
      addOwner: (owner) =>
        set((state) => ({ owners: [...state.owners, owner] })),
      updateOwner: (id, data) =>
        set((state) => ({
          owners: state.owners.map((o) => (o.id === id ? { ...o, ...data } : o)),
        })),
      deleteOwner: (id) =>
        set((state) => ({ owners: state.owners.filter((o) => o.id !== id) })),

      // Marketplaces
      addMarketplace: (marketplace) =>
        set((state) => ({ marketplaces: [...state.marketplaces, marketplace] })),
      updateMarketplace: (id, data) =>
        set((state) => ({
          marketplaces: state.marketplaces.map((m) => (m.id === id ? { ...m, ...data } : m)),
        })),
      deleteMarketplace: (id) =>
        set((state) => ({
          marketplaces: state.marketplaces.filter((m) => m.id !== id),
          routineTasks: state.routineTasks.filter((t) => t.marketplaceId !== id),
          kpiEntries: state.kpiEntries.filter((k) => k.marketplaceId !== id),
        })),

      // Products
      addProduct: (product) =>
        set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, data) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deleteProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),

      // Routine Tasks
      addRoutineTask: (task) =>
        set((state) => ({ routineTasks: [...state.routineTasks, task] })),
      updateRoutineTask: (id, data) =>
        set((state) => ({
          routineTasks: state.routineTasks.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        })),
      deleteRoutineTask: (id) =>
        set((state) => ({
          routineTasks: state.routineTasks.filter((t) => t.id !== id),
        })),
      completeRoutineTask: (id, evidenceLinks, ownerId) => {
        const task = get().routineTasks.find((t) => t.id === id);
        if (task) {
          const points = task.critical 
            ? get().config.scoreRules.criticalTaskDone 
            : get().config.scoreRules.normalTaskDone;
          
          set((state) => ({
            routineTasks: state.routineTasks.map((t) =>
              t.id === id
                ? { 
                    ...t, 
                    status: 'DONE', 
                    evidenceLinks, 
                    completedAt: new Date().toISOString(),
                    completedByOwnerId: ownerId,
                  }
                : t
            ),
            pointsLedger: [
              ...state.pointsLedger,
              {
                id: crypto.randomUUID(),
                date: new Date().toISOString().split('T')[0],
                tipo: 'PREMIO',
                referenciaType: 'routine',
                referenciaId: id,
                pontos: points,
                ownerId,
                marketplaceId: task.marketplaceId,
                motivo: `Tarefa concluída: ${task.title}`,
              },
            ],
          }));
        }
      },
      skipRoutineTask: (id, reason) => {
        const task = get().routineTasks.find((t) => t.id === id);
        if (task) {
          const points = task.critical 
            ? get().config.scoreRules.criticalMissed 
            : get().config.scoreRules.normalMissed;
          
          set((state) => ({
            routineTasks: state.routineTasks.map((t) =>
              t.id === id
                ? { ...t, status: 'SKIPPED', skipReason: reason }
                : t
            ),
            pointsLedger: [
              ...state.pointsLedger,
              {
                id: crypto.randomUUID(),
                date: new Date().toISOString().split('T')[0],
                tipo: 'PENA',
                referenciaType: 'routine',
                referenciaId: id,
                pontos: Math.abs(points),
                ownerId: state.marketplaces.find((m) => m.id === task.marketplaceId)?.ownerId || 'owner-1',
                marketplaceId: task.marketplaceId,
                motivo: `Tarefa pulada: ${task.title} - ${reason}`,
              },
            ],
          }));
        }
      },

      // KPI Entries
      addKPIEntry: (entry) =>
        set((state) => ({ kpiEntries: [...state.kpiEntries, entry] })),
      updateKPIEntry: (id, data) =>
        set((state) => ({
          kpiEntries: state.kpiEntries.map((k) =>
            k.id === id ? { ...k, ...data } : k
          ),
        })),
      deleteKPIEntry: (id) =>
        set((state) => ({
          kpiEntries: state.kpiEntries.filter((k) => k.id !== id),
        })),

      // Incidents
      addIncident: (incident) =>
        set((state) => ({ incidents: [...state.incidents, incident] })),
      updateIncident: (id, data) =>
        set((state) => ({
          incidents: state.incidents.map((i) =>
            i.id === id ? { ...i, ...data } : i
          ),
        })),
      deleteIncident: (id) =>
        set((state) => ({
          incidents: state.incidents.filter((i) => i.id !== id),
        })),

      // Experiments
      addExperiment: (experiment) =>
        set((state) => ({ experiments: [...state.experiments, experiment] })),
      updateExperiment: (id, data) =>
        set((state) => ({
          experiments: state.experiments.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        })),
      deleteExperiment: (id) =>
        set((state) => ({
          experiments: state.experiments.filter((e) => e.id !== id),
        })),

      // Score Weeks
      addScoreWeek: (scoreWeek) =>
        set((state) => ({ scoreWeeks: [...state.scoreWeeks, scoreWeek] })),
      updateScoreWeek: (id, data) =>
        set((state) => ({
          scoreWeeks: state.scoreWeeks.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),
      deleteScoreWeek: (id) =>
        set((state) => ({
          scoreWeeks: state.scoreWeeks.filter((s) => s.id !== id),
        })),

      // Points Ledger
      addPoints: (entry) =>
        set((state) => ({ pointsLedger: [...state.pointsLedger, entry] })),
      deletePoints: (id) =>
        set((state) => ({
          pointsLedger: state.pointsLedger.filter((p) => p.id !== id),
        })),

      // Task Templates
      addTaskTemplate: (template) =>
        set((state) => ({ taskTemplates: [...state.taskTemplates, template] })),
      updateTaskTemplate: (id, data) =>
        set((state) => ({
          taskTemplates: state.taskTemplates.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        })),
      deleteTaskTemplate: (id) =>
        set((state) => ({
          taskTemplates: state.taskTemplates.filter((t) => t.id !== id),
        })),
      generateMonthTasks: (monthKey) => {
        const state = get();
        const year = parseInt(monthKey.split('-')[0]);
        const month = parseInt(monthKey.split('-')[1]) - 1;
        
        const weekDayMap: Record<number, string> = {
          1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex'
        };
        
        const newTasks: RoutineTask[] = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          const dayOfWeek = date.getDay();
          
          // Apenas seg-sex (1-5)
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const weekDayStr = weekDayMap[dayOfWeek];
            const dateStr = date.toISOString().split('T')[0];
            
            state.taskTemplates.filter(t => t.isActive).forEach((template) => {
              if (template.weekDays.includes(weekDayStr as any)) {
                newTasks.push({
                  id: crypto.randomUUID(),
                  marketplaceId: template.marketplaceId,
                  ownerId: template.ownerId,
                  cadence: 'DAILY',
                  time: template.time,
                  type: template.type,
                  title: template.title,
                  dod: template.dod,
                  // Campos operacionais copiados do template
                  description: template.description,
                  steps: template.steps.map(s => ({ ...s, id: crypto.randomUUID(), completed: false })),
                  inputs: [...template.inputs],
                  outputs: [...template.outputs],
                  commonMistakes: [...template.commonMistakes],
                  timeboxMinutes: template.timeboxMinutes,
                  toolsLinks: [...template.toolsLinks],
                  evidenceExamples: [...template.evidenceExamples],
                  escalationRule: template.escalationRule,
                  // Campos de execução
                  evidenceRequired: template.evidenceRequired,
                  critical: template.critical,
                  points: template.points,
                  status: 'TODO',
                  evidenceLinks: [],
                  completedAt: null,
                  completedByOwnerId: null,
                  skipReason: null,
                  date: dateStr,
                  createdAt: new Date().toISOString(),
                });
              }
            });
          }
        }
        
        set((state) => ({
          routineTasks: [...state.routineTasks, ...newTasks],
          lastMonthGenerated: monthKey,
        }));
      },
      setLastMonthGenerated: (monthKey) =>
        set({ lastMonthGenerated: monthKey }),

      // Utility
      loadSeedData: () => {
        const seed = generateSeedData();
        set({
          owners: seed.owners,
          marketplaces: seed.marketplaces,
          products: seed.products || [],
          routineTasks: seed.routineTasks,
          taskTemplates: seed.taskTemplates || [],
          kpiEntries: seed.kpiEntries,
          incidents: seed.incidents,
          experiments: seed.experiments,
          scoreWeeks: seed.scoreWeeks,
          pointsLedger: [],
        });
      },
      resetData: () => set(initialState),
      exportData: () => {
        const state = get();
        return JSON.stringify({
          config: state.config,
          owners: state.owners,
          marketplaces: state.marketplaces,
          products: state.products,
          routineTasks: state.routineTasks,
          taskTemplates: state.taskTemplates,
          kpiEntries: state.kpiEntries,
          incidents: state.incidents,
          experiments: state.experiments,
          scoreWeeks: state.scoreWeeks,
          pointsLedger: state.pointsLedger,
          lastMonthGenerated: state.lastMonthGenerated,
        }, null, 2);
      },
      importData: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            config: data.config || initialState.config,
            owners: data.owners || [],
            marketplaces: data.marketplaces || [],
            products: data.products || [],
            routineTasks: data.routineTasks || [],
            taskTemplates: data.taskTemplates || [],
            kpiEntries: data.kpiEntries || [],
            incidents: data.incidents || [],
            experiments: data.experiments || [],
            scoreWeeks: data.scoreWeeks || [],
            pointsLedger: data.pointsLedger || [],
            lastMonthGenerated: data.lastMonthGenerated || null,
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'os-marketplaces-storage',
    }
  )
);
