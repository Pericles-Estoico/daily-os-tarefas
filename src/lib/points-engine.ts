// ============================================
// Points Engine - Auto-calculation logic
// ============================================

import type { PointSource } from '@/integrations/supabase/database.types';

export const POINTS_CONFIG = {
  TASK_DONE_NORMAL: 10,
  TASK_DONE_CRITICAL: 25,
  TASK_SKIPPED: -5,
  INCIDENT_RESOLVED: 20,
  DAILY_GOAL_MET: 50,
};

export interface PointEntry {
  owner_id: string;
  date_iso: string;
  points: number;
  reason: string | null;
  source: PointSource;
}

/**
 * Calculate points for completing a task
 */
export function calculateTaskDonePoints(
  taskTitle: string,
  isCritical: boolean,
  ownerId: string,
  dateISO: string,
  templatePoints?: number
): PointEntry {
  const points = templatePoints ?? (isCritical ? POINTS_CONFIG.TASK_DONE_CRITICAL : POINTS_CONFIG.TASK_DONE_NORMAL);
  
  return {
    owner_id: ownerId,
    date_iso: dateISO,
    points,
    reason: `Concluiu: ${taskTitle}`,
    source: 'TASK_DONE',
  };
}

/**
 * Calculate points (penalty) for skipping a task
 */
export function calculateTaskSkippedPoints(
  taskTitle: string,
  ownerId: string,
  dateISO: string,
  penaltyPoints?: number
): PointEntry {
  const points = penaltyPoints ?? POINTS_CONFIG.TASK_SKIPPED;
  
  return {
    owner_id: ownerId,
    date_iso: dateISO,
    points,
    reason: `Pulou: ${taskTitle}`,
    source: 'TASK_SKIPPED',
  };
}

/**
 * Calculate points for resolving an incident
 */
export function calculateIncidentResolvedPoints(
  incidentTitle: string,
  ownerId: string,
  dateISO: string
): PointEntry {
  return {
    owner_id: ownerId,
    date_iso: dateISO,
    points: POINTS_CONFIG.INCIDENT_RESOLVED,
    reason: `Resolveu incidente: ${incidentTitle}`,
    source: 'INCIDENT_RESOLVED',
  };
}

/**
 * Calculate points for meeting daily goal
 */
export function calculateDailyGoalPoints(
  ownerId: string,
  dateISO: string,
  gmv: number,
  goal: number
): PointEntry | null {
  if (gmv < goal) return null;
  
  return {
    owner_id: ownerId,
    date_iso: dateISO,
    points: POINTS_CONFIG.DAILY_GOAL_MET,
    reason: `Meta diária atingida: R$ ${gmv.toLocaleString('pt-BR')}`,
    source: 'MANUAL', // Could be a new source like 'GOAL_MET'
  };
}
