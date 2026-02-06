// ============================================
// SEED DATA - Demo completo para testar filtros
// ============================================

import type { Marketplace, TaskTemplate, TaskInstance, AppState } from '@/types/marketplace-ops';

// ============================================
// Mercado Livre Matriz - Playbook Completo
// ============================================
const MERCADO_LIVRE_PLAYBOOK = `# Playbook: Mercado Livre Matriz

## 🎯 Objetivo
Escalar vendas de R$500/dia para R$10.000/dia com operação disciplinada e previsível.

---

## 📊 Stage: SCALE

### Rotina Diária (Seg-Sex)

#### 08:00 - [GLOBAL] Check Painel Geral
**Dono:** Péricles (CEO)
**Objetivo:** Visão geral dos números do dia anterior
**DoD:**
- [ ] Revisar GMV de todos os marketplaces
- [ ] Identificar desvios >10% vs meta
- [ ] Comunicar prioridades do dia no grupo

---

#### 09:00 - [ML] Proteção: Zeragem Perguntas/Reclamações
**Dono:** Elisangela
**Objetivo:** Manter reputação e evitar pausas/penalidades
**DoD:**
- [ ] Todas as perguntas respondidas (<24h)
- [ ] Todas as reclamações tratadas
- [ ] SLA verde (>95%)
- [ ] Screenshot do painel de reputação

**Quando abrir incidente:**
- Reclamação crítica (produto com defeito, atraso >5 dias)
- SLA <90%
- Alerta de pausa iminente

---

#### 10:00 - [ML] Higiene Top 20 SKUs
**Dono:** Elisangela
**Objetivo:** Garantir que produtos campeões estão otimizados
**DoD:**
- [ ] Conferir estoque dos Top 20 (>10 unidades)
- [ ] Conferir fotos/título/descrição
- [ ] Conferir preço competitivo (min 3 concorrentes)
- [ ] Ajustar se necessário

**KPIs:**
- 100% dos Top 20 com estoque OK
- 100% com preço competitivo (±5% do mercado)

---

#### 10:00 - [CFO] Conferir Fluxo de Caixa
**Dono:** Stella
**Objetivo:** Garantir liquidez e antecipar necessidades
**DoD:**
- [ ] Atualizar planilha com vendas D-1
- [ ] Conferir recebíveis ML (saldo a receber)
- [ ] Projetar próximos 7 dias
- [ ] Alertar se <R$5.000 disponível

---

#### 17:30 - [ML] Crescimento: 1 Alavanca do Dia
**Dono:** Elisangela
**Objetivo:** Testar 1 ação de crescimento por dia
**Alavancas possíveis:**
- Criar anúncio novo (produto inédito ou variação)
- Melhorar título/fotos de 1 produto
- Ativar frete grátis em 1 categoria
- Ajustar preço de 1 produto para ganhar Buy Box
- Criar combo/kit promocional

**DoD:**
- [ ] 1 ação executada
- [ ] Evidência (screenshot antes/depois)
- [ ] Hipótese documentada

---

## 🚨 Incidentes - Quando Abrir

### Crítico (resolver em <2h)
- Anúncio pausado/suspenso
- Estoque zerado em produto campeão
- SLA <85%
- Reclamação grave (produto errado, defeito)

### Alto (resolver em <24h)
- Preço fora da faixa competitiva (>15% diferença)
- Foto principal com problema
- Pergunta sem resposta >12h

### Médio (resolver em <48h)
- Descrição incompleta
- Categoria errada
- Título não otimizado

---

## 📈 Testes A/B - Biblioteca

### Teste 1: Frete Grátis
**Hipótese:** Ativar frete grátis aumenta conversão em 20%
**Como:** Selecionar 5 SKUs similares, ativar frete grátis em 3
**Medir:** Taxa de conversão (vendas/visitas) por 7 dias
**Decisão:** Manter se conversão >15% maior

### Teste 2: Título Otimizado
**Hipótese:** Título com palavra-chave no início aumenta visitas em 30%
**Como:** Reformatar título de 5 produtos
**Medir:** Visitas por 7 dias
**Decisão:** Manter se visitas >20% maior

### Teste 3: Foto Lifestyle
**Hipótese:** Foto com pessoa usando produto aumenta conversão em 25%
**Como:** Trocar foto principal de 5 produtos
**Medir:** Taxa de conversão por 7 dias
**Decisão:** Manter se conversão >15% maior

---

## 🎮 Gamificação - Pontos

### Pontuação por Tarefa
- Proteção (Perguntas/Reclamações): **50 pontos**
- Higiene (Top 20): **30 pontos**
- Crescimento (Alavanca): **100 pontos**
- Global (Check Painel): **20 pontos**

### Penalidades
- Pular tarefa crítica: **-50 pontos**
- Incidente crítico não resolvido <2h: **-100 pontos**

### Recompensas
- 1.000 pontos/mês: Jantar pago
- 2.000 pontos/mês: Bônus R$500
- 5.000 pontos/mês: Bônus R$1.500

---

## 🎯 Meta: R$10.000/dia

**Atual:** R$500/dia
**Crescimento necessário:** 20x
**Prazo:** 12 meses
**Estratégia:** +15% mês a mês

### Milestones
- M1: R$575/dia (+15%)
- M3: R$760/dia
- M6: R$1.500/dia
- M9: R$3.000/dia
- M12: R$10.000/dia

**Próxima revisão:** Primeiro dia de cada mês
`;

// ============================================
// SHEIN Seller Hub - Playbook 30 Dias (+30% GMV)
// ============================================
const SHEIN_PLAYBOOK = `# Playbook: SHEIN Seller Hub (+30% GMV em 30 dias)

## 🎯 Meta Operacional
**Resultado-alvo:** +30% no GMV em 30 dias com ciclos de otimização e escala.

**Premissas**
- Loja ativa, gerente de conta e histórico de performance.
- Catálogo limpo com dados de vendas e conversão.
- Tática agressiva orientada por dados.

---

## 📌 Fontes oficiais analisadas
- Seller Hub SHEIN (ferramentas, promoções e suporte).
- Central de ajuda / FAQs.

---

## 📈 Estrutura de ação (Ciclo 30 dias)

### 1) Poção Básica: Otimização de Listings (Dia 1–5)
**Objetivo:** Explosão de conversão orgânica e rank interno.

**Checklist operacional**
- **Títulos + Keywords:** palavras do SEARCH interno, variações de nome, termo principal no início.
- **Imagens conversivas:** multiview + lifestyle + close + tabela de tamanhos (3–5 imagens, alta resolução).
- **Atributos completos:** cor, tecido, guia de medidas, gênero, idade.

**Métricas de resposta**
- Conversão por SKU.
- CTR na busca.

---

### 2) Funil de Promoção Escalonada (Dia 5–15)
**Objetivo:** Tráfego + prova social + urgência.

**Ferramentas SHEIN**
- Campanhas event-driven (flash deals, sazonal).
- Listagens patrocinadas / slots em destaque.
- Cupons e descontos gerados pela SHEIN.

**Funil promocional em 3 níveis**
1. **Awareness (D5–D9):** Hero SKUs patrocinados + cupom 24h de frete grátis + % off.  
   **Meta:** CTR ≥ 8%, impressões top 10% categoria.
2. **Engagement (D10–D13):** flash 48h + bundles (ex.: body + conjunto).  
   **Meta:** conversão +10% vs baseline.
3. **Closure (D14–D15):** pop-up de urgência + push (quando disponível).  
   **Meta:** add-to-cart → checkout ≥ 20%.

---

### 3) Dados + Otimização (Dia 5–25)
**Objetivo:** Fechar ciclo de experimentação e escalar SKUs vencedores.

**KPIs no Seller Hub**
- GMV por SKU
- Taxa de retorno
- Conversão
- Visitas vs add-to-cart
- Ranking interno

**Ritual de decisão**
- Dias 5, 10, 15 e 20: ciclo relâmpago de 48h para ajuste de bids, orçamento e troca de SKUs.
- Realocar orçamento para top 20% produtos → +50% eficiência esperada.

---

### 4) Selo e Confiança (Dia 1–30)
**Objetivo:** Maximizar ranking e confiança.

- Ativar selo “vendedor indicado” (baixa taxa de cancelamento, envio rápido, alta avaliação).
- Maximizar avaliações 5★ com foto.
**Meta:** nota média ≥ 4.8.

---

### 5) Amplificação Off-Platform (Dia 7–30)
**Objetivo:** Alimentar tráfego externo para a SHEIN.

- Cross-link no app → catálogo SHEIN com cupom.
- Push segmentado por comportamento (remarketing).
- Promoções sincronizadas (cupom 48h + destaque SHEIN).

---

## 🔁 Loop de decisão (28–30 dias)

| Métrica | Meta 30 dias | Status |
| --- | --- | --- |
| GMV total | +30% vs mês anterior | 🧠 foco principal |
| Conversão média SKUs | ≥ +15% | base para escalar |
| CTR em campanhas | ≥ 8% | confirma relevância |
| Avaliação média | ≥ 4.8★ | confiança da loja |
| Taxa de devolução | ≤ 5% | sinal de qualidade |

**Filtro de priorização**
- SKU com baixa conversão em promoção → retirar budget → realocar para top performers.

---

## 📦 Playbook pronto para app (JSON/ETL friendly)
\`\`\`json
{
  "optimization_cycle": [
    { "day": 1, "task": "Refresh keywords / update titles + images" },
    { "day": 3, "task": "Enable sponsored listings for hero SKUs" },
    { "day": 5, "task": "Activate coupons & flash deals" },
    { "day": 7, "task": "Analytics review & budget optimize" },
    { "day": 10, "task": "Expand push & off-platform remarketing" }
  ],
  "metrics": ["GMV", "ConversionRate", "CTR", "Rating", "ReturnRate"],
  "target": { "GMV_growth": "30%", "Conversion_increase": "15%" },
  "actions_on_metrics": [
    { "if": "ConversionRate < threshold", "then": "swap SKU campaign allocation" },
    { "if": "CTR < threshold", "then": "adjust keywords / images" }
  ]
}
\`\`\`
`;

// ============================================
// Marketplace Demo
// ============================================
export const DEMO_MARKETPLACE: Marketplace = {
  id: 'meli-matriz',
  name: 'Mercado Livre Matriz',
  slug: 'mercado_livre_matriz',
  priority: 'P1',
  stage: 'SCALE',
  cadence: 'DAILY',
  ownerId: 'elisangela',
  isSelling: true,
  active: true,
  notes: 'Marketplace principal - foco em escalar de R$500 para R$10.000/dia',
  playbookMarkdown: MERCADO_LIVRE_PLAYBOOK,
};

export const SHEIN_MARKETPLACE: Marketplace = {
  id: 'shein',
  name: 'SHEIN Seller Hub',
  slug: 'shein_seller_hub',
  priority: 'P1',
  stage: 'SCALE',
  cadence: 'DAILY',
  ownerId: 'walistter',
  isSelling: true,
  active: true,
  notes: 'Playbook operacional 30 dias para +30% GMV com foco em performance.',
  playbookMarkdown: SHEIN_PLAYBOOK,
};

// ============================================
// Templates Demo
// ============================================
export const DEMO_TEMPLATES: TaskTemplate[] = [
  {
    id: 'tpl-global-check',
    title: '[GLOBAL] Check Painel Geral',
    marketplaceId: null, // Global
    ownerId: 'pericles',
    timeHHMM: '08:00',
    type: 'GLOBAL',
    severity: 'NORMAL',
    daysOfWeek: [1, 2, 3, 4, 5], // Seg-Sex
    DoD: 'Revisar GMV de todos os marketplaces, identificar desvios >10% vs meta, comunicar prioridades',
    isCritical: false,
    requireEvidence: false,
    active: true,
    description: '**Objetivo:** Ter visão geral dos números do dia anterior e alinhar prioridades.\n\n**Passos:**\n1. Abrir Dashboard\n2. Verificar GMV total vs meta\n3. Identificar marketplaces com desvio >10%\n4. Anotar 3 prioridades do dia\n5. Comunicar no grupo',
    steps: [
      { label: 'Revisar GMV de todos os marketplaces', required: true },
      { label: 'Identificar desvios >10% vs meta', required: true },
      { label: 'Comunicar prioridades do dia', required: true },
    ],
    expectedMinutes: 15,
    toolsLinks: [],
    whenToOpenIncident: 'GMV >20% abaixo da meta por 2 dias consecutivos',
    escalationRule: '',
    points: 20,
    penaltyPoints: 0,
  },
  {
    id: 'tpl-ml-protecao',
    title: '[ML] Proteção: Zeragem Perguntas/Reclamações',
    marketplaceId: 'meli-matriz',
    ownerId: 'elisangela',
    timeHHMM: '09:00',
    type: 'PROTECAO',
    severity: 'CRITICA',
    daysOfWeek: [1, 2, 3, 4, 5],
    DoD: 'Todas as perguntas respondidas (<24h), todas as reclamações tratadas, SLA verde (>95%), screenshot do painel',
    isCritical: true,
    requireEvidence: true,
    active: true,
    description: '**Objetivo:** Manter reputação impecável e evitar pausas/penalidades.\n\n**Passos:**\n1. Acessar painel do Mercado Livre\n2. Ir em "Perguntas" e responder TODAS (<24h)\n3. Ir em "Reclamações" e tratar TODAS\n4. Verificar SLA (deve estar >95%)\n5. Tirar screenshot do painel de reputação\n\n**ATENÇÃO:** Esta tarefa é CRÍTICA. Não pular nunca!',
    steps: [
      { label: 'Todas as perguntas respondidas (<24h)', required: true },
      { label: 'Todas as reclamações tratadas', required: true },
      { label: 'SLA verde (>95%)', required: true },
      { label: 'Screenshot do painel de reputação', required: true },
    ],
    expectedMinutes: 30,
    toolsLinks: ['https://www.mercadolivre.com.br/'],
    whenToOpenIncident: 'Reclamação crítica (defeito/atraso >5 dias), SLA <90%, alerta de pausa',
    escalationRule: 'Se SLA <85%, comunicar Péricles imediatamente',
    points: 50,
    penaltyPoints: -50,
  },
  {
    id: 'tpl-ml-higiene',
    title: '[ML] Higiene Top 20 SKUs',
    marketplaceId: 'meli-matriz',
    ownerId: 'elisangela',
    timeHHMM: '10:00',
    type: 'HIGIENE',
    severity: 'NORMAL',
    daysOfWeek: [1, 2, 3, 4, 5],
    DoD: 'Conferir estoque dos Top 20 (>10 unidades), fotos/título/descrição OK, preço competitivo (±5% do mercado)',
    isCritical: false,
    requireEvidence: false,
    active: true,
    description: '**Objetivo:** Garantir que produtos campeões estão sempre otimizados.\n\n**Passos:**\n1. Abrir relatório de Top 20 produtos (por GMV últimos 30 dias)\n2. Para cada produto:\n   - Conferir estoque (mínimo 10 unidades)\n   - Conferir fotos (mínimo 5, qualidade HD)\n   - Conferir título (palavra-chave no início)\n   - Conferir preço vs 3 concorrentes (±5%)\n3. Fazer ajustes necessários\n4. Anotar produtos que precisam de atenção',
    steps: [
      { label: 'Conferir estoque dos Top 20 (>10 unidades)', required: true },
      { label: 'Conferir fotos/título/descrição', required: true },
      { label: 'Conferir preço competitivo (±5% do mercado)', required: true },
      { label: 'Ajustar se necessário', required: false },
    ],
    expectedMinutes: 45,
    toolsLinks: ['https://www.mercadolivre.com.br/'],
    whenToOpenIncident: 'Produto Top 20 com estoque <5 unidades ou preço >15% fora da faixa',
    escalationRule: '',
    points: 30,
    penaltyPoints: 0,
  },
  {
    id: 'tpl-cfo-fluxo',
    title: '[CFO] Conferir Fluxo de Caixa',
    marketplaceId: null,
    ownerId: 'stella',
    timeHHMM: '10:00',
    type: 'GLOBAL',
    severity: 'NORMAL',
    daysOfWeek: [1, 2, 3, 4, 5],
    DoD: 'Planilha atualizada com vendas D-1, recebíveis conferidos, projeção 7 dias feita',
    isCritical: false,
    requireEvidence: false,
    active: true,
    description: '**Objetivo:** Garantir liquidez e antecipar necessidades de caixa.\n\n**Passos:**\n1. Abrir planilha de fluxo de caixa\n2. Inserir vendas do dia anterior\n3. Acessar painel do ML e conferir saldo a receber\n4. Atualizar projeção dos próximos 7 dias\n5. Se saldo disponível <R$5.000, alertar Péricles',
    steps: [
      { label: 'Atualizar planilha com vendas D-1', required: true },
      { label: 'Conferir recebíveis ML', required: true },
      { label: 'Projetar próximos 7 dias', required: true },
      { label: 'Alertar se <R$5.000 disponível', required: false },
    ],
    expectedMinutes: 20,
    toolsLinks: [],
    whenToOpenIncident: 'Saldo disponível <R$3.000 ou projeção negativa nos próximos 3 dias',
    escalationRule: 'Se crítico, comunicar Péricles imediatamente',
    points: 25,
    penaltyPoints: 0,
  },
  {
    id: 'tpl-ml-crescimento',
    title: '[ML] Crescimento: 1 Alavanca do Dia',
    marketplaceId: 'meli-matriz',
    ownerId: 'elisangela',
    timeHHMM: '17:30',
    type: 'CRESCIMENTO',
    severity: 'NORMAL',
    daysOfWeek: [1, 2, 3, 4, 5],
    DoD: '1 ação de crescimento executada, evidência (screenshot antes/depois), hipótese documentada',
    isCritical: false,
    requireEvidence: true,
    active: true,
    description: '**Objetivo:** Testar 1 ação de crescimento por dia para escalar vendas.\n\n**Alavancas possíveis:**\n- Criar anúncio novo (produto inédito ou variação)\n- Melhorar título/fotos de 1 produto\n- Ativar frete grátis em 1 categoria\n- Ajustar preço para ganhar Buy Box\n- Criar combo/kit promocional\n\n**Passos:**\n1. Escolher 1 alavanca do dia\n2. Tirar screenshot do ANTES\n3. Executar a ação\n4. Tirar screenshot do DEPOIS\n5. Documentar hipótese (ex: "Ativar frete grátis aumenta conversão em 20%")\n6. Marcar para medir resultado em 7 dias',
    steps: [
      { label: '1 ação executada', required: true },
      { label: 'Evidência (screenshot antes/depois)', required: true },
      { label: 'Hipótese documentada', required: true },
    ],
    expectedMinutes: 60,
    toolsLinks: ['https://www.mercadolivre.com.br/'],
    whenToOpenIncident: '',
    escalationRule: '',
    points: 100,
    penaltyPoints: 0,
  },
];

// ============================================
// Templates Demo - SHEIN
// ============================================
export const SHEIN_TEMPLATES: TaskTemplate[] = [
  {
    id: 'tpl-shein-listing-otimizacao',
    title: '[SHEIN] Higiene: Otimizar listings (títulos, imagens e atributos)',
    marketplaceId: 'shein',
    ownerId: 'walistter',
    timeHHMM: '09:30',
    type: 'HIGIENE',
    severity: 'NORMAL',
    daysOfWeek: [1, 3, 5],
    DoD: 'Top SKUs com títulos e keywords atualizados, 3-5 imagens HD e atributos completos',
    isCritical: false,
    requireEvidence: true,
    active: true,
    description: '**Objetivo:** Melhorar conversão orgânica e ranking interno.\n\n**Passos:**\n1. Abrir Search interno e identificar keywords mais usadas\n2. Atualizar título com termo principal no início\n3. Subir 3-5 imagens (multiview, lifestyle, close, tabela de tamanhos)\n4. Completar atributos (cor, tecido, gênero, idade)\n5. Registrar antes/depois',
    steps: [
      { label: 'Atualizar título com keyword principal', required: true },
      { label: 'Subir imagens HD (3-5)', required: true },
      { label: 'Completar atributos obrigatórios', required: true },
      { label: 'Registrar evidência', required: true },
    ],
    expectedMinutes: 60,
    toolsLinks: [],
    whenToOpenIncident: 'Queda de CTR >20% ou SKU campeão sem imagem válida',
    escalationRule: '',
    points: 40,
    penaltyPoints: 0,
  },
  {
    id: 'tpl-shein-patrocinados',
    title: '[SHEIN] Crescimento: Ativar listagens patrocinadas (Hero SKUs)',
    marketplaceId: 'shein',
    ownerId: 'walistter',
    timeHHMM: '10:30',
    type: 'CRESCIMENTO',
    severity: 'NORMAL',
    daysOfWeek: [2, 4],
    DoD: 'Campanhas ativas com Hero SKUs e meta de CTR ≥ 8%',
    isCritical: false,
    requireEvidence: true,
    active: true,
    description: '**Objetivo:** Aumentar tráfego e visibilidade.\n\n**Passos:**\n1. Selecionar 5-10 Hero SKUs por GMV\n2. Ativar listagens patrocinadas\n3. Definir orçamento inicial e prazo curto\n4. Monitorar CTR e ajustar bids',
    steps: [
      { label: 'Selecionar Hero SKUs', required: true },
      { label: 'Ativar patrocinados', required: true },
      { label: 'Configurar orçamento inicial', required: true },
      { label: 'Monitorar CTR (meta ≥ 8%)', required: true },
    ],
    expectedMinutes: 45,
    toolsLinks: [],
    whenToOpenIncident: 'CTR < 5% por 48h em Hero SKUs',
    escalationRule: '',
    points: 35,
    penaltyPoints: 0,
  },
  {
    id: 'tpl-shein-campanhas',
    title: '[SHEIN] Crescimento: Cupons + flash deals (48h)',
    marketplaceId: 'shein',
    ownerId: 'walistter',
    timeHHMM: '11:30',
    type: 'CRESCIMENTO',
    severity: 'NORMAL',
    daysOfWeek: [2, 5],
    DoD: 'Cupons e flash deals ativos com validade curta e bundles configurados',
    isCritical: false,
    requireEvidence: true,
    active: true,
    description: '**Objetivo:** Criar urgência e elevar conversão.\n\n**Passos:**\n1. Criar cupom de frete grátis + % off (24-48h)\n2. Ativar flash deal para SKUs selecionados\n3. Montar bundles (produto principal + complementar)\n4. Validar performance vs baseline',
    steps: [
      { label: 'Criar cupom com validade curta', required: true },
      { label: 'Ativar flash deal', required: true },
      { label: 'Configurar bundles', required: true },
      { label: 'Registrar conversão vs baseline', required: true },
    ],
    expectedMinutes: 50,
    toolsLinks: [],
    whenToOpenIncident: 'Conversão cair >10% em relação ao baseline',
    escalationRule: '',
    points: 40,
    penaltyPoints: 0,
  },
  {
    id: 'tpl-shein-analytics',
    title: '[SHEIN] Estratégia: Revisão de dados (GMV, CTR, conversão)',
    marketplaceId: 'shein',
    ownerId: 'walistter',
    timeHHMM: '15:00',
    type: 'ESTRATEGIA',
    severity: 'NORMAL',
    daysOfWeek: [1, 4],
    DoD: 'Dashboard revisado e plano de realocação de budget definido',
    isCritical: false,
    requireEvidence: false,
    active: true,
    description: '**Objetivo:** Realocar orçamento para top 20% SKUs.\n\n**Passos:**\n1. Revisar GMV por SKU\n2. Identificar CTR e conversão por campanha\n3. Pausar SKUs com baixa performance\n4. Realocar budget para top performers',
    steps: [
      { label: 'Revisar GMV por SKU', required: true },
      { label: 'Analisar CTR e conversão', required: true },
      { label: 'Pausar baixo desempenho', required: true },
      { label: 'Realocar orçamento', required: true },
    ],
    expectedMinutes: 45,
    toolsLinks: [],
    whenToOpenIncident: 'GMV total >20% abaixo da meta em 7 dias',
    escalationRule: '',
    points: 30,
    penaltyPoints: 0,
  },
  {
    id: 'tpl-shein-confianca',
    title: '[SHEIN] Proteção: Selo e confiança (avaliações 5★)',
    marketplaceId: 'shein',
    ownerId: 'walistter',
    timeHHMM: '16:00',
    type: 'PROTECAO',
    severity: 'NORMAL',
    daysOfWeek: [3],
    DoD: 'Avaliação média ≥ 4.8 e plano de melhoria de reviews executado',
    isCritical: false,
    requireEvidence: false,
    active: true,
    description: '**Objetivo:** Melhorar reputação e ranking.\n\n**Passos:**\n1. Verificar avaliação média da loja\n2. Solicitar reviews com foto para SKUs chave\n3. Mapear reclamações e corrigir causas\n4. Registrar ações de melhoria',
    steps: [
      { label: 'Verificar avaliação média', required: true },
      { label: 'Solicitar reviews com foto', required: true },
      { label: 'Corrigir principais causas de reclamação', required: true },
      { label: 'Registrar ações executadas', required: true },
    ],
    expectedMinutes: 30,
    toolsLinks: [],
    whenToOpenIncident: 'Avaliação média <4.7 ou devolução >5%',
    escalationRule: '',
    points: 25,
    penaltyPoints: 0,
  },
];

// ============================================
// Task Instances para HOJE (Demo)
// ============================================
export function generateDemoTasksForToday(): TaskInstance[] {
  const today = new Date().toISOString().split('T')[0];
  
  return [...DEMO_TEMPLATES, ...SHEIN_TEMPLATES].map((template) => ({
    id: `task-${template.id}-${today}`,
    templateId: template.id,
    dateISO: today,
    timeHHMM: template.timeHHMM,
    title: template.title,
    marketplaceId: template.marketplaceId,
    ownerId: template.ownerId,
    type: template.type,
    status: 'TODO' as const,
    isCritical: template.isCritical,
    requireEvidence: template.requireEvidence,
    DoD: template.DoD,
    description: template.description,
    evidenceUrl: null,
    completedAt: null,
    skippedReason: null,
    pointsAwarded: null,
    stepsState: template.steps.map(s => ({ label: s.label, checked: false })),
    notes: '',
  }));
}

// ============================================
// Aplicar Seed Data
// ============================================
export function applySeedData(currentState: AppState): AppState {
  return {
    ...currentState,
    marketplaces: [DEMO_MARKETPLACE, SHEIN_MARKETPLACE],
    templates: [...DEMO_TEMPLATES, ...SHEIN_TEMPLATES],
    tasks: generateDemoTasksForToday(),
  };
}
