'use client';

import { useState, useMemo } from 'react';
import { PortalPublic } from '@/types/portalPublic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Search, Globe, TrendingUp, Users,
    Leaf, Bitcoin, Dice1, Heart, Briefcase, ShoppingBag, Camera,
    Music, Film, Book, Utensils, Car, Home, TreePine, Dumbbell,
    Stethoscope, Plane, GraduationCap
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePortaCategoryContext } from '@/context/portalCategoryContext/TextIndustryContext';
import { useCustomPricesContext } from '@/context/customPriceContext/CustomPriceContext';
import { FeaturedCell } from './featuredCell';

interface PortalSelectionContentProps {
    portals: PortalPublic[];
    selectedPortalIds: string[];
    onSelectionChange: (portalIds: string[]) => void;
}

// Helper function to format large numbers
const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
};

// Function to get icon for topic category
const getTopicIcon = (topic: string) => {
    const normalizedTopic = topic.toLowerCase().trim();

    // Map topics to icons
    if (normalizedTopic.includes('cbd') || normalizedTopic.includes('pharmacy') || normalizedTopic.includes('dietary')) return Leaf;
    if (normalizedTopic.includes('cryptocurrency') || normalizedTopic.includes('crypto')) return Bitcoin;
    if (normalizedTopic.includes('gambling') || normalizedTopic.includes('casino')) return Dice1;
    if (normalizedTopic.includes('adult') || normalizedTopic.includes('dating')) return Heart;
    if (normalizedTopic.includes('loan') || normalizedTopic.includes('finance')) return Briefcase;
    if (normalizedTopic.includes('shopping') || normalizedTopic.includes('retail')) return ShoppingBag;
    if (normalizedTopic.includes('photo') || normalizedTopic.includes('camera')) return Camera;
    if (normalizedTopic.includes('music') || normalizedTopic.includes('audio')) return Music;
    if (normalizedTopic.includes('film') || normalizedTopic.includes('movie') || normalizedTopic.includes('video')) return Film;
    if (normalizedTopic.includes('book') || normalizedTopic.includes('reading')) return Book;
    if (normalizedTopic.includes('food') || normalizedTopic.includes('restaurant')) return Utensils;
    if (normalizedTopic.includes('car') || normalizedTopic.includes('auto')) return Car;
    if (normalizedTopic.includes('home') || normalizedTopic.includes('real estate')) return Home;
    if (normalizedTopic.includes('nature') || normalizedTopic.includes('environment')) return TreePine;
    if (normalizedTopic.includes('fitness') || normalizedTopic.includes('gym')) return Dumbbell;
    if (normalizedTopic.includes('health') || normalizedTopic.includes('medical')) return Stethoscope;
    if (normalizedTopic.includes('travel') || normalizedTopic.includes('vacation')) return Plane;
    if (normalizedTopic.includes('education') || normalizedTopic.includes('school')) return GraduationCap;

    return Briefcase;
};

export default function PortalSelectionContent({
    portals,
    selectedPortalIds,
    onSelectionChange,
}: PortalSelectionContentProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const { textIndustries } = usePortaCategoryContext();

    const { customPrices } = useCustomPricesContext();


    // Filter portals based on search and category
    const filteredPortals = useMemo(() => {
        let filtered = portals.filter(p => p.active);

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                p =>
                    (p.title || p.description)?.toLowerCase().includes(term) ||
                    p.domain?.toLowerCase().includes(term) ||
                    p.description?.toLowerCase().includes(term)
            );
        }

        if (selectedCategory) {
            filtered = filtered.filter(p =>
                p.categories?.includes(selectedCategory)
            );
        }

        return filtered;
    }, [portals, searchTerm, selectedCategory]);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set<string>();
        portals.forEach((p: PortalPublic) => {
            p.categories?.forEach(c => cats.add(c));
        });
        return Array.from(cats).sort();
    }, [portals]);

    const handleTogglePortal = (portalId: string) => {
        if (selectedPortalIds.includes(portalId)) {
            onSelectionChange(selectedPortalIds.filter(id => id !== portalId));
        } else {
            onSelectionChange([...selectedPortalIds, portalId]);
        }
    };

    const handleSelectAll = () => {
        const allIds = filteredPortals.map(p => p.id);
        onSelectionChange(allIds);
    };

    const handleClearAll = () => {
        onSelectionChange([]);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search and Filters */}
            <div className="space-y-4 mb-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Ieškoti portalų..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={selectedCategory === null ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                    >
                        All categories
                    </Button>

                    {categories.map(cat => (
                        <Button
                            key={cat}
                            variant={selectedCategory === cat ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {textIndustries.find(c => c.id === cat)?.title || cat}
                        </Button>
                    ))}
                </div>

                {/* Selection Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            disabled={filteredPortals.length === 0}
                        >
                            Pažymėti visus ({filteredPortals.length})
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearAll}
                            disabled={selectedPortalIds.length === 0}
                        >
                            Atžymėti visus
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Pasirinkta: <strong>{selectedPortalIds.length}</strong> portalų
                    </div>
                </div>
            </div>

            {/* Portals Table */}
            <ScrollArea className="flex-1 border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px] min-w-[50px]"></TableHead>
                            <TableHead className="min-w-[150px]">Portal</TableHead>
                            <TableHead className="text-right min-w-[100px]">Price</TableHead>
                            <TableHead className="text-center min-w-[80px]">DR</TableHead>
                            <TableHead className="text-center min-w-[100px]">Visitors</TableHead>
                            <TableHead className="text-center min-w-[120px]">Sensitive content</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPortals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Portalų nerasta
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                <FeaturedCell
                                    featuured={["aa9c5984-c3b9-4d7a-b170-095aaef13521"]}
                                    portals={filteredPortals}
                                    selectedPortalIds={selectedPortalIds}
                                    handleTogglePortal={handleTogglePortal}
                                    customPrices={customPrices}
                                    formatNumber={formatNumber}
                                    getTopicIcon={getTopicIcon}
                                />
                                {filteredPortals.filter(x => !["aa9c5984-c3b9-4d7a-b170-095aaef13521"].includes(x.id)).map(portal => (
                                    <TableRow

                                        key={portal.id}
                                        onClick={() => handleTogglePortal(portal.id)}
                                        className="cursor-pointer"
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
                                                                Reg: {portal.price.toFixed(2)} EUR
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
                                ))}
                            </>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
}
