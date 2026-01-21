// ============================================
// Hook para CRUD de Marketplaces no Supabase
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Marketplace as DBMarketplace } from '@/integrations/supabase/database.types';

// Re-export for convenience
export type Marketplace = DBMarketplace;

export function useMarketplaces() {
  return useQuery({
    queryKey: ['marketplaces'],
    queryFn: async (): Promise<Marketplace[]> => {
      const { data, error } = await supabase
        .from('marketplaces')
        .select('*')
        .order('priority', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Marketplace[];
    },
  });
}

export function useActiveMarketplaces() {
  return useQuery({
    queryKey: ['marketplaces', 'active'],
    queryFn: async (): Promise<Marketplace[]> => {
      const { data, error } = await supabase
        .from('marketplaces')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Marketplace[];
    },
  });
}

type MarketplaceInsert = Omit<Marketplace, 'created_at' | 'updated_at'>;

export function useCreateMarketplace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (marketplace: MarketplaceInsert): Promise<Marketplace> => {
      // Use explicit type assertion for the entire call
      const result = await (supabase
        .from('marketplaces') as any)
        .insert(marketplace)
        .select()
        .single();

      if (result.error) throw result.error;
      return result.data as Marketplace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaces'] });
    },
  });
}

export function useUpdateMarketplace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Marketplace> }): Promise<Marketplace> => {
      const result = await (supabase
        .from('marketplaces') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (result.error) throw result.error;
      return result.data as Marketplace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaces'] });
    },
  });
}

export function useDeleteMarketplace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const result = await (supabase
        .from('marketplaces') as any)
        .delete()
        .eq('id', id);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaces'] });
    },
  });
}
