// import PortalsPage from '@/components/shared-pages/PortalsPage';

// export default PortalsPage;

"use client"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Globe, Filter, Search, Info, Loader2 } from "lucide-react"
import { usePortalsContext } from "@/context/portalContext/usePortalsContext"
import { PortalPublic } from "@/types/portalPublic"
import { AdvancedPortalFilter } from "./af"
import { PortalListCell } from "./portalListCell"

export default function Portals() {
    const [selectedPortals, setSelectedPortals] = React.useState<string[]>([])
    const { portals, initializing: loading } = usePortalsContext()
    const [filteredPortals, setFilteredPortals] = React.useState<PortalPublic[]>(portals);

    React.useEffect(() => {
        if (portals.length > 0 && filteredPortals.length === 0) {
            setFilteredPortals(portals);
        }
    }, [portals]);

    return (
        <div className="flex flex-col flex-1">
            <header className="flex h-14 shrink-0 items-center gap-2 px-6 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-30">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/buyer/dashboard">
                                Marketplace
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Browse Portals</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-6">
                {loading && portals.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="ml-4 text-muted-foreground">Loading client data...</p>
                        </div>                    </div>
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold tracking-tight">Browse Portals</h2>
                                <p className="text-sm text-muted-foreground font-medium">Discover premium media platforms for your content.</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/40 px-3 py-1.5 rounded-full border border-border/40">
                                <Globe className="h-3.5 w-3.5 text-blue-600" />
                                {portals.length} Total Portals
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                            <aside className="space-y-4">
                                <div className="flex items-center gap-2 px-1 mb-2">
                                    <Filter className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-bold uppercase tracking-wider">Advanced Filters</span>
                                </div>
                                <AdvancedPortalFilter
                                    portals={portals}
                                    onFilterChange={(newList: PortalPublic[]) => {
                                        setFilteredPortals(newList);
                                    }}
                                />
                            </aside>

                            <div className="space-y-4">
                                <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="hover:bg-transparent border-b border-border/50">
                                                <TableHead className="w-[40px] px-4"></TableHead>
                                                <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Publisher</TableHead>
                                                <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Guidelines</TableHead>
                                                <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 text-center">DR</TableHead>
                                                <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 text-center">Traffic</TableHead>
                                                <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 text-right pr-6">Price</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredPortals.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm italic">
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <Search className="h-8 w-8 opacity-20" />
                                                            No publishers found matching your criteria.
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredPortals.map((portal) => (
                                                    <PortalListCell
                                                        key={portal.id}
                                                        publisherId={portal.id}
                                                        onClick={(id) => {
                                                            if (selectedPortals.includes(id)) {
                                                                setSelectedPortals(selectedPortals.filter(p => p !== id))
                                                            } else {
                                                                setSelectedPortals([...selectedPortals, id])
                                                            }
                                                        }}
                                                        selectedPortals={selectedPortals}
                                                    />
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {selectedPortals.length > 0 && (
                                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
                                            <Info className="h-4 w-4" />
                                            {selectedPortals.length} portals selected
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
