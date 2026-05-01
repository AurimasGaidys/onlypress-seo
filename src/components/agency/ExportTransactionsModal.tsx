"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { PublishOrder } from "@/types/publishOrder";
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useUsersContext } from "@/context/usersContext/useUsersContext";

interface ExportTransactionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orders: PublishOrder[];
    portalsMap?: Map<string, { domain: string }>;
}

interface ExportFields {
    orderId: boolean;
    title: boolean;
    orderStatus: boolean;
    orderPrice: boolean;
    dateCreated: boolean;
    publishDate: boolean;
    buyerEmail: boolean;
    portalDomain: boolean;
    taskStatus: boolean;
    taskPrice: boolean;
    backLink: boolean;
    datePublished: boolean;
}

export function ExportTransactionsModal({ open, onOpenChange, orders, portalsMap }: ExportTransactionsModalProps) {
    const { getEmail, initializing } = useUsersContext();
    const [selectedFields, setSelectedFields] = useState<ExportFields>({
        orderId: true,
        title: true,
        orderStatus: true,
        orderPrice: true,
        dateCreated: false,
        publishDate: false,
        buyerEmail: true,
        portalDomain: true,
        taskStatus: true,
        taskPrice: true,
        backLink: true,
        datePublished: true,
    });
    const [isExporting, setIsExporting] = useState(false);

    const toggleField = (field: keyof ExportFields) => {
        setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const selectAll = () => {
        setSelectedFields({
            orderId: true,
            title: true,
            orderStatus: true,
            orderPrice: true,
            dateCreated: true,
            publishDate: true,
            buyerEmail: true,
            portalDomain: true,
            taskStatus: true,
            taskPrice: true,
            backLink: true,
            datePublished: true,
        });
    };

    const deselectAll = () => {
        setSelectedFields({
            orderId: false,
            title: false,
            orderStatus: false,
            orderPrice: false,
            dateCreated: false,
            publishDate: false,
            buyerEmail: false,
            portalDomain: false,
            taskStatus: false,
            taskPrice: false,
            backLink: false,
            datePublished: false,
        });
    };

    const exportToCSV = () => {
        setIsExporting(true);
        try {
            // Flatten orders data with publish tasks
            interface FlattenedRow {
                orderId: string;
                title: string;
                orderStatus: string;
                orderPrice: string;
                dateCreated: string;
                publishDate: string;
                buyerEmail: string;
                portalDomain: string;
                taskStatus: string;
                taskPrice: string;
                backLink: string;
                datePublished: string;
            }

            const flattenedData: FlattenedRow[] = [];

            // aaaa
            orders.forEach(order => {
                if (order.publishTasks && order.publishTasks.length > 0) {
                    order.publishTasks.forEach(task => {
                        const portalDomain = portalsMap?.get(task.portalId)?.domain || task.portalId;
                        const buyerEmail = getEmail(order.buyerId) || order.buyerId || "Unknown Buyer";

                        flattenedData.push({
                            orderId: order.id,
                            title: order.textInfo?.title || "Untitled",
                            orderStatus: order.status,
                            orderPrice: order.price?.toFixed(2) || "0.00",
                            dateCreated: order.dateCreated ? format(new Date(order.dateCreated), "yyyy-MM-dd HH:mm:ss") : "",
                            publishDate: order.publishDate ? format(new Date(order.publishDate), "yyyy-MM-dd") : "",
                            buyerEmail: buyerEmail,
                            portalDomain: portalDomain,
                            taskStatus: task.status,
                            taskPrice: task.price?.toFixed(2) || "0.00",
                            backLink: task.backLink || "",
                            datePublished: task.datePublished ? format(new Date(task.datePublished), "yyyy-MM-dd HH:mm:ss") : "",
                        });
                    });
                } else {
                    // Order without tasks
                    const buyerEmail = getEmail(order.buyerId) || order.buyerId || "";
                    flattenedData.push({
                        orderId: order.id,
                        title: order.textInfo?.title || "Untitled",
                        orderStatus: order.status,
                        orderPrice: order.price?.toFixed(2) || "0.00",
                        dateCreated: order.dateCreated ? format(new Date(order.dateCreated), "yyyy-MM-dd HH:mm:ss") : "",
                        publishDate: order.publishDate ? format(new Date(order.publishDate), "yyyy-MM-dd") : "",
                        buyerEmail: buyerEmail,
                        portalDomain: "",
                        taskStatus: "",
                        taskPrice: "",
                        backLink: "",
                        datePublished: "",
                    });
                }
            });

            // Sort by portal domain first, then by buyer email
            flattenedData.sort((a, b) => {
                if (a.portalDomain !== b.portalDomain) {
                    return a.portalDomain.localeCompare(b.portalDomain);
                }
                return a.buyerEmail.localeCompare(b.buyerEmail);
            });

            // Build CSV headers based on selected fields
            const fieldLabels: Record<keyof ExportFields, string> = {
                orderId: "Order ID",
                title: "Title",
                orderStatus: "Order Status",
                orderPrice: "Order Price (€)",
                dateCreated: "Date Created",
                publishDate: "Publish Date",
                buyerEmail: "Buyer Email",
                portalDomain: "Portal Domain",
                taskStatus: "Task Status",
                taskPrice: "Task Price (€)",
                backLink: "Back Link",
                datePublished: "Date Published",
            };

            const headers: string[] = [];
            const fieldKeys: (keyof ExportFields)[] = [];

            (Object.keys(selectedFields) as (keyof ExportFields)[]).forEach(key => {
                if (selectedFields[key]) {
                    headers.push(fieldLabels[key]);
                    fieldKeys.push(key);
                }
            });

            if (headers.length === 0) {
                toast.error("Please select at least one field to export");
                setIsExporting(false);
                return;
            }

            // Build CSV content
            let csvContent = headers.join(",") + "\n";

            // Add grouped headers
            let currentPortal = "";
            let currentBuyer = "";

            flattenedData.forEach(row => {
                // Add portal group header
                if (row.portalDomain && row.portalDomain !== currentPortal) {
                    currentPortal = row.portalDomain;
                    currentBuyer = ""; // Reset buyer when portal changes
                    csvContent += `\n"=== PORTAL: ${currentPortal} ==="\n`;
                }

                // Add buyer group header within portal
                if (row.buyerEmail && row.buyerEmail !== currentBuyer) {
                    currentBuyer = row.buyerEmail;
                    csvContent += `"--- Buyer: ${currentBuyer} ---"\n`;
                }

                // Add data row
                const rowData = fieldKeys.map(key => {
                    const value = row[key];
                    // Escape quotes and wrap in quotes if contains comma, quote, or newline
                    const stringValue = String(value);
                    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                });
                csvContent += rowData.join(",") + "\n";
            });

            // Create and download file
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `transactions_export_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Exported ${flattenedData.length} transaction records`);
            onOpenChange(false);
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to export transactions");
        } finally {
            setIsExporting(false);
        }
    };

    const fieldOptions: { key: keyof ExportFields; label: string; description: string }[] = [
        { key: "orderId", label: "Order ID", description: "Unique order identifier" },
        { key: "title", label: "Title", description: "Article title" },
        { key: "orderStatus", label: "Order Status", description: "Overall order status" },
        { key: "orderPrice", label: "Order Price", description: "Total order price" },
        { key: "dateCreated", label: "Date Created", description: "When order was created" },
        { key: "publishDate", label: "Publish Date", description: "Scheduled publish date" },
        { key: "buyerEmail", label: "Buyer Email", description: "Buyer's email address" },
        { key: "portalDomain", label: "Portal Domain", description: "Publishing portal domain" },
        { key: "taskStatus", label: "Task Status", description: "Individual publish task status" },
        { key: "taskPrice", label: "Task Price", description: "Individual task price" },
        { key: "backLink", label: "Back Link", description: "Published article URL" },
        { key: "datePublished", label: "Date Published", description: "When article was published" },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Export Transactions</DialogTitle>
                    <DialogDescription>
                        Select the fields you want to include in the CSV export. Data will be grouped by portal and buyer email.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Button onClick={selectAll} variant="outline" size="sm">
                            Select All
                        </Button>
                        <Button onClick={deselectAll} variant="outline" size="sm">
                            Deselect All
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fieldOptions.map(({ key, label, description }) => (
                            <div key={key} className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                                <Checkbox
                                    id={key}
                                    checked={selectedFields[key]}
                                    onCheckedChange={() => toggleField(key)}
                                />
                                <div className="space-y-1 leading-none">
                                    <Label htmlFor={key} className="cursor-pointer font-medium">
                                        {label}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg border">
                        <h4 className="text-sm font-semibold mb-2">Export Details</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Records: {orders.reduce((sum, order) => sum + (order.publishTasks?.length || 1), 0)} rows</li>
                            <li>• Orders: {orders.length}</li>
                            <li>• Format: CSV (Comma-Separated Values)</li>
                            <li>• Grouped by: Portal Domain → Buyer Email</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting || initializing}>
                        Cancel
                    </Button>
                    <Button onClick={exportToCSV} disabled={isExporting || initializing}>
                        {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : initializing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading users...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
