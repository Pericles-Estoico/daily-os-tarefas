// ============================================
// Points Data Hooks - Supabase CRUD
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for Points (matching Supabase schema)
export type PointSource = 'TASK_DONE' | 'TASK_SKIPPED' | 'INCIDENT_RESOLVED' | 'MANUAL';

interface Points {
  id: string;
  owner_id: string;
  date_iso: string;
  points: number;
  reason: string | null;
  source: PointSource;
  created_at: string;
}

interface Owner {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string | null;
  is_manager: boolean;
  active: boolean;
}

export type { Points, Owner };

// ============================================
// Points Configuration
// ============================================

export const POINTS_CONFIG = {
  TASK_DONE_NORMAL: 10,
  TASK_DONE_CRITICAL: 25,
  TASK_SKIPPED: -5,
  INCIDENT_RESOLVED: 20,
  DAILY_GOAL_MET: 50,
};

// ============================================
// Points Hooks
// ============================================

export function usePoints() {
  return useQuery({
    queryKey: ['points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points')
        .select('*')
        .order('date_iso', { ascending: false });
      if (error) throw error;
      return (data || []) as Points[];
    },
  });
}

export function useCreatePoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (point: {
      owner_id: string;
      date_iso: string;
      points: number;
      reason: string | null;
      source: PointSource;
    }) => {
      const { data, error } = await supabase
        .from('points')
        .insert(point as never)
        .select()
        .single();
      if (error) throw error;
      return data as Points;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points'] });
      queryClient.invalidateQueries({ queryKey: ['points_ranking'] });
      queryClient.invalidateQueries({ queryKey: ['filtered_points'] });
    },
  });
}

// ============================================
// Points Ranking Hooks
// ============================================

export function usePointsRanking(month?: string) {
  return useQuery({
    queryKey: ['points_ranking', month],
    queryFn: async () => {
      let query = supabase.from('points').select('owner_id, points');
      
      if (month && month !== 'all') {
        query = query.like('date_iso', `${month}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Aggregate by owner
      const pointsByOwner = new Map<string, number>();
      const rows = (data || []) as { owner_id: string; points: number }[];
      rows.forEach(p => {
        const current = pointsByOwner.get(p.owner_id) || 0;
        pointsByOwner.set(p.owner_id, current + p.points);
      });
      
      // Get owners
      const { data: owners, error: ownersError } = await supabase
        .from('owners')
        .select('*')
        .eq('active', true);
      
      if (ownersError) throw ownersError;
      
      // Build ranking
      const ownersList = (owners || []) as Owner[];
      const ranking = ownersList.map(owner => ({
        owner,
        points: pointsByOwner.get(owner.id) || 0,
      })).sort((a, b) => b.points - a.points);
      
      return ranking;
    },
  });
}

export function usePointsMonths() {
  return useQuery({
    queryKey: ['points_months'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points')
        .select('date_iso');
      
      if (error) throw error;
      
      const rows = (data || []) as { date_iso: string }[];
      const monthSet = new Set(
        rows.map(p => p.date_iso.substring(0, 7))
      );
      
      return Array.from(monthSet).sort().reverse();
    },
  });
}

export function useFilteredPoints(ownerId?: string, month?: string) {
  return useQuery({
    queryKey: ['filtered_points', ownerId, month],
    queryFn: async () => {
      let query = supabase.from('points').select('*').order('date_iso', { ascending: false });
      
      if (ownerId && ownerId !== 'all') {
        query = query.eq('owner_id', ownerId);
      }
      
      if (month && month !== 'all') {
        query = query.like('date_iso', `${month}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Points[];
    },
  });
}
