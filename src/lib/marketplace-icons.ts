/**
 * Marketplace icon configuration and utilities
 * Provides visual differentiation for similar channels
 */

export interface MarketplaceIconConfig {
  label: string;       // Short label (e.g., "ML", "SP")
  bgColor: string;     // Tailwind bg class
  textColor: string;   // Tailwind text class  
  borderColor?: string; // Optional border for variants
  suffix?: string;     // Optional suffix for sub-stores (e.g., "²")
}

/**
 * Get icon configuration for a marketplace based on its ID and name
 */
export function getMarketplaceIconConfig(id: string, name: string): MarketplaceIconConfig {
  const idLower = id.toLowerCase();
  const nameLower = name.toLowerCase();

  // Mercado Livre
  if (idLower.includes('meli') || idLower.includes('mercado') || nameLower.includes('mercado livre')) {
    const isMatriz = nameLower.includes('matriz');
    const is150 = nameLower.includes('1:50') || nameLower.includes('150') || idLower.includes('150');
    
    if (isMatriz) {
      return {
        label: 'ML',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
      };
    }
    if (is150) {
      return {
        label: 'ML',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-green-500',
        suffix: '²',
      };
    }
    // Generic ML
    return {
      label: 'ML',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
    };
  }

  // Shopee
  if (idLower.includes('shopee') || nameLower.includes('shopee')) {
    const storeNumber = extractStoreNumber(name);
    
    if (storeNumber && storeNumber > 1) {
      return {
        label: 'SP',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        borderColor: 'border-orange-400',
        suffix: `${storeNumber}`,
      };
    }
    return {
      label: 'SP',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
    };
  }

  // Shein
  if (idLower.includes('shein') || nameLower.includes('shein')) {
    return {
      label: 'SH',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
    };
  }

  // Amazon
  if (idLower.includes('amazon') || nameLower.includes('amazon')) {
    return {
      label: 'AZ',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-800',
    };
  }

  // TikTok
  if (idLower.includes('tiktok') || nameLower.includes('tiktok')) {
    return {
      label: 'TT',
      bgColor: 'bg-slate-800',
      textColor: 'text-white',
    };
  }

  // Magalu
  if (idLower.includes('magalu') || nameLower.includes('magalu') || nameLower.includes('magazine')) {
    return {
      label: 'MG',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
    };
  }

  // Miniatto (Loja própria)
  if (idLower.includes('miniatto') || nameLower.includes('miniatto')) {
    return {
      label: 'MI',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-700',
    };
  }

  // Americanas
  if (idLower.includes('americanas') || nameLower.includes('americanas')) {
    return {
      label: 'AM',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
    };
  }

  // Generic/Unknown - use first 2 letters
  const shortName = name.substring(0, 2).toUpperCase();
  return {
    label: shortName,
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
  };
}

/**
 * Extract store number from name (e.g., "Shopee Loja 2" -> 2)
 */
function extractStoreNumber(name: string): number | null {
  // Match patterns like "Loja 2", "Store 2", just "2"
  const match = name.match(/(?:loja|store|#)\s*(\d+)/i) || name.match(/(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Get priority for sorting icons (lower = more important)
 */
export function getMarketplacePriority(id: string, name: string): number {
  const idLower = id.toLowerCase();
  const nameLower = name.toLowerCase();

  if (idLower.includes('meli') || nameLower.includes('mercado livre')) return 1;
  if (idLower.includes('shopee') || nameLower.includes('shopee')) return 2;
  if (idLower.includes('shein') || nameLower.includes('shein')) return 3;
  if (idLower.includes('amazon') || nameLower.includes('amazon')) return 4;
  if (idLower.includes('magalu') || nameLower.includes('magalu')) return 5;
  if (idLower.includes('tiktok') || nameLower.includes('tiktok')) return 6;
  if (idLower.includes('miniatto') || nameLower.includes('miniatto')) return 7;
  
  return 99;
}
