// ============================================
// XLSX Import - Importação de Planilhas
// Suporta arquivos binários .xlsx e .csv
// ============================================

import * as XLSX from 'xlsx';
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
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Encontra índice de coluna de forma flexível (ignora case e acentos)
 */
function findColumnIndex(headers: string[], ...searchTerms: string[]): number {
  const normalizedHeaders = headers.map(h => normalizeString(String(h || '')));
  
  for (const term of searchTerms) {
    const normalizedTerm = normalizeString(term);
    const index = normalizedHeaders.findIndex(h => h.includes(normalizedTerm));
    if (index !== -1) return index;
  }
  
  return -1;
}

/**
 * Parse valores monetários brasileiros
 * Exemplos: "R$ 1.420,58" → 1420.58, "61,62" → 61.62
 */
function parseMonetary(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const str = String(value);
  
  // Remove "R$", espaços e caracteres não-numéricos exceto vírgula/ponto
  const cleaned = str
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')      // Remove pontos de milhar
    .replace(',', '.');       // Vírgula decimal → ponto
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse valores inteiros
 */
function parseInteger(value: any): number {
  if (typeof value === 'number') return Math.floor(value);
  if (!value) return 0;
  
  const cleaned = String(value).replace(/[^\d]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse arquivo XLSX ou CSV
 * Retorna array de linhas (cada linha é um array de células)
 */
export async function parseXLSXFile(file: File): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        
        // Detecta tipo de arquivo
        const isCSV = file.name.toLowerCase().endsWith('.csv');
        
        if (isCSV) {
          // Parse CSV como texto
          const text = new TextDecoder().decode(data as ArrayBuffer);
          const lines = text.split('\n').filter(line => line.trim());
          const rows = lines.map(line => {
            const separator = line.includes('\t') ? '\t' : ',';
            return line.split(separator).map(cell => cell.trim());
          });
          resolve(rows);
        } else {
          // Parse XLSX/XLS binário
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { 
            header: 1,
            defval: '',
            raw: false // Retorna strings para melhor controle de parsing
          });
          resolve(jsonData as any[][]);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file); // Sempre lê como ArrayBuffer
  });
}

/**
 * Mapeia nome da loja na planilha para marketplace do banco
 */
export function matchLojaToMarketplace(
  lojaName: string,
  marketplaces: Marketplace[]
): Marketplace | null {
  const normalized = normalizeString(lojaName);
  
  // 1. Busca exata por slug
  let match = marketplaces.find(m => 
    normalizeString(m.slug) === normalized
  );
  if (match) return match;
  
  // 2. Busca por nome contém
  match = marketplaces.find(m => 
    normalizeString(m.name).includes(normalized) ||
    normalized.includes(normalizeString(m.name))
  );
  if (match) return match;
  
  // 3. Busca parcial mais flexível
  match = marketplaces.find(m => {
    const marketplaceWords = normalizeString(m.name).split(' ');
    const lojaWords = normalized.split(' ');
    // Se 2+ palavras coincidem, considera match
    const matchingWords = marketplaceWords.filter(w => 
      lojaWords.some(lw => lw.includes(w) || w.includes(lw))
    );
    return matchingWords.length >= 2;
  });
  if (match) return match;
  
  return null;
}

/**
 * Interface para resultado do parse do resumo diário
 */
export interface ParsedDailySummaryRow {
  lojaName: string;
  matchedMarketplace: Marketplace | null;
  pedidos: number;
  ticketMedio: number;
  quantidade: number;
  valor: number;
  valorPeca: number;
}

/**
 * Parse do arquivo de Resumo do Dia (Total)
 * Colunas: Loja, Pedidos, Ticket Médio, Quantidade, Valor, Valor Peça
 */
export function parseDailySummarySheet(
  data: any[][],
  marketplaces: Marketplace[]
): { rows: ParsedDailySummaryRow[]; errors: XLSXValidationError[] } {
  const rows: ParsedDailySummaryRow[] = [];
  const errors: XLSXValidationError[] = [];
  
  if (data.length < 2) {
    errors.push({ row: 0, column: 'header', error: 'Arquivo vazio ou sem dados' });
    return { rows, errors };
  }
  
  const headers = data[0].map(h => String(h || ''));
  
  const colMap = {
    loja: findColumnIndex(headers, 'loja', 'marketplace', 'mercado'),
    pedidos: findColumnIndex(headers, 'pedidos', 'orders', 'pedido'),
    ticketMedio: findColumnIndex(headers, 'ticket medio', 'ticket médio', 'ticket'),
    quantidade: findColumnIndex(headers, 'quantidade', 'qtd', 'qtde'),
    valor: findColumnIndex(headers, 'valor total', 'valor', 'receita', 'faturamento'),
    valorPeca: findColumnIndex(headers, 'valor peca', 'valor peça', 'valor unitario', 'valor unitário'),
  };
  
  if (colMap.loja === -1) {
    errors.push({ row: 0, column: 'header', error: 'Coluna "Loja" não encontrada' });
    return { rows, errors };
  }
  
  if (colMap.valor === -1) {
    errors.push({ row: 0, column: 'header', error: 'Coluna "Valor" não encontrada' });
    return { rows, errors };
  }
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const lojaName = String(row[colMap.loja] || '').trim();
    if (!lojaName) continue;
    
    // Ignora linha de total
    if (normalizeString(lojaName).includes('total')) continue;
    
    const matchedMarketplace = matchLojaToMarketplace(lojaName, marketplaces);
    
    rows.push({
      lojaName,
      matchedMarketplace,
      pedidos: parseInteger(row[colMap.pedidos]),
      ticketMedio: parseMonetary(row[colMap.ticketMedio]),
      quantidade: parseInteger(row[colMap.quantidade]),
      valor: parseMonetary(row[colMap.valor]),
      valorPeca: parseMonetary(row[colMap.valorPeca]),
    });
  }
  
  return { rows, errors };
}

/**
 * Interface para resultado do parse de vendas por SKU
 */
export interface ParsedSKUSaleRow {
  sku: string;
  quantidade: number;
  valor: number;
}

/**
 * Parse do arquivo de Vendas por SKU
 * Colunas: Código, Quantidade, Valor
 */
export function parseSKUSalesSheet(
  data: any[][]
): { rows: ParsedSKUSaleRow[]; errors: XLSXValidationError[] } {
  const rows: ParsedSKUSaleRow[] = [];
  const errors: XLSXValidationError[] = [];
  
  if (data.length < 2) {
    errors.push({ row: 0, column: 'header', error: 'Arquivo vazio ou sem dados' });
    return { rows, errors };
  }
  
  const headers = data[0].map(h => String(h || ''));
  
  const colMap = {
    codigo: findColumnIndex(headers, 'codigo', 'código', 'sku', 'cod', 'produto'),
    quantidade: findColumnIndex(headers, 'quantidade', 'qtd', 'qtde', 'qty'),
    valor: findColumnIndex(headers, 'valor', 'receita', 'faturamento', 'total'),
  };
  
  if (colMap.codigo === -1) {
    errors.push({ row: 0, column: 'header', error: 'Coluna "Código" não encontrada' });
    return { rows, errors };
  }
  
  if (colMap.quantidade === -1) {
    errors.push({ row: 0, column: 'header', error: 'Coluna "Quantidade" não encontrada' });
    return { rows, errors };
  }
  
  if (colMap.valor === -1) {
    errors.push({ row: 0, column: 'header', error: 'Coluna "Valor" não encontrada' });
    return { rows, errors };
  }
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const sku = String(row[colMap.codigo] || '').trim();
    if (!sku) continue;
    
    const quantidade = parseInteger(row[colMap.quantidade]);
    const valor = parseMonetary(row[colMap.valor]);
    
    if (quantidade === 0 && valor === 0) continue;
    
    rows.push({ sku, quantidade, valor });
  }
  
  return { rows, errors };
}

// ============================================
// Funções legadas (mantidas para compatibilidade)
// ============================================

/**
 * @deprecated Use parseDailySummarySheet() para melhor controle
 */
export function importKPIsFromSheet(
  data: any[][],
  existingMarketplaces: Marketplace[]
): { kpis: KPIDaily[]; errors: XLSXValidationError[] } {
  const kpis: KPIDaily[] = [];
  const errors: XLSXValidationError[] = [];
  
  const headers = data[0].map(h => String(h || ''));
  
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
      const gmv = parseMonetary(row[colMap.valor]);
      const orders = parseInteger(row[colMap.pedidos]);
      const items = colMap.quantidade !== -1 ? parseInteger(row[colMap.quantidade]) : undefined;
      const ticketAvg = colMap.ticketMedio !== -1 ? parseMonetary(row[colMap.ticketMedio]) : undefined;
      
      const kpi: KPIDaily = {
        dateISO: '',
        marketplaceId: '',
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
 * @deprecated Use parseSKUSalesSheet() para melhor controle
 */
export function importSalesFromSheet(
  data: any[][],
  existingMarketplaces: Marketplace[]
): { sales: SalesBySKU[]; errors: XLSXValidationError[] } {
  const sales: SalesBySKU[] = [];
  const errors: XLSXValidationError[] = [];
  
  const headers = data[0].map(h => String(h || ''));
  
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
      const qty = parseInteger(row[colMap.quantidade]);
      const revenue = parseMonetary(row[colMap.valor]);
      
      if (!sku) continue;
      
      const sale: SalesBySKU = {
        dateStart: '',
        dateEnd: '',
        marketplaceId: '',
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
