// ============= TaskEngine — Motor de Geração de Tarefas =============

import type { Marketplace, TaskTemplate, RoutineTask, KPIEntry, Incident, Product, TaskStep } from '@/types';

interface TaskEngineContext {
  marketplaces: Marketplace[];
  kpiEntries: KPIEntry[];
  incidents: Incident[];
  products: Product[];
  existingTemplates: TaskTemplate[];
}

interface GeneratedTemplate {
  title: string;
  marketplaceId: string | null;
  ownerId: string;
  time: string;
  type: 'HIGIENE' | 'PROTECAO' | 'CRESCIMENTO' | 'SETUP' | 'ATIVACAO' | 'WEEKLY';
  category: string;
  dod: string;
  description: string;
  steps: TaskStep[];
  critical: boolean;
  evidenceRequired: boolean;
  points: number;
}

// Playbooks por canal (algoritmo específico)
export const CHANNEL_PLAYBOOKS: Record<string, {
  name: string;
  algorithm: string;
  scaleTasks: GeneratedTemplate[];
  setupTasks: GeneratedTemplate[];
  recoverTasks: GeneratedTemplate[];
}> = {
  'mercado-livre': {
    name: 'Mercado Livre',
    algorithm: 'Search + Reputação + Entrega',
    scaleTasks: [
      {
        title: '[ML] Top 20 anúncios (título SEO + atributos + variações)',
        marketplaceId: null,
        ownerId: '',
        time: '10:00',
        type: 'HIGIENE',
        category: 'HYGIENE',
        dod: 'Top 20 revisados: títulos, atributos e variações corretos',
        description: `## Objetivo
Manter os 20 anúncios mais vendidos otimizados para o algoritmo do ML.

## Por que é importante
O ML prioriza anúncios com títulos SEO, atributos completos e variações ativas.

## Como fazer
1. Acessar Seller Center
2. Ordenar por vendas (últimos 30 dias)
3. Verificar cada anúncio: título, atributos, variações, estoque`,
        steps: [
          { id: 's1', text: 'Acessar Seller Center ML', completed: false },
          { id: 's2', text: 'Ordenar por vendas 30d', completed: false },
          { id: 's3', text: 'Revisar título SEO de cada um', completed: false },
          { id: 's4', text: 'Verificar atributos completos', completed: false },
          { id: 's5', text: 'Confirmar variações ativas', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
      {
        title: '[ML] Perguntas/Reclamações (tempo resposta + resolução)',
        marketplaceId: null,
        ownerId: '',
        time: '12:00',
        type: 'PROTECAO',
        category: 'PROTECTION',
        dod: 'Todas perguntas respondidas <2h, reclamações zeradas',
        description: 'Responder perguntas e resolver reclamações para manter reputação.',
        steps: [
          { id: 's1', text: 'Acessar área de perguntas', completed: false },
          { id: 's2', text: 'Responder todas pendentes', completed: false },
          { id: 's3', text: 'Verificar reclamações abertas', completed: false },
          { id: 's4', text: 'Resolver ou escalonar', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
      {
        title: '[ML] Melhorar 1 anúncio (foto 1 + bullets + variações)',
        marketplaceId: null,
        ownerId: '',
        time: '17:30',
        type: 'CRESCIMENTO',
        category: 'GROWTH',
        dod: '1 anúncio otimizado com foto, bullets e variações',
        description: 'Melhorar um anúncio por dia para aumentar conversão.',
        steps: [
          { id: 's1', text: 'Escolher anúncio com potencial', completed: false },
          { id: 's2', text: 'Melhorar foto principal', completed: false },
          { id: 's3', text: 'Reescrever bullets', completed: false },
          { id: 's4', text: 'Adicionar variações se aplicável', completed: false },
        ],
        critical: false,
        evidenceRequired: true,
        points: 1,
      },
    ],
    setupTasks: [],
    recoverTasks: [
      {
        title: '[ML RECOVER] Zerar mensagens/reclamações',
        marketplaceId: null,
        ownerId: '',
        time: '10:00',
        type: 'PROTECAO',
        category: 'PROTECTION',
        dod: 'Zero mensagens e reclamações pendentes',
        description: 'Prioridade máxima: zerar caixa de entrada.',
        steps: [
          { id: 's1', text: 'Acessar mensagens', completed: false },
          { id: 's2', text: 'Responder TODAS', completed: false },
          { id: 's3', text: 'Resolver reclamações', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
      {
        title: '[ML RECOVER] Cortar origem de cancelamentos',
        marketplaceId: null,
        ownerId: '',
        time: '12:00',
        type: 'PROTECAO',
        category: 'PROTECTION',
        dod: 'SKUs problemáticos pausados ou corrigidos',
        description: 'Identificar e pausar SKUs causando cancelamentos.',
        steps: [
          { id: 's1', text: 'Analisar cancelamentos recentes', completed: false },
          { id: 's2', text: 'Identificar SKUs problemáticos', completed: false },
          { id: 's3', text: 'Pausar ou corrigir', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
      {
        title: '[ML RECOVER] Ajustar promessa entrega/frete/estoque',
        marketplaceId: null,
        ownerId: '',
        time: '16:00',
        type: 'PROTECAO',
        category: 'PROTECTION',
        dod: 'Promessas de entrega realistas, estoque atualizado',
        description: 'Ajustar configurações para evitar atrasos.',
        steps: [
          { id: 's1', text: 'Revisar prazos de envio', completed: false },
          { id: 's2', text: 'Atualizar estoque real', completed: false },
          { id: 's3', text: 'Ajustar frete se necessário', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
      {
        title: '[ML RECOVER] Revisar 1 anúncio crítico + pós-venda',
        marketplaceId: null,
        ownerId: '',
        time: '17:30',
        type: 'PROTECAO',
        category: 'PROTECTION',
        dod: 'Anúncio crítico revisado, política pós-venda clara',
        description: 'Revisar anúncio com mais problemas.',
        steps: [
          { id: 's1', text: 'Identificar anúncio mais problemático', completed: false },
          { id: 's2', text: 'Revisar completamente', completed: false },
          { id: 's3', text: 'Atualizar política pós-venda', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
    ],
  },
  'shopee': {
    name: 'Shopee',
    algorithm: 'Campanhas internas + Chat + Conversão',
    scaleTasks: [
      {
        title: '[SHOPEE] Top 20 (preço/estoque/cupom/vitrine)',
        marketplaceId: null,
        ownerId: '',
        time: '10:00',
        type: 'HIGIENE',
        category: 'HYGIENE',
        dod: 'Top 20 com preço, estoque e cupom configurados',
        description: 'Revisar os 20 produtos mais vendidos.',
        steps: [
          { id: 's1', text: 'Acessar Seller Center Shopee', completed: false },
          { id: 's2', text: 'Verificar estoque', completed: false },
          { id: 's3', text: 'Verificar preços competitivos', completed: false },
          { id: 's4', text: 'Configurar cupom se aplicável', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
      {
        title: '[SHOPEE] Chat/SLA (tempo resposta)',
        marketplaceId: null,
        ownerId: '',
        time: '12:00',
        type: 'PROTECAO',
        category: 'PROTECTION',
        dod: 'Taxa de resposta >95%, tempo <30min',
        description: 'Responder chat para manter SLA.',
        steps: [
          { id: 's1', text: 'Acessar chat Shopee', completed: false },
          { id: 's2', text: 'Responder mensagens pendentes', completed: false },
          { id: 's3', text: 'Verificar taxa de resposta', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
      {
        title: '[SHOPEE] Campanha/Voucher/Coleção (1 ação)',
        marketplaceId: null,
        ownerId: '',
        time: '17:30',
        type: 'CRESCIMENTO',
        category: 'GROWTH',
        dod: 'Pelo menos 1 ação de growth realizada',
        description: 'Configurar promoção, voucher ou coleção.',
        steps: [
          { id: 's1', text: 'Verificar campanhas disponíveis', completed: false },
          { id: 's2', text: 'Inscrever produtos ou criar voucher', completed: false },
          { id: 's3', text: 'Documentar ação', completed: false },
        ],
        critical: false,
        evidenceRequired: true,
        points: 1,
      },
    ],
    setupTasks: [],
    recoverTasks: [],
  },
  'shein': {
    name: 'Shein',
    algorithm: 'Curadoria + Listing',
    scaleTasks: [
      {
        title: '[SHEIN] Top 20 SKUs (estoque/variação/preço)',
        marketplaceId: null,
        ownerId: '',
        time: '10:00',
        type: 'HIGIENE',
        category: 'HYGIENE',
        dod: 'Top 20 SKUs com estoque, variações e preço corretos',
        description: 'Revisar os 20 SKUs mais vendidos.',
        steps: [
          { id: 's1', text: 'Acessar Seller Center Shein', completed: false },
          { id: 's2', text: 'Verificar estoque', completed: false },
          { id: 's3', text: 'Revisar variações ativas', completed: false },
          { id: 's4', text: 'Confirmar preços', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
      {
        title: '[SHEIN] Devolução/cancelamento (revisar motivos)',
        marketplaceId: null,
        ownerId: '',
        time: '16:30',
        type: 'PROTECAO',
        category: 'PROTECTION',
        dod: 'Motivos de devolução analisados, ações definidas',
        description: 'Analisar devoluções e cancelamentos.',
        steps: [
          { id: 's1', text: 'Acessar relatório de devoluções', completed: false },
          { id: 's2', text: 'Identificar padrões', completed: false },
          { id: 's3', text: 'Definir ações corretivas', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
      {
        title: '[SHEIN] Melhorar 1 listing (foto/descrição/atributos)',
        marketplaceId: null,
        ownerId: '',
        time: '17:30',
        type: 'CRESCIMENTO',
        category: 'GROWTH',
        dod: '1 listing otimizado',
        description: 'Melhorar um listing por dia.',
        steps: [
          { id: 's1', text: 'Escolher produto para otimizar', completed: false },
          { id: 's2', text: 'Melhorar foto', completed: false },
          { id: 's3', text: 'Atualizar descrição', completed: false },
          { id: 's4', text: 'Completar atributos', completed: false },
        ],
        critical: false,
        evidenceRequired: true,
        points: 1,
      },
    ],
    setupTasks: [],
    recoverTasks: [],
  },
  'tiktok': {
    name: 'TikTok Shop',
    algorithm: 'Discovery + Conteúdo',
    scaleTasks: [],
    setupTasks: [
      {
        title: '[TIKTOK] Publicar/otimizar 1 campeão Pareto',
        marketplaceId: null,
        ownerId: '',
        time: '10:00',
        type: 'SETUP',
        category: 'SETUP',
        dod: '1 produto campeão publicado/otimizado no catálogo',
        description: 'Publicar ou otimizar produto campeão.',
        steps: [
          { id: 's1', text: 'Escolher campeão Pareto', completed: false },
          { id: 's2', text: 'Criar/editar listing', completed: false },
          { id: 's3', text: 'Configurar preço e estoque', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
      {
        title: '[TIKTOK] 1 vídeo com produto linkado',
        marketplaceId: null,
        ownerId: '',
        time: '17:00',
        type: 'ATIVACAO',
        category: 'ACTIVATION',
        dod: '1 vídeo publicado com link de produto',
        description: 'Criar conteúdo com produto linkado.',
        steps: [
          { id: 's1', text: 'Gravar/editar vídeo', completed: false },
          { id: 's2', text: 'Publicar no TikTok', completed: false },
          { id: 's3', text: 'Linkar produto', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
    ],
    recoverTasks: [],
  },
  'loja': {
    name: 'Loja Própria',
    algorithm: 'Checkout + Kits + Meta Ads',
    scaleTasks: [],
    setupTasks: [
      {
        title: '[LOJA] Publicar/otimizar 1 KIT_HERO',
        marketplaceId: null,
        ownerId: '',
        time: '10:00',
        type: 'SETUP',
        category: 'SETUP',
        dod: '1 kit hero publicado com oferta principal',
        description: 'Publicar ou otimizar kit hero.',
        steps: [
          { id: 's1', text: 'Escolher kit para destaque', completed: false },
          { id: 's2', text: 'Criar/editar página do kit', completed: false },
          { id: 's3', text: 'Configurar preço e estoque', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
      {
        title: '[LOJA] Auditoria checkout (3 passos com prints)',
        marketplaceId: null,
        ownerId: '',
        time: '12:00',
        type: 'SETUP',
        category: 'SETUP',
        dod: 'Checkout testado, 3 prints de cada passo',
        description: 'Testar checkout completo e documentar.',
        steps: [
          { id: 's1', text: 'Adicionar produto ao carrinho', completed: false },
          { id: 's2', text: 'Preencher dados', completed: false },
          { id: 's3', text: 'Testar pagamento', completed: false },
          { id: 's4', text: 'Documentar com prints', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
      {
        title: '[LOJA] Preparar 1 criativo',
        marketplaceId: null,
        ownerId: '',
        time: '17:30',
        type: 'ATIVACAO',
        category: 'ACTIVATION',
        dod: '1 criativo pronto para ads',
        description: 'Preparar criativo mesmo com Ads OFF.',
        steps: [
          { id: 's1', text: 'Definir produto/oferta', completed: false },
          { id: 's2', text: 'Criar imagem/vídeo', completed: false },
          { id: 's3', text: 'Escrever copy', completed: false },
        ],
        critical: false,
        evidenceRequired: true,
        points: 1,
      },
    ],
    recoverTasks: [],
  },
  'financeiro': {
    name: 'Financeiro',
    algorithm: 'Conciliação + Controle',
    scaleTasks: [
      {
        title: '[FIN] Conciliação D-1 (saldo/extrato/3 maiores)',
        marketplaceId: null,
        ownerId: '',
        time: '09:10',
        type: 'HIGIENE',
        category: 'FINANCE',
        dod: 'Saldo conferido, 3 maiores entradas/saídas identificadas',
        description: `## Objetivo
Garantir visibilidade diária do fluxo de caixa.

## Como fazer
1. Acessar extratos bancários
2. Conferir saldo final vs sistema
3. Identificar 3 maiores entradas
4. Identificar 3 maiores saídas
5. Documentar discrepâncias`,
        steps: [
          { id: 's1', text: 'Acessar extrato bancário', completed: false },
          { id: 's2', text: 'Conferir saldo final', completed: false },
          { id: 's3', text: 'Identificar 3 maiores entradas', completed: false },
          { id: 's4', text: 'Identificar 3 maiores saídas', completed: false },
          { id: 's5', text: 'Documentar discrepâncias', completed: false },
        ],
        critical: true,
        evidenceRequired: true,
        points: 3,
      },
    ],
    setupTasks: [],
    recoverTasks: [],
  },
};

// Copilot suggestions based on context
export function generateCopilotSuggestions(context: TaskEngineContext): string[] {
  const suggestions: string[] = [];
  const today = new Date().toISOString().split('T')[0];
  
  // Check for red KPIs
  const recentKPIs = context.kpiEntries.filter(k => {
    const kpiDate = new Date(k.date);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return kpiDate >= threeDaysAgo;
  });
  
  const redKPIs = recentKPIs.filter(k => k.semaforo === 'RED');
  if (redKPIs.length > 0) {
    suggestions.push(`⚠️ ${redKPIs.length} KPIs vermelhos detectados. Considere abrir incidentes e priorizar PROTECTION.`);
  }
  
  // Check for open critical incidents
  const criticalIncidents = context.incidents.filter(i => 
    i.severity === 'CRITICAL' && (i.status === 'OPEN' || i.status === 'IN_PROGRESS')
  );
  if (criticalIncidents.length > 0) {
    suggestions.push(`🚨 ${criticalIncidents.length} incidente(s) CRITICAL aberto(s). GROWTH bloqueado até resolução.`);
  }
  
  // Check for RECOVER marketplaces
  const recoverMarketplaces = context.marketplaces.filter(m => m.stage === 'RECOVER');
  if (recoverMarketplaces.length > 0) {
    suggestions.push(`🔴 ${recoverMarketplaces.map(m => m.name).join(', ')} em RECOVER. Sprint de 7 dias ativo.`);
  }
  
  // Check for SETUP_SPRINT marketplaces without templates
  const setupMarketplaces = context.marketplaces.filter(m => 
    m.stage === 'SETUP' && m.cadence === 'SETUP_SPRINT'
  );
  const setupWithoutTemplates = setupMarketplaces.filter(m => 
    !context.existingTemplates.some(t => t.marketplaceId === m.id && t.isActive)
  );
  if (setupWithoutTemplates.length > 0) {
    suggestions.push(`📋 ${setupWithoutTemplates.map(m => m.name).join(', ')} sem templates. Gere templates padrão.`);
  }
  
  // Check for champion products not in any marketplace
  const championsNotSelling = context.products.filter(p => 
    p.isChampion && p.marketplacesSelling.length === 0
  );
  if (championsNotSelling.length > 0) {
    suggestions.push(`🏆 ${championsNotSelling.length} produtos campeões não estão em nenhum canal. Considere ativar.`);
  }
  
  // Month-end reminder
  const today2 = new Date();
  const lastDayOfMonth = new Date(today2.getFullYear(), today2.getMonth() + 1, 0).getDate();
  if (today2.getDate() >= lastDayOfMonth - 2) {
    suggestions.push(`📅 Fim do mês se aproximando. Verifique se as tarefas do próximo mês foram geradas.`);
  }
  
  return suggestions.slice(0, 5);
}

// Generate default templates for a marketplace based on its stage
export function generateDefaultTemplates(
  marketplace: Marketplace,
  champions: Product[]
): Partial<TaskTemplate>[] {
  const templates: Partial<TaskTemplate>[] = [];
  
  // Find matching playbook
  let playbookKey = 'shopee'; // default
  if (marketplace.name.toLowerCase().includes('mercado livre') || marketplace.name.toLowerCase().includes('ml')) {
    playbookKey = 'mercado-livre';
  } else if (marketplace.name.toLowerCase().includes('shein')) {
    playbookKey = 'shein';
  } else if (marketplace.name.toLowerCase().includes('tiktok')) {
    playbookKey = 'tiktok';
  } else if (marketplace.name.toLowerCase().includes('loja') || marketplace.name.toLowerCase().includes('miniatto')) {
    playbookKey = 'loja';
  } else if (marketplace.name.toLowerCase().includes('kuai')) {
    playbookKey = 'tiktok'; // Similar to TikTok
  }
  
  const playbook = CHANNEL_PLAYBOOKS[playbookKey];
  if (!playbook) return templates;
  
  const baseTasks = marketplace.stage === 'RECOVER' 
    ? playbook.recoverTasks 
    : marketplace.stage === 'SETUP' || marketplace.cadence === 'SETUP_SPRINT'
    ? playbook.setupTasks
    : playbook.scaleTasks;
  
  baseTasks.forEach(task => {
    templates.push({
      marketplaceId: marketplace.id,
      ownerId: marketplace.ownerId,
      time: task.time,
      type: task.type,
      title: task.title.replace(/\[.*?\]/, `[${marketplace.name.toUpperCase()}]`),
      dod: task.dod,
      description: task.description,
      steps: task.steps.map(s => ({ ...s, id: crypto.randomUUID() })),
      inputs: [],
      outputs: [],
      commonMistakes: [],
      timeboxMinutes: 30,
      toolsLinks: [],
      evidenceExamples: ['Print da tela mostrando tarefa concluída'],
      escalationRule: 'Se não conseguir completar, escalonar para o gestor.',
      evidenceRequired: task.evidenceRequired,
      critical: task.critical,
      points: task.points,
      weekDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
      isActive: true,
    });
  });
  
  return templates;
}

// Calculate tasks per day based on stage and priority
export function getTasksPerDay(stage: string, priority: string): number {
  if (stage === 'RECOVER') return 4;
  if (stage === 'SETUP' || stage === 'SETUP_SPRINT') return 2;
  if (priority === 'P1') return 3;
  if (priority === 'P2') return 2;
  if (priority === 'P3') return 1;
  return 1;
}

// Check if GROWTH tasks should be blocked for a marketplace
export function isGrowthBlocked(
  marketplaceId: string,
  marketplaces: Marketplace[],
  incidents: Incident[]
): boolean {
  const marketplace = marketplaces.find(m => m.id === marketplaceId);
  if (!marketplace) return false;
  
  // Block if in RECOVER
  if (marketplace.stage === 'RECOVER') return true;
  
  // Block if has CRITICAL incident open
  const hasCriticalIncident = incidents.some(i => 
    i.marketplaceId === marketplaceId && 
    i.severity === 'CRITICAL' && 
    (i.status === 'OPEN' || i.status === 'IN_PROGRESS')
  );
  
  return hasCriticalIncident;
}
