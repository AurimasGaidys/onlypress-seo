"use client"

import { useOrderContext } from "@/context/orders/useOrdersContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Search, Filter, ArrowUpDown, Download } from "lucide-react";
import { TransactionCell } from "@/components/agency/TransactionCell";
import { PortalPicker } from "@/components/aaa_todo/PortalPicker";
import { DateRangePicker } from "@/components/aaa_todo/DateRangePicker";
import { ExportTransactionsModal } from "@/components/agency/ExportTransactionsModal";
import { usePortalsContext } from "@/context/portalContext/usePortalsContext";

type OrderStatus = "All" | "Active" | "Completed" | "Paid" | "Rejected";
type SortOrder = "desc" | "asc";

export default function TransactionsPage() {
    const { myOrders, initializing } = useOrderContext();
    const { portals } = usePortalsContext(); 
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<OrderStatus>("All");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const handleDateRangeChange = (newStartDate: Date | null, newEndDate: Date | null) => {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
    };

    const filteredAndSortedOrders = useMemo(() => {
        const filtered = myOrders.filter((order) => {
            const matchesSearch =
                order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.textInfo?.title?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (selectedPortalId) {
                const hasPortal = order.publishTasks.some(task => task.portalId === selectedPortalId);
                if (!hasPortal) return false;
            }

            // Date range filter
            if (startDate || endDate) {
                const orderDate = new Date(order.dateCreated);

                if (startDate && endDate) {
                    // Both dates selected - filter between them
                    const startOfDay = new Date(startDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(endDate);
                    endOfDay.setHours(23, 59, 59, 999);

                    if (orderDate < startOfDay || orderDate > endOfDay) {
                        return false;
                    }
                } else if (startDate) {
                    // Only start date selected - filter from this date onwards
                    const startOfDay = new Date(startDate);
                    startOfDay.setHours(0, 0, 0, 0);

                    if (orderDate < startOfDay) {
                        return false;
                    }
                }
            }

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
    }, [myOrders, searchQuery, statusFilter, sortOrder, selectedPortalId, startDate, endDate]);

    // Create portals map for export modal
    const portalsMap = useMemo(() => {
        const map = new Map<string, { domain: string }>();
        portals.forEach(portal => {
            map.set(portal.id, { domain: portal.domain });
        });
        return map;
    }, [portals]);

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
                        Manage and monitor your transaction history.
                    </p>
                </div>
                <Button
                    onClick={() => setIsExportModalOpen(true)}
                    disabled={filteredAndSortedOrders.length === 0}
                    className="w-full md:w-auto"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export to CSV
                </Button>
            </div>

            <div className="flex flex-col gap-4 bg-card/50 p-4 rounded-lg border shadow-sm backdrop-blur-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by Domain or Title..."
                            className="w-full md:w-[300px] bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <PortalPicker
                        value={selectedPortalId}
                        onChange={setSelectedPortalId}
                    />

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

                <div className="flex items-center gap-2">
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onDateRangeChange={handleDateRangeChange}
                    />
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

            <ExportTransactionsModal
                open={isExportModalOpen}
                onOpenChange={setIsExportModalOpen}
                orders={filteredAndSortedOrders}
                portalsMap={portalsMap}
            />
        </div>
    );
}
