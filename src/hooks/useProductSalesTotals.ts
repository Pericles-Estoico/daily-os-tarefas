import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProductSalesTotals() {
  return useQuery({
    queryKey: ['product-sales-totals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_by_sku')
        .select('sku, qty')
        .not('sku', 'is', null);

      if (error) throw error;

      // Aggregate: sku -> total qty
      const skuTotals = new Map<string, number>();
      for (const row of data || []) {
        if (!row.sku) continue;
        skuTotals.set(
          row.sku,
          (skuTotals.get(row.sku) || 0) + (row.qty || 0)
        );
      }
      return skuTotals;
    },
  });
}
