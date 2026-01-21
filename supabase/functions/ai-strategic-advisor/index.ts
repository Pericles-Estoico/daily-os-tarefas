import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KPIData {
  marketplace_id: string;
  marketplace_name?: string;
  gmv: number;
  orders: number;
}

interface SKUData {
  sku: string;
  marketplace_id: string;
  revenue: number;
  qty: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados do contexto atual
    const now = new Date();
    const year = 2026;
    const month = 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    const currentDay = now.getDate();
    const daysInMonth = 31;
    const daysRemaining = daysInMonth - currentDay;

    // Buscar KPIs do mês
    const { data: kpis } = await supabase
      .from('kpi_daily')
      .select('marketplace_id, gmv, orders')
      .gte('date_iso', startDate)
      .lte('date_iso', endDate);

    // Buscar marketplaces
    const { data: marketplaces } = await supabase
      .from('marketplaces')
      .select('id, name, priority, stage')
      .eq('active', true);

    // Buscar vendas por SKU
    const { data: salesBySku } = await supabase
      .from('sales_by_sku')
      .select('sku, marketplace_id, revenue, qty')
      .gte('date_start', startDate)
      .lte('date_end', endDate);

    // Buscar produtos
    const { data: products } = await supabase
      .from('products')
      .select('sku, name, is_champion');

    // Processar dados
    const mpMap = new Map((marketplaces || []).map(m => [m.id, m]));
    const productMap = new Map((products || []).map(p => [p.sku, p]));

    // Calcular totais
    const totalGMV = (kpis || []).reduce((sum, k) => sum + (k.gmv || 0), 0);
    const totalOrders = (kpis || []).reduce((sum, k) => sum + (k.orders || 0), 0);

    // Meta proporcional
    const targetMonthly = context?.targetMonthly || 300000;
    const targetToday = (targetMonthly / daysInMonth) * currentDay;
    const gap = Math.max(0, targetToday - totalGMV);
    const recoveryDaily = daysRemaining > 0 ? (targetMonthly - totalGMV) / daysRemaining : 0;

    // GMV por marketplace
    const gmvByMarketplace: Record<string, { gmv: number; orders: number; name: string }> = {};
    (kpis || []).forEach(k => {
      const mp = mpMap.get(k.marketplace_id);
      if (!gmvByMarketplace[k.marketplace_id]) {
        gmvByMarketplace[k.marketplace_id] = { gmv: 0, orders: 0, name: mp?.name || k.marketplace_id };
      }
      gmvByMarketplace[k.marketplace_id].gmv += k.gmv || 0;
      gmvByMarketplace[k.marketplace_id].orders += k.orders || 0;
    });

    // Marketplaces sem vendas
    const mpWithSales = new Set(Object.keys(gmvByMarketplace));
    const mpWithoutSales = (marketplaces || []).filter(m => !mpWithSales.has(m.id));

    // Top SKUs
    const skuRevenue: Record<string, number> = {};
    (salesBySku || []).forEach(s => {
      if (s.sku) {
        skuRevenue[s.sku] = (skuRevenue[s.sku] || 0) + (s.revenue || 0);
      }
    });
    const topSkus = Object.entries(skuRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([sku, revenue]) => ({
        sku,
        name: productMap.get(sku)?.name || sku,
        revenue,
      }));

    // SKUs vendendo bem em um canal mas não em outros
    const skuByMarketplace: Record<string, Set<string>> = {};
    (salesBySku || []).forEach(s => {
      if (s.sku && s.revenue > 0) {
        if (!skuByMarketplace[s.sku]) skuByMarketplace[s.sku] = new Set();
        skuByMarketplace[s.sku].add(s.marketplace_id);
      }
    });

    const crossSellOpportunities: { sku: string; name: string; sellingIn: string[]; missingIn: string[] }[] = [];
    const activeMarketplaceIds = new Set((marketplaces || []).map(m => m.id));
    
    Object.entries(skuByMarketplace).forEach(([sku, mpSet]) => {
      const missingIn = Array.from(activeMarketplaceIds).filter(mpId => !mpSet.has(mpId));
      if (missingIn.length > 0 && mpSet.size > 0) {
        crossSellOpportunities.push({
          sku,
          name: productMap.get(sku)?.name || sku,
          sellingIn: Array.from(mpSet).map(id => mpMap.get(id)?.name || id),
          missingIn: missingIn.map(id => mpMap.get(id)?.name || id),
        });
      }
    });

    // Formatar números
    const formatCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // Montar prompt rico com contexto
    const systemPrompt = `Você é um consultor especialista em e-commerce e marketplaces. Você analisa dados de vendas e fornece recomendações estratégicas claras e acionáveis.

CONTEXTO ATUAL (Janeiro 2026):

📊 RESUMO FINANCEIRO:
- Meta Mensal: ${formatCurrency(targetMonthly)}
- Meta Proporcional (até dia ${currentDay}): ${formatCurrency(targetToday)}
- GMV Atual: ${formatCurrency(totalGMV)}
- Gap: ${formatCurrency(gap)} (${((gap/targetToday)*100).toFixed(1)}% atrás)
- Para recuperar: ${formatCurrency(recoveryDaily)}/dia nos próximos ${daysRemaining} dias
- Projeção do mês: ${formatCurrency((totalGMV/currentDay)*daysInMonth)}

📦 VENDAS POR MARKETPLACE:
${Object.entries(gmvByMarketplace)
  .sort((a, b) => b[1].gmv - a[1].gmv)
  .map(([id, data]) => `- ${data.name}: ${formatCurrency(data.gmv)} (${data.orders} pedidos)`)
  .join('\n')}

⚠️ MARKETPLACES SEM VENDAS:
${mpWithoutSales.length > 0 
  ? mpWithoutSales.map(m => `- ${m.name} (${m.priority}, ${m.stage})`).join('\n')
  : 'Todos os marketplaces têm vendas!'}

🏆 TOP 10 SKUs:
${topSkus.map((s, i) => `${i+1}. ${s.name}: ${formatCurrency(s.revenue)}`).join('\n')}

🔄 OPORTUNIDADES DE CROSS-SELL (SKUs para expandir):
${crossSellOpportunities.slice(0, 5).map(o => 
  `- ${o.name}: Vende em [${o.sellingIn.join(', ')}], falta em [${o.missingIn.join(', ')}]`
).join('\n') || 'Nenhuma oportunidade identificada'}

DIRETRIZES:
1. Seja direto e prático
2. Dê no máximo 3-5 recomendações priorizadas
3. Inclua números específicos quando possível
4. Foque no que pode ser feito HOJE para melhorar os resultados
5. Se perguntas específicas forem feitas, responda diretamente
6. Use emojis para organizar a resposta`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-strategic-advisor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
