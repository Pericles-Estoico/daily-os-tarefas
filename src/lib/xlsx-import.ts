// ============================================
// XLSX Import - Importação de Planilhas
// ============================================

import type { KPIDaily, SalesBySKU, Marketplace } from '@/types/marketplace-ops';

export interface XLSXValidationError {
  row: number;
  column: string;
  error: string;
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
  
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  const colMap = {
    loja: headers.findIndex(h => h.includes('loja') || h.includes('marketplace')),
    pedidos: headers.findIndex(h => h.includes('pedidos') || h.includes('orders')),
    ticketMedio: headers.findIndex(h => h.includes('ticket') && h.includes('medio')),
    quantidade: headers.findIndex(h => h.includes('quantidade') || h.includes('qtd')),
    valor: headers.findIndex(h => h.includes('valor') && !h.includes('peca')),
    valorPeca: headers.findIndex(h => h.includes('valor') && h.includes('peca')),
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
  
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  const colMap = {
    codigo: headers.findIndex(h => h.includes('codigo') || h === 'sku'),
    quantidade: headers.findIndex(h => h.includes('quantidade') || h.includes('qtd')),
    valor: headers.findIndex(h => h.includes('valor') || h.includes('receita')),
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

export function downloadTemplate() {
  const template = `Loja,Pedidos,Ticket Médio,Quantidade,Valor,Valor Peça
Mercado Livre Matriz,85,176.47,120,15000.50,125.00
Shein,45,220.00,95,9900.00,104.21`;
  
  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template-total-dia.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
