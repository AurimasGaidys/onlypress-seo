import { Badge } from '@/components/ui/badge';
import { CustomPrice } from '@/types/customPrice';

interface PriceDisplayProps {
    customPrice?: CustomPrice;
    portalPrice: number;
}

export default function PriceDisplay({ customPrice, portalPrice }: PriceDisplayProps) {
    const hasPendingPrice = customPrice && !customPrice.approvedByPortal && customPrice.newPrice !== undefined;

    if (!customPrice) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <span>-</span>
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-secondary px-2 py-0.5 rounded-md">
                    Reg: €{portalPrice.toFixed(2)}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col justify-center h-10">
            {customPrice.approvedByPortal ? (
                <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600 text-lg">
                        €{customPrice.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-secondary px-2 py-0.5 rounded-md">
                        Reg: €{portalPrice.toFixed(2)}
                    </span>
                </div>
            ) : hasPendingPrice ? (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-yellow-600">
                            €{customPrice.newPrice!.toFixed(2)}
                        </span>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-[10px] px-1 py-0 h-5">
                            Pending
                        </Badge>
                    </div>
                    {customPrice.price > 0 && (
                        <span className="text-xs text-muted-foreground">
                            Current: €{customPrice.price.toFixed(2)}
                        </span>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600 text-lg">
                        €{customPrice.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-secondary px-2 py-0.5 rounded-md">
                        Reg: €{portalPrice.toFixed(2)}
                    </span>
                </div>
            )}
        </div>
    );
}
