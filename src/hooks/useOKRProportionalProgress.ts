// ============================================
// OKR Proportional Progress Hook
// Meta proporcional ao tempo com farol de gap
// ============================================

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProportionalProgress {
  // Meta
  targetMonthly: number;
  targetToday: number; // Meta proporcional até hoje
  targetDaily: number; // Meta diária simples
  
  // Progresso atual
  currentGMV: number;
  currentOrders: number;
  
  // Gap e projeção
  gap: number;
  gapPercent: number;
  recoveryDailyTarget: number; // Quanto precisa fazer por dia para recuperar
  monthProjection: number; // Projeção baseada no ritmo atual
  
  // Status
  progressPercent: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  statusLabel: string;
  statusDescription: string;
  
  // Período
  daysInMonth: number;
  currentDay: number;
  daysRemaining: number;
  daysWithData: number;
}

// Calcular dias no mês
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// ============================================
// Hook Principal: Progresso Proporcional ao Tempo
// ============================================
export function useOKRProportionalProgress(
  targetMonthly: number,
  year: number = 2026,
  month: number = 1
): { data: ProportionalProgress | null; isLoading: boolean; error: Error | null } {
  
  const { data: kpiData, isLoading, error } = useQuery({
    queryKey: ['okr_proportional', year, month],
    queryFn: async () => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      const { data, error } = await supabase
        .from('kpi_daily')
        .select('date_iso, gmv, orders')
        .gte('date_iso', startDate)
        .lte('date_iso', endDate);
      
      if (error) throw error;
      return data || [];
    },
  });
  
  const progress = useMemo(() => {
    if (!kpiData) return null;
    
    const daysInMonth = getDaysInMonth(year, month);
    const now = new Date();
    const currentDay = now.getFullYear() === year && now.getMonth() + 1 === month
      ? now.getDate()
      : daysInMonth;
    const daysRemaining = daysInMonth - currentDay;
    
    // Calcular GMV acumulado
    const currentGMV = kpiData.reduce((sum, row) => sum + (row.gmv || 0), 0);
    const currentOrders = kpiData.reduce((sum, row) => sum + (row.orders || 0), 0);
    const daysWithData = new Set(kpiData.map(r => r.date_iso)).size;
    
    // Meta proporcional ao tempo
    const targetDaily = targetMonthly / daysInMonth;
    const targetToday = targetDaily * currentDay;
    
    // Gap
    const gap = targetToday - currentGMV;
    const gapPercent = targetToday > 0 ? (gap / targetToday) * 100 : 0;
    
    // Quanto precisa fazer por dia para recuperar
    const recoveryDailyTarget = daysRemaining > 0
      ? (targetMonthly - currentGMV) / daysRemaining
      : 0;
    
    // Projeção baseada no ritmo atual
    const avgDailyGMV = daysWithData > 0 ? currentGMV / daysWithData : 0;
    const monthProjection = avgDailyGMV * daysInMonth;
    
    // Progresso percentual baseado na meta proporcional
    const progressPercent = targetToday > 0 
      ? (currentGMV / targetToday) * 100 
      : 0;
    
    // Status (Farol)
    let status: 'GREEN' | 'YELLOW' | 'RED';
    let statusLabel: string;
    let statusDescription: string;
    
    if (progressPercent >= 100) {
      status = 'GREEN';
      statusLabel = 'No Ritmo';
      statusDescription = `Você está ${(progressPercent - 100).toFixed(1)}% acima da meta proporcional`;
    } else if (progressPercent >= 85) {
      status = 'YELLOW';
      statusLabel = 'Atenção';
      statusDescription = `Você está ${(100 - progressPercent).toFixed(1)}% abaixo da meta proporcional`;
    } else {
      status = 'RED';
      statusLabel = 'Alerta';
      statusDescription = `Você está ${(100 - progressPercent).toFixed(1)}% abaixo da meta proporcional`;
    }
    
    return {
      targetMonthly,
      targetToday,
      targetDaily,
      currentGMV,
      currentOrders,
      gap: Math.max(0, gap),
      gapPercent: Math.max(0, gapPercent),
      recoveryDailyTarget,
      monthProjection,
      progressPercent: Math.min(100, progressPercent),
      status,
      statusLabel,
      statusDescription,
      daysInMonth,
      currentDay,
      daysRemaining,
      daysWithData,
    };
  }, [kpiData, targetMonthly, year, month]);
  
  return { data: progress, isLoading, error: error as Error | null };
}

// ============================================
// Helper: Formatar valores monetários
// ============================================
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ============================================
// Helper: Cores do status
// ============================================
export function getStatusColors(status: 'GREEN' | 'YELLOW' | 'RED') {
  switch (status) {
    case 'GREEN':
      return {
        bg: 'bg-green-500',
        text: 'text-green-500',
        border: 'border-green-500',
        bgLight: 'bg-green-500/10',
      };
    case 'YELLOW':
      return {
        bg: 'bg-yellow-500',
        text: 'text-yellow-500',
        border: 'border-yellow-500',
        bgLight: 'bg-yellow-500/10',
      };
    case 'RED':
      return {
        bg: 'bg-red-500',
        text: 'text-red-500',
        border: 'border-red-500',
        bgLight: 'bg-red-500/10',
      };
  }
}
