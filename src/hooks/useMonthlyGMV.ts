import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { KpiDaily } from '@/integrations/supabase/database.types';

export function useMonthlyGMV(year: number, month: number) {
  return useQuery({
    queryKey: ['monthly_gmv', year, month],
    queryFn: async () => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      const { data, error } = await supabase
        .from('kpi_daily')
        .select('gmv')
        .gte('date_iso', startDate)
        .lte('date_iso', endDate);
      
      if (error) throw error;
      
      return (data as Pick<KpiDaily, 'gmv'>[])?.reduce((sum, row) => sum + Number(row.gmv || 0), 0) || 0;
    },
  });
}
