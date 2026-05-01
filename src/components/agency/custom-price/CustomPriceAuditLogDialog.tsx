import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CustomPrice } from '@/types/customPrice'; // Assuming this type exists or I need to find where it is defined. 
// Wait, I should check where CustomPrice is defined. In the original file it uses `useCustomPricesContext`.
// Let's check `src/context/customPriceContext/CustomPriceContext.tsx` or infer from usage.
// In the original file: `customPrices` comes from context.
// Let's look at the original file again to see the structure of `auditLog`.
// It has `action`, `userName`, `timestamp`, `oldValue`, `newValue`, `note`.

import { AuditLogEntry } from '@/types/customPrice';

interface CustomPriceAuditLogDialogProps {
    isOpen: boolean;
    onClose: () => void;
    portalName: string;
    auditLog: AuditLogEntry[];
}

export default function CustomPriceAuditLogDialog({
    isOpen,
    onClose,
    portalName,
    auditLog,
}: CustomPriceAuditLogDialogProps) {
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Price History</DialogTitle>
                    <DialogDescription>
                        {portalName}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
                    {auditLog
                        .slice()
                        .reverse()
                        .map((log, index) => (
                            <div key={index} className="border rounded-lg p-3 space-y-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="font-medium capitalize">{log.action}</span>
                                        <span className="text-sm text-muted-foreground ml-2">
                                            by {log.userName}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(log.timestamp)}
                                    </span>
                                </div>
                                {log.oldValue !== undefined && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Old: </span>
                                        <span className="line-through">€{log.oldValue.toFixed(2)}</span>
                                    </div>
                                )}
                                {log.newValue !== undefined && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">New: </span>
                                        <span className="font-semibold text-green-600">€{log.newValue.toFixed(2)}</span>
                                    </div>
                                )}
                                {log.note && (
                                    <div className="text-sm text-muted-foreground italic">
                                        Note: {log.note}
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
