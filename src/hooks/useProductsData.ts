import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductTypeStrategy } from '@/integrations/supabase/database.types';

// Re-export for convenience
export type { Product };

interface ProductInsert {
  sku: string;
  name: string;
  category?: string | null;
  type_strategy: ProductTypeStrategy;
  is_champion: boolean;
  notes?: string | null;
}

// Hook para buscar todos os produtos
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('products') as any)
        .select('*')
        .order('sku');
      
      if (error) throw error;
      return (data as Product[]) || [];
    },
  });
}

// Hook para criar produto
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const { data, error } = await (supabase
        .from('products') as any)
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Hook para atualizar produto
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sku, updates }: { sku: string; updates: Partial<ProductInsert> }) => {
      const { data, error } = await (supabase
        .from('products') as any)
        .update(updates)
        .eq('sku', sku)
        .select()
        .single();
      
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Hook para deletar produto
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sku: string) => {
      const { error } = await (supabase
        .from('products') as any)
        .delete()
        .eq('sku', sku);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
