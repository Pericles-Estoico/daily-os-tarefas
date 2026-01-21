// ============================================
// Marketplace Insights & Cross-Sell Analysis
// ============================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types
interface MarketplaceSalesData {
  marketplace_id: string;
  marketplace_name: string;
  total_revenue: number;
  total_orders: number;
  has_sales: boolean;
}

interface SKUMarketplaceData {
  sku: string;
  product_name: string | null;
  marketplace_id: string;
  marketplace_name: string;
  revenue: number;
  qty: number;
}

interface CrossSellOpportunity {
  sku: string;
  product_name: string;
  selling_in: {
    marketplace_id: string;
    marketplace_name: string;
    revenue: number;
  }[];
  missing_in: {
    marketplace_id: string;
    marketplace_name: string;
  }[];
  potential_revenue: number;
}

interface MarketplaceWithoutSales {
  id: string;
  name: string;
  priority: string;
  stage: string;
  days_without_sales: number;
}

// ============================================
// Hook: Marketplaces sem vendas no período
// ============================================
export function useMarketplacesWithoutSales(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['marketplaces_without_sales', startDate, endDate],
    queryFn: async () => {
      // Buscar todos os marketplaces ativos
      const { data: marketplaces, error: mpError } = await supabase
        .from('marketplaces')
        .select('id, name, priority, stage')
        .eq('active', true)
        .order('priority');
      
      if (mpError) throw mpError;
      
      // Buscar vendas no período
      const { data: salesData, error: salesError } = await supabase
        .from('kpi_daily')
        .select('marketplace_id, gmv')
        .gte('date_iso', startDate)
        .lte('date_iso', endDate);
      
      if (salesError) throw salesError;
      
      // Marketplaces com vendas
      const marketplacesWithSales = new Set(
        (salesData || [])
          .filter(s => (s.gmv || 0) > 0)
          .map(s => s.marketplace_id)
      );
      
      // Filtrar marketplaces sem vendas
      const withoutSales: MarketplaceWithoutSales[] = (marketplaces || [])
        .filter(mp => !marketplacesWithSales.has(mp.id))
        .map(mp => ({
          id: mp.id,
          name: mp.name,
          priority: mp.priority,
          stage: mp.stage,
          days_without_sales: Math.ceil(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
          ) + 1,
        }));
      
      return withoutSales;
    },
  });
}

// ============================================
// Hook: Análise de vendas por marketplace
// ============================================
export function useMarketplaceSalesAnalysis(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['marketplace_sales_analysis', startDate, endDate],
    queryFn: async () => {
      // Buscar marketplaces ativos
      const { data: marketplaces, error: mpError } = await supabase
        .from('marketplaces')
        .select('id, name, priority')
        .eq('active', true);
      
      if (mpError) throw mpError;
      
      // Buscar KPIs agregados por marketplace
      const { data: kpis, error: kpiError } = await supabase
        .from('kpi_daily')
        .select('marketplace_id, gmv, orders')
        .gte('date_iso', startDate)
        .lte('date_iso', endDate);
      
      if (kpiError) throw kpiError;
      
      // Agregar por marketplace
      const salesMap = new Map<string, { revenue: number; orders: number }>();
      (kpis || []).forEach(row => {
        const current = salesMap.get(row.marketplace_id) || { revenue: 0, orders: 0 };
        salesMap.set(row.marketplace_id, {
          revenue: current.revenue + (row.gmv || 0),
          orders: current.orders + (row.orders || 0),
        });
      });
      
      const result: MarketplaceSalesData[] = (marketplaces || []).map(mp => {
        const sales = salesMap.get(mp.id) || { revenue: 0, orders: 0 };
        return {
          marketplace_id: mp.id,
          marketplace_name: mp.name,
          total_revenue: sales.revenue,
          total_orders: sales.orders,
          has_sales: sales.revenue > 0,
        };
      });
      
      return result.sort((a, b) => b.total_revenue - a.total_revenue);
    },
  });
}

// ============================================
// Hook: Oportunidades de Cross-Sell por SKU
// ============================================
export function useCrossSellOpportunities(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['cross_sell_opportunities', startDate, endDate],
    queryFn: async () => {
      // Buscar marketplaces ativos
      const { data: marketplaces, error: mpError } = await supabase
        .from('marketplaces')
        .select('id, name')
        .eq('active', true);
      
      if (mpError) throw mpError;
      
      // Buscar vendas por SKU
      const { data: salesData, error: salesError } = await supabase
        .from('sales_by_sku')
        .select('sku, marketplace_id, revenue, qty')
        .gte('date_start', startDate)
        .lte('date_end', endDate);
      
      if (salesError) throw salesError;
      
      // Buscar nomes dos produtos
      const { data: products } = await supabase
        .from('products')
        .select('sku, name');
      
      const productNames = new Map((products || []).map(p => [p.sku, p.name]));
      const mpNames = new Map((marketplaces || []).map(mp => [mp.id, mp.name]));
      const activeMarketplaceIds = new Set((marketplaces || []).map(mp => mp.id));
      
      // Agregar vendas por SKU + Marketplace
      const skuMarketplaceSales = new Map<string, Map<string, { revenue: number; qty: number }>>();
      
      (salesData || []).forEach(row => {
        if (!row.sku) return;
        
        if (!skuMarketplaceSales.has(row.sku)) {
          skuMarketplaceSales.set(row.sku, new Map());
        }
        
        const mpSales = skuMarketplaceSales.get(row.sku)!;
        const current = mpSales.get(row.marketplace_id) || { revenue: 0, qty: 0 };
        mpSales.set(row.marketplace_id, {
          revenue: current.revenue + (row.revenue || 0),
          qty: current.qty + (row.qty || 0),
        });
      });
      
      // Identificar oportunidades
      const opportunities: CrossSellOpportunity[] = [];
      
      skuMarketplaceSales.forEach((mpSales, sku) => {
        const sellingIn = Array.from(mpSales.entries())
          .filter(([mpId]) => activeMarketplaceIds.has(mpId))
          .map(([mpId, sales]) => ({
            marketplace_id: mpId,
            marketplace_name: mpNames.get(mpId) || mpId,
            revenue: sales.revenue,
          }))
          .filter(s => s.revenue > 0)
          .sort((a, b) => b.revenue - a.revenue);
        
        if (sellingIn.length === 0) return;
        
        // Marketplaces ativos onde o SKU não está vendendo
        const sellingInIds = new Set(sellingIn.map(s => s.marketplace_id));
        const missingIn = Array.from(activeMarketplaceIds)
          .filter(mpId => !sellingInIds.has(mpId))
          .map(mpId => ({
            marketplace_id: mpId,
            marketplace_name: mpNames.get(mpId) || mpId,
          }));
        
        if (missingIn.length > 0) {
          // Potencial estimado: média de vendas nos canais ativos
          const avgRevenue = sellingIn.reduce((sum, s) => sum + s.revenue, 0) / sellingIn.length;
          const potentialRevenue = avgRevenue * missingIn.length;
          
          opportunities.push({
            sku,
            product_name: productNames.get(sku) || sku,
            selling_in: sellingIn,
            missing_in: missingIn,
            potential_revenue: potentialRevenue,
          });
        }
      });
      
      // Ordenar por potencial de receita
      return opportunities.sort((a, b) => b.potential_revenue - a.potential_revenue).slice(0, 20);
    },
  });
}

// ============================================
// Hook: Top SKUs por Marketplace
// ============================================
export function useTopSKUsByMarketplace(marketplaceId: string, startDate: string, endDate: string, limit = 10) {
  return useQuery({
    queryKey: ['top_skus', marketplaceId, startDate, endDate, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_by_sku')
        .select('sku, revenue, qty')
        .eq('marketplace_id', marketplaceId)
        .gte('date_start', startDate)
        .lte('date_end', endDate)
        .order('revenue', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Buscar nomes dos produtos
      const skus = (data || []).map(d => d.sku).filter(Boolean);
      const { data: products } = await supabase
        .from('products')
        .select('sku, name')
        .in('sku', skus);
      
      const productNames = new Map((products || []).map(p => [p.sku, p.name]));
      
      return (data || []).map(row => ({
        sku: row.sku,
        product_name: productNames.get(row.sku || '') || row.sku,
        revenue: row.revenue || 0,
        qty: row.qty || 0,
      }));
    },
    enabled: !!marketplaceId,
  });
}

// ============================================
// Hook: Resumo de Insights do Período
// ============================================
export function useInsightsSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['insights_summary', startDate, endDate],
    queryFn: async () => {
      // Marketplaces ativos
      const { data: marketplaces } = await supabase
        .from('marketplaces')
        .select('id, name, priority')
        .eq('active', true);
      
      // KPIs do período
      const { data: kpis } = await supabase
        .from('kpi_daily')
        .select('marketplace_id, gmv, orders')
        .gte('date_iso', startDate)
        .lte('date_iso', endDate);
      
      // Calcular totais
      const totalGMV = (kpis || []).reduce((sum, k) => sum + (k.gmv || 0), 0);
      const totalOrders = (kpis || []).reduce((sum, k) => sum + (k.orders || 0), 0);
      
      // Marketplaces com vendas
      const mpWithSales = new Set(
        (kpis || []).filter(k => (k.gmv || 0) > 0).map(k => k.marketplace_id)
      );
      
      const totalActiveMP = (marketplaces || []).length;
      const mpWithSalesCount = mpWithSales.size;
      const mpWithoutSalesCount = totalActiveMP - mpWithSalesCount;
      
      // Dias no período
      const daysInPeriod = Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      
      // Dias com dados
      const uniqueDates = new Set((kpis || []).map(k => k.marketplace_id));
      const daysWithData = uniqueDates.size;
      
      return {
        totalGMV,
        totalOrders,
        totalActiveMP,
        mpWithSalesCount,
        mpWithoutSalesCount,
        daysInPeriod,
        daysWithData,
        avgDailyGMV: daysWithData > 0 ? totalGMV / daysWithData : 0,
      };
    },
  });
}
