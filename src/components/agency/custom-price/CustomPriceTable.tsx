import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { PortalPublic } from '@/types/portalPublic';
import { CustomPrice } from '@/types/customPrice';
import CustomPriceTableRow from './CustomPriceTableRow';

interface CustomPriceTableProps {
    portals: PortalPublic[];
    customPrices: CustomPrice[];
    onEdit: (portalId: string) => void;
    onViewAuditLog: (portalId: string) => void;
}

export default function CustomPriceTable({
    portals,
    customPrices,
    onEdit,
    onViewAuditLog,
}: CustomPriceTableProps) {
    if (portals.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No portals available.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Portal Name</TableHead>
                        <TableHead>Custom Price</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {portals.map((portal) => {
                        const customPrice = customPrices.find(p => p.portalId === portal.id);
                        return (
                            <CustomPriceTableRow
                                key={portal.id}
                                portal={portal}
                                customPrice={customPrice}
                                onEdit={onEdit}
                                onViewAuditLog={onViewAuditLog}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
