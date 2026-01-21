import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import type { KpiDaily, Marketplace, TaskInstance, Incident, Owner, AppSettings, Points } from '@/integrations/supabase/database.types';

// Hook para KPIs do dia
export function useTodayKPIs(dateISO: string) {
  return useQuery({
    queryKey: ['kpi_daily', dateISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpi_daily')
        .select('*')
        .eq('date_iso', dateISO);
      
      if (error) throw error;
      return (data as KpiDaily[]) || [];
    },
  });
}

// Hook para KPIs dos últimos 7 dias
export function useKPIsLast7Days() {
  const today = new Date();
  const startDate = format(subDays(today, 6), 'yyyy-MM-dd');
  const endDate = format(today, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['kpi_daily_7days', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpi_daily')
        .select('date_iso, gmv, orders')
        .gte('date_iso', startDate)
        .lte('date_iso', endDate)
        .order('date_iso', { ascending: true });
      
      if (error) throw error;
      return (data as Pick<KpiDaily, 'date_iso' | 'gmv' | 'orders'>[]) || [];
    },
  });
}

// Hook para Marketplaces P1
export function useMarketplacesP1() {
  return useQuery({
    queryKey: ['marketplaces_p1'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplaces')
        .select('*')
        .eq('priority', 'P1')
        .eq('active', true);
      
      if (error) throw error;
      return (data as Marketplace[]) || [];
    },
  });
}

// Hook para Tarefas do dia
export function useTodayTasks(dateISO: string, ownerId?: string) {
  return useQuery({
    queryKey: ['task_instances', dateISO, ownerId],
    queryFn: async () => {
      let query = supabase
        .from('task_instances')
        .select('*')
        .eq('date_iso', dateISO)
        .order('time_hhmm', { ascending: true });
      
      if (ownerId) {
        query = query.eq('owner_id', ownerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch owners separately for names
      const ownerIds = [...new Set((data || []).map((t: TaskInstance) => t.owner_id))];
      const { data: owners } = await supabase
        .from('owners')
        .select('id, name, initials')
        .in('id', ownerIds);
      
      const ownersMap = new Map((owners || []).map((o: Owner) => [o.id, o]));
      
      return (data || []).map((t: TaskInstance) => ({
        ...t,
        owners: ownersMap.get(t.owner_id) || null,
      }));
    },
  });
}

// Hook para Incidentes abertos
export function useOpenIncidents() {
  return useQuery({
    queryKey: ['incidents_open'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .neq('status', 'RESOLVIDO')
        .order('severity', { ascending: false });
      
      if (error) throw error;
      
      // Fetch marketplaces for names
      const marketplaceIds = [...new Set((data || []).map((i: Incident) => i.marketplace_id))];
      const { data: marketplaces } = await supabase
        .from('marketplaces')
        .select('id, name')
        .in('id', marketplaceIds);
      
      const marketplacesMap = new Map((marketplaces || []).map((m: Marketplace) => [m.id, m]));
      
      return (data || []).map((i: Incident) => ({
        ...i,
        marketplaces: marketplacesMap.get(i.marketplace_id) || null,
      }));
    },
  });
}

// Hook para Ranking de pontos da semana
export function usePointsRankingWeek() {
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['points_ranking', weekStart, weekEnd],
    queryFn: async () => {
      // Fetch points
      const { data: pointsData, error: pointsError } = await supabase
        .from('points')
        .select('owner_id, points')
        .gte('date_iso', weekStart)
        .lte('date_iso', weekEnd);
      
      if (pointsError) throw pointsError;
      if (!pointsData || pointsData.length === 0) return [];

      // Fetch owners
      const { data: ownersData, error: ownersError } = await supabase
        .from('owners')
        .select('id, name, initials, color');
      
      if (ownersError) throw ownersError;
      
      const ownersMap = new Map((ownersData as Owner[] || []).map(o => [o.id, o]));

      // Agregar pontos por owner
      const pointsByOwner: Record<string, { name: string; initials: string; color: string; total: number }> = {};
      
      for (const p of pointsData as Points[]) {
        const owner = ownersMap.get(p.owner_id);
        if (!owner) continue;
        
        if (!pointsByOwner[p.owner_id]) {
          pointsByOwner[p.owner_id] = {
            name: owner.name,
            initials: owner.initials,
            color: owner.color || '#6366f1',
            total: 0,
          };
        }
        pointsByOwner[p.owner_id].total += p.points;
      }

      return Object.entries(pointsByOwner)
        .map(([id, info]) => ({ ownerId: id, ...info }))
        .sort((a, b) => b.total - a.total);
    },
  });
}

// Hook para buscar todos os owners
export function useOwners() {
  return useQuery({
    queryKey: ['owners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owners')
        .select('*')
        .eq('active', true);
      
      if (error) throw error;
      return (data as Owner[]) || [];
    },
  });
}

// Hook para app settings
export function useAppSettings() {
  return useQuery({
    queryKey: ['app_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      
      if (error) throw error;
      return data as AppSettings | null;
    },
  });
}
