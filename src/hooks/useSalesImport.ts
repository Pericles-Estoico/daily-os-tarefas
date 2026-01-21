// ============================================
// Hook para salvar KPIs e Vendas no Supabase
// ============================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

// ============================================
// Hook para buscar datas que possuem dados
// ============================================
export function useDatesWithData() {
  return useQuery({
    queryKey: ['dates_with_data'],
    queryFn: async () => {
      const { data: kpiDates, error } = await (supabase
        .from('kpi_daily') as any)
        .select('date_iso')
        .order('date_iso', { ascending: false });

      if (error) throw error;

      // Retorna datas únicas
      const uniqueDates = [...new Set(kpiDates?.map((k: any) => k.date_iso) || [])];
      return uniqueDates as string[];
    },
  });
}

// ============================================
// Hook para buscar contagem de dados por data
// ============================================
export function useDataCountByDate(dateISO: string | null) {
  return useQuery({
    queryKey: ['data_count_by_date', dateISO],
    queryFn: async () => {
      if (!dateISO) return { kpiCount: 0, salesCount: 0 };

      const [kpiResult, salesResult] = await Promise.all([
        (supabase.from('kpi_daily') as any)
          .select('id', { count: 'exact', head: true })
          .eq('date_iso', dateISO),
        (supabase.from('sales_by_sku') as any)
          .select('id', { count: 'exact', head: true })
          .eq('date_start', dateISO),
      ]);

      return {
        kpiCount: kpiResult.count || 0,
        salesCount: salesResult.count || 0,
      };
    },
    enabled: !!dateISO,
  });
}

// ============================================
// Hook para deletar dados de uma data específica
// ============================================
export function useDeleteDayData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dateISO: string) => {
      // Deletar KPIs da data
      const { error: kpiError } = await (supabase
        .from('kpi_daily') as any)
        .delete()
        .eq('date_iso', dateISO);

      if (kpiError) throw kpiError;

      // Deletar vendas da data
      const { error: salesError } = await (supabase
        .from('sales_by_sku') as any)
        .delete()
        .eq('date_start', dateISO);

      if (salesError) throw salesError;

      return { dateISO };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi_daily'] });
      queryClient.invalidateQueries({ queryKey: ['sales_by_sku'] });
      queryClient.invalidateQueries({ queryKey: ['today_kpis'] });
      queryClient.invalidateQueries({ queryKey: ['kpis_last_7_days'] });
      queryClient.invalidateQueries({ queryKey: ['dates_with_data'] });
      queryClient.invalidateQueries({ queryKey: ['data_count_by_date'] });
    },
  });
}
