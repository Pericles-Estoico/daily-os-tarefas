import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppState,
  Owner,
  Sector,
  RoutineTask,
  OKR,
  KR,
  Incident,
  Experiment,
  ScoreEntry,
  WeeklyCanvas,
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
  
  // Sectors CRUD
  addSector: (sector: Sector) => void;
  updateSector: (id: string, data: Partial<Sector>) => void;
  deleteSector: (id: string) => void;
  
  // Routine Tasks CRUD
  addRoutineTask: (task: RoutineTask) => void;
  updateRoutineTask: (id: string, data: Partial<RoutineTask>) => void;
  deleteRoutineTask: (id: string) => void;
  completeRoutineTask: (id: string, evidencia: string) => void;
  failRoutineTask: (id: string) => void;
  
  // OKRs CRUD
  addOKR: (okr: OKR) => void;
  updateOKR: (id: string, data: Partial<OKR>) => void;
  deleteOKR: (id: string) => void;
  
  // KRs CRUD
  addKR: (kr: KR) => void;
  updateKR: (id: string, data: Partial<KR>) => void;
  deleteKR: (id: string) => void;
  
  // Incidents CRUD
  addIncident: (incident: Incident) => void;
  updateIncident: (id: string, data: Partial<Incident>) => void;
  deleteIncident: (id: string) => void;
  
  // Experiments CRUD
  addExperiment: (experiment: Experiment) => void;
  updateExperiment: (id: string, data: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;
  
  // Score Entries CRUD
  addScoreEntry: (entry: ScoreEntry) => void;
  updateScoreEntry: (id: string, data: Partial<ScoreEntry>) => void;
  deleteScoreEntry: (id: string) => void;
  
  // Weekly Canvas CRUD
  addWeeklyCanvas: (canvas: WeeklyCanvas) => void;
  updateWeeklyCanvas: (id: string, data: Partial<WeeklyCanvas>) => void;
  deleteWeeklyCanvas: (id: string) => void;
  
  // Points Ledger CRUD
  addPoints: (entry: PointsLedger) => void;
  deletePoints: (id: string) => void;
  
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
    toleranciaSemaforo: 10,
    isOnboarded: false,
  },
  owners: [],
  sectors: [],
  routineTasks: [],
  okrs: [],
  krs: [],
  incidents: [],
  experiments: [],
  scoreEntries: [],
  weeklyCanvas: [],
  pointsLedger: [],
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

      // Sectors
      addSector: (sector) =>
        set((state) => ({ sectors: [...state.sectors, sector] })),
      updateSector: (id, data) =>
        set((state) => ({
          sectors: state.sectors.map((s) => (s.id === id ? { ...s, ...data } : s)),
        })),
      deleteSector: (id) =>
        set((state) => ({ sectors: state.sectors.filter((s) => s.id !== id) })),

      // Routine Tasks
      addRoutineTask: (task) =>
        set((state) => ({ routineTasks: [...state.routineTasks, task] })),
      updateRoutineTask: (id, data) =>
        set((state) => ({
          routineTasks: state.routineTasks.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
          ),
        })),
      deleteRoutineTask: (id) =>
        set((state) => ({
          routineTasks: state.routineTasks.filter((t) => t.id !== id),
        })),
      completeRoutineTask: (id, evidencia) => {
        const task = get().routineTasks.find((t) => t.id === id);
        if (task) {
          set((state) => ({
            routineTasks: state.routineTasks.map((t) =>
              t.id === id
                ? { ...t, status: 'done', evidencia, updatedAt: new Date().toISOString() }
                : t
            ),
            pointsLedger: [
              ...state.pointsLedger,
              {
                id: crypto.randomUUID(),
                date: new Date().toISOString().split('T')[0],
                tipo: 'premio',
                referenciaType: 'routine',
                referenciaId: id,
                pontos: task.pontosOnDone,
                ownerId: state.sectors.find((s) => s.id === task.sectorId)?.ownerId || '',
                motivo: `Tarefa concluída: ${task.nome}`,
              },
            ],
          }));
        }
      },
      failRoutineTask: (id) => {
        const task = get().routineTasks.find((t) => t.id === id);
        if (task) {
          set((state) => ({
            routineTasks: state.routineTasks.map((t) =>
              t.id === id
                ? { ...t, status: 'blocked', updatedAt: new Date().toISOString() }
                : t
            ),
            pointsLedger: [
              ...state.pointsLedger,
              {
                id: crypto.randomUUID(),
                date: new Date().toISOString().split('T')[0],
                tipo: 'pena',
                referenciaType: 'routine',
                referenciaId: id,
                pontos: task.pontosOnFail,
                ownerId: state.sectors.find((s) => s.id === task.sectorId)?.ownerId || '',
                motivo: `Tarefa não concluída: ${task.nome}`,
              },
            ],
          }));
        }
      },

      // OKRs
      addOKR: (okr) => set((state) => ({ okrs: [...state.okrs, okr] })),
      updateOKR: (id, data) =>
        set((state) => ({
          okrs: state.okrs.map((o) => (o.id === id ? { ...o, ...data } : o)),
        })),
      deleteOKR: (id) =>
        set((state) => ({
          okrs: state.okrs.filter((o) => o.id !== id),
          krs: state.krs.filter((kr) => kr.okrId !== id),
        })),

      // KRs
      addKR: (kr) => set((state) => ({ krs: [...state.krs, kr] })),
      updateKR: (id, data) =>
        set((state) => ({
          krs: state.krs.map((k) => (k.id === id ? { ...k, ...data } : k)),
        })),
      deleteKR: (id) =>
        set((state) => ({ krs: state.krs.filter((k) => k.id !== id) })),

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

      // Score Entries
      addScoreEntry: (entry) =>
        set((state) => ({ scoreEntries: [...state.scoreEntries, entry] })),
      updateScoreEntry: (id, data) =>
        set((state) => ({
          scoreEntries: state.scoreEntries.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),
      deleteScoreEntry: (id) =>
        set((state) => ({
          scoreEntries: state.scoreEntries.filter((s) => s.id !== id),
        })),

      // Weekly Canvas
      addWeeklyCanvas: (canvas) =>
        set((state) => ({ weeklyCanvas: [...state.weeklyCanvas, canvas] })),
      updateWeeklyCanvas: (id, data) =>
        set((state) => ({
          weeklyCanvas: state.weeklyCanvas.map((w) =>
            w.id === id ? { ...w, ...data } : w
          ),
        })),
      deleteWeeklyCanvas: (id) =>
        set((state) => ({
          weeklyCanvas: state.weeklyCanvas.filter((w) => w.id !== id),
        })),

      // Points Ledger
      addPoints: (entry) =>
        set((state) => ({ pointsLedger: [...state.pointsLedger, entry] })),
      deletePoints: (id) =>
        set((state) => ({
          pointsLedger: state.pointsLedger.filter((p) => p.id !== id),
        })),

      // Utility
      loadSeedData: () => {
        const seed = generateSeedData();
        set({
          owners: seed.owners,
          sectors: seed.sectors,
          routineTasks: seed.routineTasks,
          okrs: seed.okrs,
          krs: seed.krs,
          incidents: seed.incidents,
          experiments: seed.experiments,
          scoreEntries: seed.scoreEntries,
          weeklyCanvas: seed.weeklyCanvas,
          pointsLedger: [],
        });
      },
      resetData: () => set(initialState),
      exportData: () => {
        const state = get();
        return JSON.stringify({
          config: state.config,
          owners: state.owners,
          sectors: state.sectors,
          routineTasks: state.routineTasks,
          okrs: state.okrs,
          krs: state.krs,
          incidents: state.incidents,
          experiments: state.experiments,
          scoreEntries: state.scoreEntries,
          weeklyCanvas: state.weeklyCanvas,
          pointsLedger: state.pointsLedger,
        }, null, 2);
      },
      importData: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            config: data.config || initialState.config,
            owners: data.owners || [],
            sectors: data.sectors || [],
            routineTasks: data.routineTasks || [],
            okrs: data.okrs || [],
            krs: data.krs || [],
            incidents: data.incidents || [],
            experiments: data.experiments || [],
            scoreEntries: data.scoreEntries || [],
            weeklyCanvas: data.weeklyCanvas || [],
            pointsLedger: data.pointsLedger || [],
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'os-execucao-storage',
    }
  )
);
