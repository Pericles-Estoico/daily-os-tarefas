import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getMarketplaceIconConfig, getMarketplacePriority } from '@/lib/marketplace-icons';
import type { Marketplace } from '@/hooks/useMarketplacesData';
import { cn } from '@/lib/utils';

interface MarketplaceIconsProps {
  marketplaceIds: string[];
  marketplaces: Marketplace[];
  maxVisible?: number;
}

export function MarketplaceIcons({ 
  marketplaceIds, 
  marketplaces, 
  maxVisible = 5 
}: MarketplaceIconsProps) {
  if (marketplaceIds.length === 0) {
    return null;
  }

  // Map IDs to marketplace info and sort by priority
  const marketplaceInfos = marketplaceIds
    .map(id => {
      const mp = marketplaces.find(m => m.id === id);
      if (!mp) return null;
      return {
        id,
        name: mp.name,
        priority: getMarketplacePriority(id, mp.name),
        config: getMarketplaceIconConfig(id, mp.name),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.priority - b!.priority);

  const visibleMarketplaces = marketplaceInfos.slice(0, maxVisible);
  const hiddenCount = marketplaceInfos.length - visibleMarketplaces.length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-0.5">
        {visibleMarketplaces.map((info) => {
          if (!info) return null;
          const { id, name, config } = info;

          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex items-center justify-center',
                    'h-5 min-w-5 px-1 rounded text-[10px] font-bold',
                    'cursor-default select-none',
                    config.bgColor,
                    config.textColor,
                    config.borderColor && `border-2 ${config.borderColor}`
                  )}
                >
                  {config.label}
                  {config.suffix && (
                    <span className="text-[8px] ml-0.5">{config.suffix}</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs font-medium">{name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center h-5 min-w-5 px-1 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                +{hiddenCount}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">
                {marketplaceInfos.slice(maxVisible).map(m => m?.name).join(', ')}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
