// ============================================
// Daily Analysis Engine - Análise Inteligente
// ============================================

import type { 
  DailyAnalysis, 
  KPIDaily, 
  SalesBySKU, 
  Marketplace,
  Incident,
  AppState
} from '@/types/marketplace-ops';

/**
 * Analisa os dados do dia e gera insights automáticos
 */
export function analyzeDailyData(
  dateISO: string,
  kpis: KPIDaily[],
  sales: SalesBySKU[],
  marketplaces: Marketplace[],
  previousKpis: KPIDaily[],
  dailyGoal: number
): DailyAnalysis {
  
  // Filtrar KPIs do dia
  const dayKpis = kpis.filter(k => k.dateISO === dateISO);
  const daySales = sales.filter(s => s.dateStart === dateISO || s.dateEnd === dateISO);
  
  // Totais
  const totalGMV = dayKpis.reduce((sum, k) => sum + k.gmv, 0);
  const totalOrders = dayKpis.reduce((sum, k) => sum + k.orders, 0);
  const totalItems = dayKpis.reduce((sum, k) => sum + (k.items || 0), 0);
  
  // Meta
  const goalReached = totalGMV >= dailyGoal;
  const percentOfGoal = (totalGMV / dailyGoal) * 100;
  
  // Breakdown por marketplace
  const marketplaceBreakdown = dayKpis.map(kpi => ({
    marketplaceId: kpi.marketplaceId,
    gmv: kpi.gmv,
    orders: kpi.orders,
    items: kpi.items || 0,
    percentOfTotal: totalGMV > 0 ? (kpi.gmv / totalGMV) * 100 : 0,
  })).sort((a, b) => b.gmv - a.gmv);
  
  // Top produtos (Pareto)
  const productSales = new Map<string, { revenue: number; qty: number }>();
  daySales.forEach(sale => {
    const existing = productSales.get(sale.sku) || { revenue: 0, qty: 0 };
    productSales.set(sale.sku, {
      revenue: existing.revenue + sale.revenue,
      qty: existing.qty + sale.qty,
    });
  });
  
  const topProducts = Array.from(productSales.entries())
    .map(([sku, data]) => ({
      sku,
      revenue: data.revenue,
      qty: data.qty,
      percentOfTotal: totalGMV > 0 ? (data.revenue / totalGMV) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  
  // Detectar incidentes automáticos
  const autoIncidents: DailyAnalysis['autoIncidents'] = [];
  
  // Ontem
  const yesterday = new Date(dateISO);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().split('T')[0];
  const yesterdayKpis = previousKpis.filter(k => k.dateISO === yesterdayISO);
  
  marketplaces.forEach(marketplace => {
    const todayKpi = dayKpis.find(k => k.marketplaceId === marketplace.id);
    const yesterdayKpi = yesterdayKpis.find(k => k.marketplaceId === marketplace.id);
    
    // Incidente: Zero vendas
    if (todayKpi && todayKpi.gmv === 0 && marketplace.isSelling) {
      autoIncidents.push({
        severity: 'ALTA',
        marketplaceId: marketplace.id,
        issue: 'Zero vendas no dia',
        suggestion: 'Verificar anúncios ativos, estoque e ranking',
      });
    }
    
    // Incidente: Queda brusca (>40%)
    if (todayKpi && yesterdayKpi && yesterdayKpi.gmv > 0) {
      const drop = ((yesterdayKpi.gmv - todayKpi.gmv) / yesterdayKpi.gmv) * 100;
      if (drop > 40) {
        autoIncidents.push({
          severity: 'CRITICA',
          marketplaceId: marketplace.id,
          issue: `Queda de ${drop.toFixed(1)}% vs ontem`,
          suggestion: 'Investigar ranking, estoque, concorrência',
        });
      }
    }
    
    // Incidente: Não importado (esperado mas não veio)
    if (!todayKpi && marketplace.active && marketplace.isSelling) {
      autoIncidents.push({
        severity: 'MEDIA',
        marketplaceId: marketplace.id,
        issue: 'Dados não importados',
        suggestion: 'Verificar se houve vendas e importar',
      });
    }
  });
  
  // Evolução
  const yesterdayTotal = yesterdayKpis.reduce((sum, k) => sum + k.gmv, 0);
  const vsYesterday = yesterdayTotal > 0 
    ? ((totalGMV - yesterdayTotal) / yesterdayTotal) * 100 
    : 0;
  
  // Projeção mensal (média até agora * 30 dias)
  const dayOfMonth = new Date(dateISO).getDate();
  const monthProjection = dayOfMonth > 0 ? (totalGMV / dayOfMonth) * 30 : 0;
  
  return {
    dateISO,
    goalDaily: dailyGoal,
    totalGMV,
    totalOrders,
    totalItems,
    goalReached,
    percentOfGoal,
    marketplaceBreakdown,
    topProducts,
    autoIncidents,
    evolution: {
      vsYesterday,
      monthProjection,
    },
    analyzed: true,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Cria incidentes automáticos no sistema
 */
export function createAutoIncidents(
  analysis: DailyAnalysis,
  currentOwnerId: string,
  marketplaces: Marketplace[]
): Incident[] {
  const incidents: Incident[] = [];
  
  analysis.autoIncidents.forEach((autoInc, index) => {
    const marketplace = marketplaces.find(m => m.id === autoInc.marketplaceId);
    
    incidents.push({
      id: `auto_${analysis.dateISO}_${autoInc.marketplaceId}_${index}`,
      createdAt: new Date().toISOString(),
      marketplaceId: autoInc.marketplaceId,
      ownerId: marketplace?.ownerId || currentOwnerId,
      severity: autoInc.severity,
      title: `${marketplace?.name || autoInc.marketplaceId}: ${autoInc.issue}`,
      description: `Incidente detectado automaticamente na análise do dia ${analysis.dateISO}.\n\n${autoInc.suggestion}`,
      evidenceLinks: [],
      rootCause: '',
      correctiveAction: autoInc.suggestion,
      validationTests: [
        { label: 'Verificar causa raiz', done: false },
        { label: 'Implementar ação corretiva', done: false },
        { label: 'Validar resultado', done: false },
      ],
      status: 'A_FAZER',
      dueDate: analysis.dateISO,
      autoCreated: true,
    });
  });
  
  return incidents;
}

/**
 * Gera resumo textual da análise
 */
export function generateAnalysisSummary(analysis: DailyAnalysis): string {
  const lines: string[] = [];
  
  lines.push(`📊 ANÁLISE DO DIA ${analysis.dateISO}`);
  lines.push('');
  
  // Meta
  if (analysis.goalReached) {
    lines.push(`✅ META ATINGIDA! R$ ${analysis.totalGMV.toLocaleString('pt-BR')} (${analysis.percentOfGoal.toFixed(1)}%)`);
  } else {
    const gap = analysis.goalDaily - analysis.totalGMV;
    lines.push(`⚠️ META NÃO ATINGIDA: R$ ${analysis.totalGMV.toLocaleString('pt-BR')} (${analysis.percentOfGoal.toFixed(1)}%)`);
    lines.push(`   Faltaram R$ ${gap.toLocaleString('pt-BR')}`);
  }
  lines.push('');
  
  // Ranking
  lines.push('🏆 RANKING DE MARKETPLACES:');
  analysis.marketplaceBreakdown.slice(0, 5).forEach((m, i) => {
    lines.push(`${i + 1}. ${m.marketplaceId} - R$ ${m.gmv.toLocaleString('pt-BR')} (${m.percentOfTotal.toFixed(1)}%)`);
  });
  lines.push('');
  
  // Top produtos
  if (analysis.topProducts.length > 0) {
    lines.push('🔥 TOP 5 PRODUTOS:');
    analysis.topProducts.slice(0, 5).forEach((p, i) => {
      lines.push(`${i + 1}. ${p.sku} - R$ ${p.revenue.toLocaleString('pt-BR')} (${p.percentOfTotal.toFixed(1)}%)`);
    });
    lines.push('');
  }
  
  // Evolução
  if (analysis.evolution.vsYesterday !== undefined) {
    const sign = analysis.evolution.vsYesterday > 0 ? '+' : '';
    const emoji = analysis.evolution.vsYesterday > 0 ? '📈' : '📉';
    lines.push(`${emoji} VS ONTEM: ${sign}${analysis.evolution.vsYesterday.toFixed(1)}%`);
  }
  
  if (analysis.evolution.monthProjection) {
    lines.push(`📅 PROJEÇÃO MENSAL: R$ ${analysis.evolution.monthProjection.toLocaleString('pt-BR')}`);
  }
  lines.push('');
  
  // Incidentes
  if (analysis.autoIncidents.length > 0) {
    lines.push(`🚨 ${analysis.autoIncidents.length} INCIDENTES DETECTADOS`);
  } else {
    lines.push('✅ NENHUM INCIDENTE DETECTADO');
  }
  
  return lines.join('\n');
}
