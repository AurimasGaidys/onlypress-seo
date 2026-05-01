"use client";
// TODO put into good place

import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { usePortalsContext } from "@/context/portalContext/usePortalsContext";
import { PortalPublic } from "@/types/portalPublic";
import { ContentGuidelineInfo } from "./contentGuidelineInfo";
import { userCountBeatifier } from "./userCountBeatifier";

export const PortalListCell = ({
    publisherId,
    onClick,
    selectedPortals,
}: {
    publisherId: string,
    onClick: (publisherId: string) => void,
    selectedPortals: string[],
}) => {
    const { getPortal } = usePortalsContext();
    const [portal, setPortal] = useState<PortalPublic | undefined>(undefined);

    useEffect(() => {
        const portalData = getPortal(publisherId);
        if (portalData) {
            setPortal(portalData);
        }
    }, [getPortal, publisherId]);

    if (!portal) {
        return (
            <TableRow>
                <TableCell colSpan={7} className="py-8">
                    <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    </div>
                </TableCell>
            </TableRow>
        );
    }

    const isSelected = selectedPortals.includes(portal.id);

    return (
        <TableRow
            onClick={() => onClick(portal.id)}
            className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/[0.03] hover:bg-primary/[0.05]' : 'hover:bg-muted/30'}`}
        >
            <TableCell className="px-4">
                <Checkbox checked={isSelected} className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
            </TableCell>
            <TableCell>
                <div className="flex flex-col py-1">
                    <span className="font-bold text-foreground group-hover:text-primary transition-colors">{portal.title}</span>
                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                        <ExternalLink className="h-2 w-2" />
                        {portal.domain}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <ContentGuidelineInfo
                        tooltipContent={portal.weDoNotPublishThemes}
                        spicyTopics={portal.possiblePublicationsInTopics}
                    />
                </div>
            </TableCell>
            <TableCell className="text-center font-mono text-base font-bold text-primary">
                {portal.ahrefsDomainRating || "N/A"}
            </TableCell>
            <TableCell className="text-center">
                <Badge variant="secondary" className="bg-muted text-[10px] font-bold px-2 py-0 border-none">
                    {userCountBeatifier(portal.usersPerMonth)}
                </Badge>
            </TableCell>
            <TableCell className="text-right pr-6">
                <span className="font-bold text-base text-foreground">{portal.price}€</span>
            </TableCell>
        </TableRow>
    );
}
