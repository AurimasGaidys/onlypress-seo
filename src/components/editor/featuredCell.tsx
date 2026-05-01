import { Globe, TrendingUp, Users } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { TableCell, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";

interface Props {
    featuured: string[]
    portals: {
        id: string;
        title: string;
        description?: string;
        domain: string;
        price?: number;
        ahrefsDomainRating: number;
        usersPerMonth: number;
        possiblePublicationsInTopics?: string[];
    }[];
    selectedPortalIds: string[];
    handleTogglePortal: (id: string) => void;
    customPrices: { portalId: string; price: number }[];
    formatNumber: (num: number) => string;
    getTopicIcon: (topic: string) => React.ComponentType<{ className?: string }>;
}

export const FeaturedCell = (props: Props) => {
    const { portals, selectedPortalIds, handleTogglePortal, customPrices, formatNumber, getTopicIcon } = props;

    if (props.featuured.length === 0) {
        return null;
    }

    const filteredPortals = portals.filter(p => props.featuured.includes(p.id));

    if (filteredPortals.length === 0) {
        return null;
    }

    return <>
        {filteredPortals.map(portal => {
            return <TableRow
                key={portal.id}
                onClick={() => handleTogglePortal(portal.id)}
                className="cursor-pointer bg-gradient-to-r from-emerald-50 to-emerald-100 group data-[state=selected]:bg-emerald-200"
                data-state={selectedPortalIds.includes(portal.id) ? 'selected' : ''}
            >
                <TableCell className="p-2">
                    <Checkbox
                        checked={selectedPortalIds.includes(portal.id)}
                        onCheckedChange={() => handleTogglePortal(portal.id)}
                        onClick={(e) => e.stopPropagation()}
                    />
                </TableCell>
                <TableCell className="p-2">
                    {/* <Badge variant="destructive">Baltic-Nordic SEO Summit 2026 special price</Badge> */}
                    <div className="font-medium truncate">{portal.title || portal.description}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <Globe className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{portal.domain || portal.domain}</span>
                    </div>
                </TableCell>
                <TableCell className="text-right p-2 font-semibold whitespace-nowrap">
                    {(() => {
                        const customPrice = customPrices.find(p => p.portalId === portal.id);
                        const displayPrice = (customPrice?.price || 0) > 0 ? customPrice!.price : portal.price;

                        if (displayPrice !== undefined) {
                            return (
                                <div className="flex flex-col items-end justify-center group/price relative min-h-[24px]">
                                    <span className="font-bold text-emerald-600">
                                        {displayPrice.toFixed(2)} EUR
                                    </span>
                                    <span className="text-xs text-muted-foreground line-through opacity-0 group-hover/price:opacity-100 transition-opacity duration-200 absolute -top-3 right-0 bg-background/90 px-1 rounded-sm border shadow-sm z-10 whitespace-nowrap">
                                        Reg: {portal?.price?.toFixed(2)} EUR
                                    </span>
                                </div>
                            );
                        }

                        return `${portal.price?.toFixed(2)} EUR`;
                    })()}
                </TableCell>
                <TableCell className="text-center p-2">
                    <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm">{portal.ahrefsDomainRating}</span>
                    </div>
                </TableCell>
                <TableCell className="text-center p-2">
                    <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{formatNumber(portal.usersPerMonth)}</span>
                    </div>
                </TableCell>
                <TableCell className="text-center p-2">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                        {portal.possiblePublicationsInTopics?.slice(0, 3).map((topic, index) => {
                            const Icon = getTopicIcon(topic);
                            return (
                                <div
                                    key={index}
                                    className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center"
                                    title={topic}
                                >
                                    <Icon className="h-3 w-3" />
                                </div>
                            );
                        })}
                        {portal.possiblePublicationsInTopics && portal.possiblePublicationsInTopics.length > 3 && (
                            <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                                +{portal.possiblePublicationsInTopics.length - 3}
                            </div>
                        )}
                    </div>
                </TableCell>
            </TableRow>
        })}
    </>
}