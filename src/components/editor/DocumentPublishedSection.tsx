import { useOrderContext } from "@/context/orders/useOrdersContext";
import { useMemo } from "react";
import { TransactionCell } from "../agency/TransactionCell";

interface Props {
    documentId: string;
}

export const DocumentPublishedSection = ({ documentId }: Props) => {
    const { myOrders, initializing } = useOrderContext();

    const filteredAndSortedOrders = useMemo(() => {
        const filtered = myOrders.filter((order) =>
            (order.seoDocumentId || "belenkas") == documentId
        );

        return filtered.sort((a, b) => {
            const dateA = a.dateCreated || 0;
            const dateB = b.dateCreated || 0;
            return dateB - dateA
        });
    }, [myOrders, documentId]);

    console.log("FILTERED ORDERS IN DOC PUB SEC:", filteredAndSortedOrders, documentId);

    if (initializing) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0">
            {filteredAndSortedOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                    No transactions found matching your criteria.
                </div>
            ) : (
                filteredAndSortedOrders.map((order) => (
                    <TransactionCell key={order.id} order={order} />
                ))
            )}
        </div>
    );
}