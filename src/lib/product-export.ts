import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Product } from '@/hooks/useProductsData';
import type { Marketplace } from '@/hooks/useMarketplacesData';

interface ExportData {
  products: Product[];
  skuTotals: Map<string, number>;
  marketplaces: Marketplace[];
  skuMarketplaces: Map<string, string[]>;
}

function getMarketplaceNames(
  marketplaceIds: string[] | undefined,
  marketplaces: Marketplace[]
): string {
  if (!marketplaceIds || marketplaceIds.length === 0) return '-';
  
  const names = marketplaceIds
    .map(id => {
      const mp = marketplaces.find(m => m.id === id);
      return mp?.name || id;
    })
    .sort();
  
  return names.join(', ');
}

function getStrategyLabel(strategy: string): string {
  switch (strategy) {
    case 'SINGLE': return 'Single';
    case 'KIT': return 'Kit';
    case 'BOTH': return 'Ambos';
    default: return strategy;
  }
}

export function exportProductsToExcel({ products, skuTotals, marketplaces, skuMarketplaces }: ExportData) {
  const data = products.map(p => ({
    'SKU': p.sku,
    'Canais': getMarketplaceNames(skuMarketplaces.get(p.sku), marketplaces),
    'Qtd Vendida': skuTotals.get(p.sku) || 0,
    'Categoria': p.category || '-',
    'Estratégia': getStrategyLabel(p.type_strategy),
    'Campeão': p.is_champion ? 'Sim' : 'Não',
    'Observações': p.notes || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  // Adjust column widths for A4 readability
  ws['!cols'] = [
    { wch: 30 },  // SKU
    { wch: 40 },  // Canais
    { wch: 12 },  // Qtd
    { wch: 20 },  // Categoria
    { wch: 12 },  // Estratégia
    { wch: 10 },  // Campeão
    { wch: 30 },  // Observações
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
  
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  XLSX.writeFile(wb, `Produtos_${dateStr}.xlsx`);
}

export function exportProductsToPDF({ products, skuTotals, marketplaces, skuMarketplaces }: ExportData) {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Catálogo de Produtos', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  
  const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  doc.text(`Gerado em: ${dateStr}`, 14, 28);
  
  const totalQty = Array.from(skuTotals.values()).reduce((a, b) => a + b, 0);
  doc.text(`Total: ${products.length} produtos | ${totalQty.toLocaleString('pt-BR')} unidades vendidas`, 14, 34);

  // Separator line
  doc.setDrawColor(200);
  doc.line(14, 38, pageWidth - 14, 38);

  // Table data
  const tableData = products.map(p => [
    p.sku,
    getMarketplaceNames(skuMarketplaces.get(p.sku), marketplaces),
    (skuTotals.get(p.sku) || 0).toLocaleString('pt-BR'),
    p.category || '-',
    getStrategyLabel(p.type_strategy),
    p.is_champion ? '★' : '-',
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['SKU', 'Canais', 'Qtd', 'Categoria', 'Estratégia', 'Campeão']],
    body: tableData,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },  // SKU
      1: { cellWidth: 55 },  // Canais
      2: { cellWidth: 18, halign: 'center' },  // Qtd
      3: { cellWidth: 35 },  // Categoria
      4: { cellWidth: 22, halign: 'center' },  // Estratégia
      5: { cellWidth: 18, halign: 'center' },  // Campeão
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer with page number
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });

  const pdfDateStr = format(new Date(), 'yyyy-MM-dd');
  doc.save(`Produtos_${pdfDateStr}.pdf`);
}
