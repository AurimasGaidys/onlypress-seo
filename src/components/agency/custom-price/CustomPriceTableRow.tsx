import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, History, Plus } from 'lucide-react';
import { PortalPublic } from '@/types/portalPublic';
import { CustomPrice } from '@/types/customPrice';
import PriceDisplay from './PriceDisplay';

interface CustomPriceTableRowProps {
    portal: PortalPublic;
    customPrice?: CustomPrice;
    onEdit: (portalId: string) => void;
    onViewAuditLog: (portalId: string) => void;
}

export default function CustomPriceTableRow({
    portal,
    customPrice,
    onEdit,
    onViewAuditLog,
}: CustomPriceTableRowProps) {
    const formatDate = (dateString: number | string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <TableRow className="group">
            <TableCell className="font-medium">
                <div className="flex flex-col">
                    <span>{portal.title}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {portal.domain}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <PriceDisplay customPrice={customPrice} portalPrice={portal.price} />
            </TableCell>
            <TableCell>
                {customPrice ? (
                    <span className="text-sm text-muted-foreground">
                        {formatDate(customPrice.updatedAt)}
                    </span>
                ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                )}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(portal.id)}
                        className="h-8"
                    >
                        {customPrice ? (
                            <>
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                Edit
                            </>
                        ) : (
                            <>
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Set
                            </>
                        )}
                    </Button>
                    {customPrice && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewAuditLog(portal.id)}
                            className="h-8 w-8 p-0"
                        >
                            <History className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}
