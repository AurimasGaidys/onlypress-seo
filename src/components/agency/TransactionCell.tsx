import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, FileText, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { PublishOrder } from "@/types/publishOrder";
import { toast } from "sonner";
import { PortalTitle } from "../portals/PortalTitle";
import { useUsersContext } from "@/context/usersContext/useUsersContext";

export function TransactionCell({ order }: { order: PublishOrder }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedLink, setCopiedLink] = useState<string | null>(null);

    const { getEmail, initializing } = useUsersContext();

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "Completed":
            case "Paid":
                return "default";
            case "Created":
                return "secondary";
            case "Rejected":
            case "PortalRejected":
            case "BuyerRejected":
                return "destructive";
            default:
                return "outline";
        }
    };

    const copyToClipboard = (link: string) => {
        navigator.clipboard.writeText(link);
        setCopiedLink(link);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopiedLink(null), 2000);
    };

    return (
        <Card className={`transition-all duration-200 ${isExpanded ? 'ring-2 ring-primary/5 shadow-md' : 'hover:shadow-sm'}`}>
            <div
                className="p-4 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            {order.dateCreated ? format(new Date(order.dateCreated), "MMM d, yyyy") : "-"}
                        </span>
                        -
                        <span className="text-xs text-muted-foreground">
                            {initializing ? "Loading.." : getEmail(order.buyerId) || "Unknown Buyer"}
                        </span>
                    </div>
                    <h3 className="font-medium text-base truncate pr-4">
                        {order.textInfo?.title || "Untitled Order"}
                    </h3>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 w-full md:w-auto">
                    <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
                        {order.status}
                    </Badge>
                    <div className="text-right min-w-[80px]">
                        <div className="font-bold">
                            {order.price ? `€${order.price.toFixed(2)}` : "-"}
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                    <div className="border-t pt-4 grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Order Details
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <span className="text-muted-foreground">Full ID:</span>
                                <span className="font-mono text-xs">{order.id}</span>
                                <span className="text-muted-foreground">Publish Date:</span>
                                <span>{order.publishDate ? format(new Date(order.publishDate), "PP") : "Not scheduled"}</span>
                                <span className="text-muted-foreground">Publishers:</span>
                                <span>{order.publishers?.length || 0} selected</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <ExternalLink className="h-4 w-4" />
                                Published Links
                            </h4>
                            <div className="space-y-2">
                                {order.publishTasks && order.publishTasks.length > 0 ? (
                                    order.publishTasks.map((task, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded border">
                                            <PortalTitle portalId={task.portalId} />
                                            <div className="flex items-center gap-2 truncate">
                                                <Badge variant="outline" className="text-[10px] h-5">
                                                    {task.status}
                                                </Badge>
                                                {task.backLink ? (
                                                    <a
                                                        href={task.backLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline truncate max-w-[200px] block"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {task.backLink}
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground italic text-xs">No link yet</span>
                                                )}
                                            </div>
                                            {task.backLink && (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-muted-foreground hover:text-primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            copyToClipboard(task.backLink);
                                                        }}
                                                        title="Copy Link"
                                                    >
                                                        {copiedLink === task.backLink ? (
                                                            <Check className="h-3 w-3 text-green-500" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                    <a
                                                        href={task.backLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center h-6 w-6 text-muted-foreground hover:text-primary rounded-md hover:bg-accent"
                                                        onClick={(e) => e.stopPropagation()}
                                                        title="Open Link"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No publish tasks available.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
