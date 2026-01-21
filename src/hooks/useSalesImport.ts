// ============================================
// Hook para salvar KPIs e Vendas no Supabase
// ============================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface KPIData {
  date_iso: string;
  marketplace_id: string;
  gmv: number;
  orders: number;
  items: number | null;
  ticket_avg: number | null;
  note: string | null;
}

interface SalesData {
  date_start: string;
  date_end: string;
  marketplace_id: string;
  sku: string;
  qty: number;
  revenue: number;
  orders: number;
}

interface ConsolidatePayload {
  kpis: KPIData[];
  sales: SalesData[];
  dateISO: string;
}

export function useConsolidateSales() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kpis, sales, dateISO }: ConsolidatePayload) => {
      // 1. Auto-cadastro de SKUs faltantes (evita erro de foreign key)
      if (sales.length > 0) {
        const uniqueSkus = [...new Set(sales.map(s => s.sku))];

        const { data: existingProducts } = await (supabase
          .from('products') as any)
          .select('sku')
          .in('sku', uniqueSkus);

        const existingSkuSet = new Set(existingProducts?.map((p: any) => p.sku) || []);
        const newSkus = uniqueSkus.filter(sku => !existingSkuSet.has(sku));

        if (newSkus.length > 0) {
          const { error: productError } = await (supabase
            .from('products') as any)
            .insert(
              newSkus.map(sku => ({
                sku,
                name: sku,
                category: 'Importado Automaticamente',
                type_strategy: 'SINGLE',
                is_champion: false
              }))
            );

          if (productError) throw productError;
        }
      }

      // 2. Deletar KPIs existentes para esta data
      const deleteKpiResult = await (supabase
        .from('kpi_daily') as any)
        .delete()
        .eq('date_iso', dateISO);
      
      if (deleteKpiResult.error) throw deleteKpiResult.error;

      // 3. Deletar vendas existentes para esta data
      const deleteSalesResult = await (supabase
        .from('sales_by_sku') as any)
        .delete()
        .eq('date_start', dateISO);
      
      if (deleteSalesResult.error) throw deleteSalesResult.error;

      // 4. Inserir novos KPIs
      if (kpis.length > 0) {
        const insertKpiResult = await (supabase
          .from('kpi_daily') as any)
          .insert(kpis);

        if (insertKpiResult.error) throw insertKpiResult.error;
      }

      // 5. Inserir novas vendas
      if (sales.length > 0) {
        const insertSalesResult = await (supabase
          .from('sales_by_sku') as any)
          .insert(sales);

        if (insertSalesResult.error) throw insertSalesResult.error;
      }

      return { kpiCount: kpis.length, salesCount: sales.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi_daily'] });
      queryClient.invalidateQueries({ queryKey: ['sales_by_sku'] });
      queryClient.invalidateQueries({ queryKey: ['today_kpis'] });
      queryClient.invalidateQueries({ queryKey: ['kpis_last_7_days'] });
    },
  });
}
