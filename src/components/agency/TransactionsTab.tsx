import { useOrderContext } from "@/context/orders/useOrdersContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { PublishOrder } from "@/types/publishOrder";
import { TransactionCell } from "./TransactionCell";

interface CustomPriceTabProps {
    agencyId: string;
}

type OrderStatus = "All" | "Active" | "Completed" | "Paid" | "Rejected";
type SortOrder = "desc" | "asc";

export default function TransactionsTab({ agencyId }: CustomPriceTabProps) {
    const { myOrders, initializing } = useOrderContext();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<OrderStatus>("All");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const filteredAndSortedOrders = useMemo(() => {
        const filtered = myOrders.filter((order) => {
            const matchesSearch =
                order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.textInfo?.title?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (statusFilter === "All") return true;
            if (statusFilter === "Active") return ["Created", "Paid", "Rejected"].includes(order.status);
            if (statusFilter === "Completed") return ["Completed"].includes(order.status);

            return order.status === statusFilter;
        });

        return filtered.sort((a, b) => {
            const dateA = a.dateCreated || 0;
            const dateB = b.dateCreated || 0;
            return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        });
    }, [myOrders, searchQuery, statusFilter, sortOrder]);

    if (initializing) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
                    <p className="text-muted-foreground">
                        Manage and monitor your agency's transaction history.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card/50 p-4 rounded-lg border shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by ID or Title..."
                        className="w-full md:w-[300px] bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                        title={`Sort by Date: ${sortOrder === "desc" ? "Newest First" : "Oldest First"}`}
                        className="bg-background"
                    >
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    <div className="h-8 w-px bg-border mx-1" />
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as OrderStatus)}>
                        <SelectTrigger className="w-full md:w-[180px] bg-background">
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Statuses</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4">
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

            <div className="text-xs text-muted-foreground text-center pt-4">
                Showing {filteredAndSortedOrders.length} of {myOrders.length} transactions
            </div>
        </div>
    );
}