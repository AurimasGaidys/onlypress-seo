// TODO put into good place
"use client";

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, BarChart3, Settings2, Tags, Euro, Users, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PortalPublic } from "@/types/portalPublic";
import { usePortaCategoryContext } from "@/context/portalCategoryContext/TextIndustryContext";
import { Slider } from "@/components/ui/slider";

// --- Helper Functions ---
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

interface AdvancedPortalFilterProps {
  portals: PortalPublic[];
  onFilterChange: (filteredPortals: PortalPublic[]) => void;
}

interface FilterState {
  searchText: string;
  priceRange: [number, number];
  usersPerMonthRange: [number, number];
  domainRatingRange: [number, number];
  selectedCategories: string[];
  allowHtmlCode: boolean;
  canProvideBacklink: boolean;
  backlinkType: "all" | "dofollow" | "nofollow" | "both";
}

export function AdvancedPortalFilter({ portals, onFilterChange }: AdvancedPortalFilterProps) {
  const { getTextIndustry } = usePortaCategoryContext();

  const initialBounds = React.useMemo(() => {
    if (portals.length === 0) {
      return { minPrice: 0, maxPrice: 1000, minUsers: 0, maxUsers: 1000000, minDr: 0, maxDr: 100 };
    }
    const prices = portals.map((p) => p.price);
    const users = portals.map((p) => p.usersPerMonth);
    const drs = portals.map((p) => p.ahrefsDomainRating);
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      minUsers: Math.min(...users),
      maxUsers: Math.max(...users),
      minDr: Math.min(...drs),
      maxDr: Math.max(...drs),
    };
  }, [portals]);
  
  const uniqueCategories = React.useMemo(() => {
    const allCategories = portals.flatMap(p => p.categories || []);
    return [...new Set(allCategories)].filter(Boolean).sort();
  }, [portals]);

  const getInitialState = React.useCallback((): FilterState => ({
    searchText: "",
    priceRange: [initialBounds.minPrice, initialBounds.maxPrice],
    usersPerMonthRange: [initialBounds.minUsers, initialBounds.maxUsers],
    domainRatingRange: [initialBounds.minDr, initialBounds.maxDr],
    selectedCategories: [],
    allowHtmlCode: false,
    canProvideBacklink: false,
    backlinkType: "all",
  }), [initialBounds]);

  const [filters, setFilters] = React.useState<FilterState>(getInitialState());

  React.useEffect(() => {
    const timerId = setTimeout(() => {
      let filtered = [...portals];

      if (filters.searchText) {
        const lower = filters.searchText.toLowerCase();
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(lower) || 
            p.domain.toLowerCase().includes(lower)
        );
      }

      filtered = filtered.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);
      filtered = filtered.filter(p => p.usersPerMonth >= filters.usersPerMonthRange[0] && p.usersPerMonth <= filters.usersPerMonthRange[1]);
      filtered = filtered.filter(p => p.ahrefsDomainRating >= filters.domainRatingRange[0] && p.ahrefsDomainRating <= filters.domainRatingRange[1]);

      if (filters.selectedCategories.length > 0) {
          filtered = filtered.filter(p => 
              filters.selectedCategories.some(cat => p.categories?.includes(cat))
          );
      }

      if (filters.allowHtmlCode) filtered = filtered.filter(p => p.allowHtmlCode);
      if (filters.canProvideBacklink) filtered = filtered.filter(p => p.canProvideBacklink);
      if (filters.backlinkType !== 'all') {
          filtered = filtered.filter(p => p.backlinkType === filters.backlinkType || p.backlinkType === 'both');
      }

      onFilterChange(filtered);
    }, 300);
    return () => clearTimeout(timerId);
  }, [filters, portals]);

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      selectedCategories: checked 
        ? [...prev.selectedCategories, category] 
        : prev.selectedCategories.filter(c => c !== category)
    }));
  };
  
  return (
    <Card className="border-none shadow-sm bg-card rounded-2xl overflow-hidden">
      <CardContent className="p-4 space-y-6">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Refine Search</h2>
          <Button variant="ghost" size="sm" onClick={() => setFilters(getInitialState())} className="h-8 text-[10px] font-bold uppercase tracking-wider hover:text-primary gap-1 px-2 rounded-lg">
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search publisher..."
            value={filters.searchText}
            onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
            className="pl-9 h-11 bg-muted/40 border-border/50 rounded-xl focus-visible:ring-primary/20 transition-all font-medium"
          />
        </div>

        <Accordion type="multiple" defaultValue={["metrics"]} className="w-full">
          <AccordionItem value="metrics" className="border-border/50">
            <AccordionTrigger className="hover:no-underline py-3 px-1">
                <div className="flex items-center gap-2 text-sm font-bold">
                    <BarChart3 className="h-4 w-4 text-primary" /> Metrics
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-8 pt-4 px-1 pb-4">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <Label className="text-[11px] font-bold uppercase tracking-tighter text-muted-foreground flex items-center gap-1">
                        <Euro className="h-3 w-3" /> Price Range
                    </Label>
                    <span className="text-xs font-bold text-primary">{formatCurrency(filters.priceRange[0])} - {formatCurrency(filters.priceRange[1])}</span>
                </div>
                <Slider
                  min={initialBounds.minPrice}
                  max={initialBounds.maxPrice}
                  step={5}
                  value={filters.priceRange}
                  onValueChange={(v) => setFilters({ ...filters, priceRange: v as [number, number] })}
                  className="py-1"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <Label className="text-[11px] font-bold uppercase tracking-tighter text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> Monthly Traffic
                    </Label>
                    <span className="text-xs font-bold text-primary">{formatNumber(filters.usersPerMonthRange[0])} - {formatNumber(filters.usersPerMonthRange[1])}</span>
                </div>
                <Slider
                  min={initialBounds.minUsers}
                  max={initialBounds.maxUsers}
                  step={500}
                  value={filters.usersPerMonthRange}
                  onValueChange={(v) => setFilters({ ...filters, usersPerMonthRange: v as [number, number] })}
                  className="py-1"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <Label className="text-[11px] font-bold uppercase tracking-tighter text-muted-foreground flex items-center gap-1">
                        <Activity className="h-3 w-3" /> Domain Rating
                    </Label>
                    <span className="text-xs font-bold text-primary">{filters.domainRatingRange[0]} - {filters.domainRatingRange[1]}</span>
                </div>
                <Slider
                  min={initialBounds.minDr}
                  max={initialBounds.maxDr}
                  step={1}
                  value={filters.domainRatingRange}
                  onValueChange={(v) => setFilters({ ...filters, domainRatingRange: v as [number, number] })}
                  className="py-1"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="settings" className="border-border/50">
            <AccordionTrigger className="hover:no-underline py-3 px-1">
                <div className="flex items-center gap-2 text-sm font-bold">
                    <Settings2 className="h-4 w-4 text-primary" /> Features
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-5 pt-4 px-1 pb-4">
              <div className="flex items-center justify-between">
                  <Label htmlFor="html-code" className="text-xs font-medium cursor-pointer">Allows HTML Code</Label>
                  <Switch id="html-code" checked={filters.allowHtmlCode} onCheckedChange={(v) => setFilters({...filters, allowHtmlCode: v})} />
              </div>
              <div className="flex items-center justify-between">
                  <Label htmlFor="backlink" className="text-xs font-medium cursor-pointer">Can Provide Backlink</Label>
                  <Switch id="backlink" checked={filters.canProvideBacklink} onCheckedChange={(v) => setFilters({...filters, canProvideBacklink: v})} />
              </div>
              <div className="pt-2 space-y-3">
                  <Label className="text-[11px] font-bold uppercase tracking-tighter text-muted-foreground">Link Attribute</Label>
                  <RadioGroup value={filters.backlinkType} onValueChange={(v) => setFilters({...filters, backlinkType: v as any})} className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                        <RadioGroupItem value="all" id="r1" className="h-3.5 w-3.5" /><Label htmlFor="r1" className="text-[11px] cursor-pointer font-bold uppercase">All</Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                        <RadioGroupItem value="dofollow" id="r2" className="h-3.5 w-3.5" /><Label htmlFor="r2" className="text-[11px] cursor-pointer font-bold uppercase">DoFollow</Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                        <RadioGroupItem value="nofollow" id="r3" className="h-3.5 w-3.5" /><Label htmlFor="r3" className="text-[11px] cursor-pointer font-bold uppercase">NoFollow</Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                        <RadioGroupItem value="both" id="r4" className="h-3.5 w-3.5" /><Label htmlFor="r4" className="text-[11px] cursor-pointer font-bold uppercase">Both</Label>
                      </div>
                  </RadioGroup>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="categories" className="border-none">
            <AccordionTrigger className="hover:no-underline py-3 px-1">
                <div className="flex items-center gap-2 text-sm font-bold">
                    <Tags className="h-4 w-4 text-primary" /> Categories
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 px-1 space-y-1 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {uniqueCategories.length === 0 ? (
                <p className="text-[10px] text-center py-4 text-muted-foreground italic">No categories available</p>
              ) : uniqueCategories.map(cat => (
                <div key={cat} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/40 transition-colors group cursor-pointer" onClick={() => handleCategoryChange(cat, !filters.selectedCategories.includes(cat))}>
                    <Checkbox id={cat} checked={filters.selectedCategories.includes(cat)} onCheckedChange={(v) => handleCategoryChange(cat, !!v)} className="h-3.5 w-3.5" />
                    <Label htmlFor={cat} className="text-xs font-medium cursor-pointer flex-1 group-hover:text-primary transition-colors">
                        {getTextIndustry(cat)?.title || "Nežinoma kategorija"}
                    </Label>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
