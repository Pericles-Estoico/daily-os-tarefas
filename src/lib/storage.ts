// ============================================
// LocalStorage Persistence Layer
// ============================================

import { AppState, INITIAL_APP_STATE } from '@/types/marketplace-ops';

const STORAGE_KEY = 'my_operacao_state_v1';

export function loadState(): AppState {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return INITIAL_APP_STATE;
    }
    const parsed = JSON.parse(serialized);
    return {
      ...INITIAL_APP_STATE,
      ...parsed,
    };
  } catch (error) {
    console.error('Error loading state:', error);
    return INITIAL_APP_STATE;
  }
}

export function saveState(state: AppState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing state:', error);
  }
}

export function exportStateToJSON(): void {
  const state = loadState();
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `marketplace-ops-backup-${new Date().toISOString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importStateFromJSON(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const state = JSON.parse(json) as AppState;
        saveState(state);
        resolve(state);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
