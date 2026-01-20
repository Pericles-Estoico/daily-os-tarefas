// ============================================
// Ops Context - Global State Management
// ============================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, INITIAL_APP_STATE } from '@/types/marketplace-ops';
import { loadState, saveState } from '@/lib/storage';

interface OpsContextType {
  state: AppState;
  updateState: (updater: (state: AppState) => AppState) => void;
  resetState: () => void;
}

const OpsContext = createContext<OpsContextType | undefined>(undefined);

interface OpsProviderProps {
  children: ReactNode;
}

export function OpsProvider({ children }: OpsProviderProps) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateState = (updater: (state: AppState) => AppState) => {
    setState((prev) => updater(prev));
  };

  const resetState = () => {
    setState(INITIAL_APP_STATE);
  };

  return (
    <OpsContext.Provider value={{ state, updateState, resetState }}>
      {children}
    </OpsContext.Provider>
  );
}

export function useOps(): OpsContextType {
  const context = useContext(OpsContext);
  if (!context) {
    throw new Error('useOps must be used within OpsProvider');
  }
  return context;
}
