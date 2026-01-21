// ============================================
// OKRs Data Hooks - Supabase CRUD
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for OKRs (matching Supabase schema)
interface Objective {
  id: string;
  title: string;
  owner_id: string | null;
  due_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface KeyResult {
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

export type { Objective, KeyResult };

// ============================================
// Objectives Hooks
// ============================================

export function useObjectives() {
  return useQuery({
    queryKey: ['objectives'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objectives')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Objective[];
    },
  });
}

export function useCreateObjective() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (objective: {
      id: string;
      title: string;
      owner_id: string | null;
      due_date: string | null;
      description: string | null;
    }) => {
      const { data, error } = await supabase
        .from('objectives')
        .insert(objective as never)
        .select()
        .single();
      if (error) throw error;
      return data as Objective;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
    },
  });
}

export function useUpdateObjective() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { 
      id: string; 
      updates: Partial<{
        title: string;
        owner_id: string | null;
        due_date: string | null;
        description: string | null;
      }>;
    }) => {
      const { data, error } = await supabase
        .from('objectives')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Objective;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
    },
  });
}

export function useDeleteObjective() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // First delete all associated key results
      await supabase.from('key_results').delete().eq('objective_id', id);
      // Then delete the objective
      const { error } = await supabase.from('objectives').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      queryClient.invalidateQueries({ queryKey: ['key_results'] });
    },
  });
}

// ============================================
// Key Results Hooks
// ============================================

export function useKeyResults() {
  return useQuery({
    queryKey: ['key_results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('key_results')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as KeyResult[];
    },
  });
}

export function useCreateKeyResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kr: {
      id: string;
      objective_id: string;
      metric_name: string;
      unit: string | null;
      baseline: number;
      target: number;
      current: number;
    }) => {
      const { data, error } = await supabase
        .from('key_results')
        .insert(kr as never)
        .select()
        .single();
      if (error) throw error;
      return data as KeyResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['key_results'] });
    },
  });
}

export function useUpdateKeyResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { 
      id: string; 
      updates: Partial<{
        metric_name: string;
        unit: string | null;
        baseline: number;
        target: number;
        current: number;
      }>;
    }) => {
      const { data, error } = await supabase
        .from('key_results')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as KeyResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['key_results'] });
    },
  });
}

export function useDeleteKeyResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('key_results').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['key_results'] });
    },
  });
}

// ============================================
// OKRs Aggregated Queries
// ============================================

interface KpiRow {
  gmv: number | null;
  orders: number | null;
  cancel_rate: number | null;
}

export function useMonthlyKPISummary(year: number, month: number) {
  return useQuery({
    queryKey: ['kpi_summary', year, month],
    queryFn: async () => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      const { data, error } = await supabase
        .from('kpi_daily')
        .select('gmv, orders, cancel_rate')
        .gte('date_iso', startDate)
        .lte('date_iso', endDate);
      
      if (error) throw error;
      
      const rows = (data || []) as KpiRow[];
      const totalGMV = rows.reduce((sum, row) => sum + (row.gmv || 0), 0);
      const totalOrders = rows.reduce((sum, row) => sum + (row.orders || 0), 0);
      const daysWithData = rows.length;
      const avgGMV = daysWithData > 0 ? totalGMV / daysWithData : 0;
      const avgCancelRate = rows.length 
        ? rows.reduce((sum, row) => sum + (row.cancel_rate || 0), 0) / rows.length 
        : 0;
      
      return {
        totalGMV,
        totalOrders,
        avgGMV,
        avgCancelRate,
        daysWithData,
      };
    },
  });
}

export function useActiveMarketplacesP1Count() {
  return useQuery({
    queryKey: ['marketplaces_p1_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('marketplaces')
        .select('*', { count: 'exact', head: true })
        .eq('priority', 'P1')
        .eq('active', true);
      
      if (error) throw error;
      return count || 0;
    },
  });
}
