// ============================================
// Insights Panel - Oportunidades e Alertas
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingUp, Package, Store, ArrowRight } from 'lucide-react';
import { useMarketplacesWithoutSales, useCrossSellOpportunities } from '@/hooks/useMarketplaceInsights';
import { formatCurrency } from '@/hooks/useOKRProportionalProgress';

interface InsightsPanelProps {
  startDate: string;
  endDate: string;
}

export function InsightsPanel({ startDate, endDate }: InsightsPanelProps) {
  const { data: mpWithoutSales, isLoading: loadingMP } = useMarketplacesWithoutSales(startDate, endDate);
  const { data: crossSell, isLoading: loadingCrossSell } = useCrossSellOpportunities(startDate, endDate);

  const isLoading = loadingMP || loadingCrossSell;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Marketplaces sem vendas */}
      <Card className={mpWithoutSales && mpWithoutSales.length > 0 ? 'border-yellow-500/50' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4" />
            Marketplaces sem Vendas
          </CardTitle>
          <CardDescription>Canais ativos sem GMV no período</CardDescription>
        </CardHeader>
        <CardContent>
          {mpWithoutSales && mpWithoutSales.length > 0 ? (
            <div className="space-y-2">
              {mpWithoutSales.slice(0, 5).map((mp) => (
                <div 
                  key={mp.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-sm">{mp.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">{mp.priority}</Badge>
                    <Badge variant="secondary" className="text-xs">{mp.stage}</Badge>
                  </div>
                </div>
              ))}
              {mpWithoutSales.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{mpWithoutSales.length - 5} outros marketplaces
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Todos os marketplaces têm vendas!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Oportunidades de Cross-Sell */}
      <Card className={crossSell && crossSell.length > 0 ? 'border-green-500/50' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Produtos para Expandir
          </CardTitle>
          <CardDescription>SKUs que podem ir para outros canais</CardDescription>
        </CardHeader>
        <CardContent>
          {crossSell && crossSell.length > 0 ? (
            <div className="space-y-2">
              {crossSell.slice(0, 4).map((opp) => (
                <div 
                  key={opp.sku} 
                  className="p-2 rounded-lg bg-green-500/10 border border-green-500/20"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm truncate flex-1">{opp.product_name}</span>
                    <Badge variant="outline" className="text-xs text-green-600 ml-2">
                      +{formatCurrency(opp.potential_revenue)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="truncate">{opp.selling_in.slice(0, 2).map(s => s.marketplace_name).join(', ')}</span>
                    <ArrowRight className="h-3 w-3 flex-shrink-0" />
                    <span className="text-green-600 font-medium">
                      {opp.missing_in.length} canais
                    </span>
                  </div>
                </div>
              ))}
              {crossSell.length > 4 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{crossSell.length - 4} outras oportunidades
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Importe dados de vendas por SKU para ver oportunidades</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
