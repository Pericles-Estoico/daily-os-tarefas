// ============================================
// XLSX Import - Importação de Planilhas
// ============================================

import type { KPIDaily, SalesBySKU, Marketplace } from '@/types/marketplace-ops';

export interface XLSXValidationError {
  row: number;
  column: string;
  error: string;
}

/**
 * Normaliza string removendo acentos, convertendo para lowercase e removendo espaços extras
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD') // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove marcas diacríticas (acentos)
    .replace(/\s+/g, ' ') // Substitui múltiplos espaços por um único
    .trim();
}

/**
 * Encontra índice de coluna de forma flexível (ignora case e acentos)
 */
function findColumnIndex(headers: string[], ...searchTerms: string[]): number {
  const normalizedHeaders = headers.map(h => normalizeString(h));
  
  for (const term of searchTerms) {
    const normalizedTerm = normalizeString(term);
    const index = normalizedHeaders.findIndex(h => h.includes(normalizedTerm));
    if (index !== -1) return index;
  }
  
  return -1;
}

export async function parseXLSXFile(file: File): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const data = lines.map(line => {
          const separator = line.includes('\t') ? '\t' : ',';
          return line.split(separator).map(cell => cell.trim());
        });
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Importa KPIs (Total do Dia)
 * Colunas: Loja, Pedidos, Ticket Médio, Quantidade, Valor, Valor Peça
 */
export function importKPIsFromSheet(
  data: any[][],
  existingMarketplaces: Marketplace[]
): { kpis: KPIDaily[]; errors: XLSXValidationError[] } {
  const kpis: KPIDaily[] = [];
  const errors: XLSXValidationError[] = [];
  
  const headers = data[0].map(h => String(h));
  
  // Busca flexível de colunas (ignora case e acentos)
  const colMap = {
    loja: findColumnIndex(headers, 'loja', 'marketplace', 'mercado'),
    pedidos: findColumnIndex(headers, 'pedidos', 'orders', 'pedido'),
    ticketMedio: findColumnIndex(headers, 'ticket medio', 'ticket médio', 'ticket'),
    quantidade: findColumnIndex(headers, 'quantidade', 'qtd', 'qtde'),
    valor: findColumnIndex(headers, 'valor total', 'valor', 'receita', 'faturamento'),
    valorPeca: findColumnIndex(headers, 'valor peca', 'valor peça', 'valor unitario', 'valor unitário'),
  };
  
  if (colMap.loja === -1 || colMap.valor === -1 || colMap.pedidos === -1) {
    errors.push({ row: 0, column: 'header', error: 'Colunas obrigatórias: Loja, Valor, Pedidos' });
    return { kpis, errors };
  }
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const rowNum = i + 1;
    
    try {
      const gmv = parseFloat(String(row[colMap.valor] || '0').replace(/[^\d.-]/g, ''));
      const orders = parseInt(String(row[colMap.pedidos] || '0').replace(/[^\d]/g, ''));
      const items = colMap.quantidade !== -1 ? parseInt(String(row[colMap.quantidade] || '0').replace(/[^\d]/g, '')) : undefined;
      const ticketAvg = colMap.ticketMedio !== -1 ? parseFloat(String(row[colMap.ticketMedio] || '0').replace(/[^\d.-]/g, '')) : undefined;
      
      if (isNaN(gmv) || isNaN(orders)) {
        errors.push({ row: rowNum, column: 'valor/pedidos', error: 'Valores inválidos' });
        continue;
      }
      
      const kpi: KPIDaily = {
        dateISO: '', // Será preenchido na importação
        marketplaceId: '', // Será preenchido na importação
        gmv,
        orders,
        items,
        ticketAvg,
        evidenceLinks: [],
        note: '',
      };
      
      kpis.push(kpi);
      
    } catch (error: any) {
      errors.push({ row: rowNum, column: 'geral', error: error.message });
    }
  }
  
  return { kpis, errors };
}

/**
 * Importa Vendas por SKU
 * Colunas: Código, Quantidade, Valor
 */
export function importSalesFromSheet(
  data: any[][],
  existingMarketplaces: Marketplace[]
): { sales: SalesBySKU[]; errors: XLSXValidationError[] } {
  const sales: SalesBySKU[] = [];
  const errors: XLSXValidationError[] = [];
  
  const headers = data[0].map(h => String(h));
  
  // Busca flexível de colunas (ignora case e acentos)
  const colMap = {
    codigo: findColumnIndex(headers, 'codigo', 'código', 'sku', 'cod', 'produto'),
    quantidade: findColumnIndex(headers, 'quantidade', 'qtd', 'qtde', 'qty'),
    valor: findColumnIndex(headers, 'valor', 'receita', 'faturamento', 'total'),
  };
  
  if (colMap.codigo === -1 || colMap.quantidade === -1 || colMap.valor === -1) {
    errors.push({ row: 0, column: 'header', error: 'Colunas obrigatórias: Código, Quantidade, Valor' });
    return { sales, errors };
  }
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const rowNum = i + 1;
    
    try {
      const sku = String(row[colMap.codigo]).trim();
      const qty = parseInt(String(row[colMap.quantidade] || '0').replace(/[^\d]/g, ''));
      const revenue = parseFloat(String(row[colMap.valor] || '0').replace(/[^\d.-]/g, ''));
      
      if (!sku || isNaN(qty) || isNaN(revenue)) {
        errors.push({ row: rowNum, column: 'codigo/quantidade/valor', error: 'Valores inválidos' });
        continue;
      }
      
      const sale: SalesBySKU = {
        dateStart: '', // Será preenchido
        dateEnd: '', // Será preenchido
        marketplaceId: '', // Será preenchido
        sku,
        qty,
        revenue,
        orders: 0,
      };
      
      sales.push(sale);
      
    } catch (error: any) {
      errors.push({ row: rowNum, column: 'geral', error: error.message });
    }
  }
  
  return { sales, errors };
}

/**
 * Download Template: Vendas Detalhadas por Marketplace
 * Colunas: Código (SKU), Quantidade, Valor
 */
export function downloadSalesTemplate() {
  const template = `Código,Quantidade,Valor
PROD-001,15,1875.00
PROD-002,8,960.00
PROD-003,22,3300.00
KIT-001,5,750.00`;
  
  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template-vendas-marketplace.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download Template: Resumo Total do Dia
 * Colunas: Loja, Pedidos, Ticket Médio, Quantidade, Valor, Valor Peça
 */
export function downloadSummaryTemplate() {
  const template = `Loja,Pedidos,Ticket Médio,Quantidade,Valor,Valor Peça
Mercado Livre Matriz,85,176.47,120,15000.50,125.00
Shein,45,220.00,95,9900.00,104.21
Amazon,32,195.50,68,6256.00,92.00`;
  
  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template-resumo-total-dia.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * @deprecated Use downloadSalesTemplate() ou downloadSummaryTemplate()
 */
export function downloadTemplate() {
  downloadSummaryTemplate();
}
