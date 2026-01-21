import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch the history of marketplaces where each SKU has been sold.
 * Returns a Map of sku -> Set of marketplace_ids
 */
export function useProductMarketplaceHistory() {
  return useQuery({
    queryKey: ['product-marketplace-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_by_sku')
        .select('sku, marketplace_id')
        .not('sku', 'is', null)
        .not('marketplace_id', 'is', null);

      if (error) throw error;

      // Build a map of sku -> set of marketplace_ids
      const skuMarketplaces = new Map<string, Set<string>>();

      for (const row of data || []) {
        if (!row.sku || !row.marketplace_id) continue;
        
        if (!skuMarketplaces.has(row.sku)) {
          skuMarketplaces.set(row.sku, new Set());
        }
        skuMarketplaces.get(row.sku)!.add(row.marketplace_id);
      }

      return skuMarketplaces;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
