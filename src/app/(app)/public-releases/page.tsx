// src/app/(app)/public-releases/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Rss, Star, ArrowLeft, Building } from 'lucide-react';
import { RssRelease, RssApiResponse } from '../../../types/rss';
import ReleaseCard from '../../../components/public-releases/ReleaseCard';
import ReleaseCardSkeleton from '../../../components/public-releases/ReleaseCardSkeleton';
import ReleaseViewModal from '../../../components/public-releases/ReleaseViewModal';
import { useAuth } from '../../../context/AuthContext';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isWithinInterval } from 'date-fns';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Card } from '../../../components/ui/card';
import { useFavorites } from '../../../hooks/useFavorites';

const BNS_API_URL = 'https://us-central1-publikuotacrawler.cloudfunctions.net/getActivePublicReleasesBNS';
const CITIES_API_URL = 'https://us-central1-publikuotacrawler.cloudfunctions.net/getActivePublicReleasesCities';

type RewriteStyle = "news_article" | "analytical_review" | "qa_format";
type DataSource = 'bns' | 'cities';

// Helper function to capitalize first letter
const capitalize = (s: string) => {
  if (typeof s !== 'string' || s.length === 0) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const DayFilter = ({ weekDays, selectedDate, onSelectDate }: { weekDays: Date[], selectedDate: Date | null, onSelectDate: (date: Date | null) => void }) => (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
        {weekDays.map(day => (
            <Button
                key={day.toISOString()}
                variant={selectedDate && isSameDay(day, selectedDate) ? 'default' : 'ghost'}
                size="sm" onClick={() => onSelectDate(day)} className="flex-col h-auto px-4 py-1"
            >
                <span className="text-xs font-semibold">{format(day, 'EEE')}</span>
                <span className="text-lg font-bold">{format(day, 'd')}</span>
            </Button>
        ))}
        <Button
            variant={!selectedDate ? 'default' : 'ghost'}
            size="sm" onClick={() => onSelectDate(null)} className="flex-col h-auto px-4 py-1"
        >
            <span className="text-xs font-semibold">All</span>
            <span className="text-lg font-bold">Week</span>
        </Button>
    </div>
);

export default function PublicReleasesPage() {
    const [allReleases, setAllReleases] = useState<RssRelease[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewingRelease, setViewingRelease] = useState<RssRelease | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // NEW STATE VARIABLES
    const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [dataSource, setDataSource] = useState<DataSource>('bns');

    const { user } = useAuth();
    const { activeWorkspace, activeClientId, activeProjectId } = useWorkspace();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentPage = parseInt(searchParams?.get('page') || '1', 10);

    // Get agency ID based on workspace type
    const getAgencyId = () => {
        if (activeWorkspace.type === 'user') {
            return `personal_${user?.uid}`;
        } else {
            return activeWorkspace.id;
        }
    };

    const agencyId = getAgencyId();

    useEffect(() => {
        const fetchReleases = async () => {
            setLoading(true);
            setError(null);
            setAllReleases([]);

            const currentApiUrl = dataSource === 'bns' ? BNS_API_URL : CITIES_API_URL;

            try {
                const response = await fetch(currentApiUrl);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const data: RssApiResponse = await response.json();

                if (data.success && data.data) {
                    const sortedData = data.data.sort((a, b) => b.dateCreated - a.dateCreated);
                    setAllReleases(sortedData);
                } else {
                    throw new Error('API returned success: false or data is missing');
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'Failed to fetch public releases.';
                setError(errorMessage);
                toast.error("Failed to load releases", { description: errorMessage });
            } finally {
                setLoading(false);
            }
        };
        fetchReleases();
    }, [dataSource]);

    const { weekDays, currentWeekInterval } = useMemo(() => {
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });
        return {
            weekDays: eachDayOfInterval({ start, end }),
            currentWeekInterval: { start, end },
        };
    }, []);

    // CHANGE: Get unique categories from source we're actually displaying
    const sourceForCategories = useMemo(() => {
        return showFavoritesOnly ? allReleases.filter(r => favorites.includes(r.id)) : allReleases;
    }, [showFavoritesOnly, allReleases, favorites]);

    const uniqueCategories = useMemo(() => {
        const allCategories = sourceForCategories.flatMap(release => release.publishCategories || []);
        return [...new Set(allCategories)].sort();
    }, [sourceForCategories]);

    const filteredReleases = useMemo(() => {
        // 1. Select initial list: all releases or only favorites
        let releases = showFavoritesOnly ? allReleases.filter(r => favorites.includes(r.id)) : allReleases;

        // 2. Apply other filters to this list
        if (selectedDate) {
            releases = releases.filter(release => isSameDay(new Date(release.dateCreated), selectedDate));
        } else if (!showFavoritesOnly) { // Week filter applies only in non-favorites mode
            releases = releases.filter(release => isWithinInterval(new Date(release.dateCreated), currentWeekInterval));
        }

        if (selectedCategory) {
            releases = releases.filter(release => release.publishCategories?.includes(selectedCategory));
        }

        return releases;
    }, [allReleases, selectedDate, selectedCategory, showFavoritesOnly, favorites, currentWeekInterval]);

    const ITEMS_PER_PAGE = 50;
    const totalPages = Math.ceil(filteredReleases.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filteredReleases.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // --- START REFACTORING HERE ---
    const handleImportAndEdit = async (release: RssRelease) => {
        if (!user) {
            toast.error("You must be logged in to perform this action.");
            return;
        }

        setLoadingId(release.id);
        try {
            const idToken = await user.getIdToken();
            // Use unified endpoint instead of /api/import-release
            const response = await fetch('/api/documents/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken,
                    creationData: {
                        source: 'release',
                        release: release,
                        context: {
                            agencyId: agencyId,
                            clientId: activeClientId,
                            projectId: activeProjectId,
                        }
                    },
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to import release.');
            }

            toast.success('Release imported successfully! Opening editor...');
            router.push(`/docs/${data.newDocumentId}`);
            setViewingRelease(null); // Close modal

        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast.error("Import Failed", { description: message });
        } finally {
            setLoadingId(null);
        }
    };

    const handleRewriteAndImport = async (release: RssRelease, style: RewriteStyle) => {
        if (!user) {
            toast.error("You must be logged in to perform this action.");
            return;
        }

        setLoadingId(release.id);
        try {
            const idToken = await user.getIdToken();

            // PAKEITIMAS: Viena unifikuota užklausa į teisingą API
            const response = await fetch('/api/rewrite-and-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken,
                    release: release, // Siunčiame visą originalų pranešimą
                    rewriteStyle: style, // Nurodome perrašymo stilių
                    // Kontekstas, kuriam priskirti dokumentą
                    agencyId: agencyId,
                    clientId: activeClientId,
                    projectId: activeProjectId,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                // Klaidos pranešimas dabar ateis tiesiai iš serverio
                throw new Error(data.error || 'Failed to rewrite and import release.');
            }

            toast.success('Release rewritten successfully! Opening editor...');
            router.push(`/docs/${data.newDocumentId}`);
            setViewingRelease(null); // Uzdarome modalą

        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast.error("Rewrite Failed", { description: message });
        } finally {
            setLoadingId(null);
        }
    };
    // --- END REFACTORING ---

    if (loading) {
      return (
        <div className="space-y-6">
          {/* Keep header and filters visible for user context */}
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Rss className="h-7 w-7 text-primary" />
              Public Releases
            </h1>
            {/* You can keep filter skeletons here, but simpler to just hide them */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Generate 9 skeleton cards */}
            {Array.from({ length: 9 }).map((_, index) => (
              <ReleaseCardSkeleton key={index} />
            ))}
          </div>
        </div>
      );
    }

    if (error) { /* ... stays the same ... */ 
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Rss className="h-7 w-7 text-primary" />
              Public Releases
            </h1>
          </div>
          <Card className="h-64 flex flex-col items-center justify-center text-center border-dashed">
            <Rss className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">Error Loading Releases</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">{error}</p>
          </Card>
        </div>
      );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Rss className="h-7 w-7 text-primary" />
                    {showFavoritesOnly ? 'Favorite Releases' : 'Public Releases'}
                </h1>
                <div className="flex items-center gap-2">
                    {showFavoritesOnly ? (
                        <Button variant="outline" onClick={() => setShowFavoritesOnly(false)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to All
                        </Button>
                    ) : (
                        <>
                            {dataSource === 'cities' ? (
                                <Button variant="default" onClick={() => setDataSource('bns')}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Bendros Naujienos
                                </Button>
                            ) : (
                                <Button variant="outline" onClick={() => setDataSource('cities')}>
                                    <Building className="mr-2 h-4 w-4" />
                                    Savivaldybių Naujienos
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => setShowFavoritesOnly(true)}
                            >
                                <Star className="mr-2 h-4 w-4" />
                                Favorites ({favorites.length})
                            </Button>
                        </>
                    )}

                    {/* Filters are always visible, but work with different data sources */}
                    <Select value={selectedCategory || 'all'} onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}>
                        <SelectTrigger className="w-[240px]">
                            <SelectValue placeholder="Filter by category..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {uniqueCategories.map(category => (
                                <SelectItem key={category} value={category}>
                                    {capitalize(category)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <DayFilter weekDays={weekDays} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                </div>
            </div>

            {/* Display logic remains unchanged */}
            {filteredReleases.length > 0 ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedItems.map(release => (
                        <ReleaseCard
                            key={release.id}
                            release={release}
                            onView={() => setViewingRelease(release)}
                            isLoading={loadingId === release.id}
                            // NEW PROPS
                            isFavorite={isFavorite(release.id)}
                            onToggleFavorite={() => isFavorite(release.id) ? removeFavorite(release.id) : addFavorite(release.id)}
                            dataSource={dataSource} // <-- ADDED NEW PROP
                        />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2">
                            {/* Pagination buttons remain unchanged... */}
                        </div>
                    )}
                </div>
            ) : (
                <Card className="h-64 flex flex-col items-center justify-center text-center border-dashed">
                    <Rss className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Releases Found</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                        {selectedDate
                            ? `There are no public releases for ${format(selectedDate, 'MMMM d')}`
                            : "We couldn't find any public releases for current week"
                        }
                        {selectedCategory && ` in "${capitalize(selectedCategory)}" category`}.
                    </p>
                </Card>
            )}

            <ReleaseViewModal
                release={viewingRelease}
                isOpen={!!viewingRelease}
                setIsOpen={() => setViewingRelease(null)}
                dataSource={dataSource}
                onImportAndEdit={handleImportAndEdit}
                onRewriteAndImport={handleRewriteAndImport}
                isImporting={loadingId === viewingRelease?.id}
                isProcessing={loadingId === viewingRelease?.id}
                isFavorite={viewingRelease ? isFavorite(viewingRelease.id) : false}
                onToggleFavorite={(release) => release && (isFavorite(release.id) ? removeFavorite(release.id) : addFavorite(release.id))}
            />
        </div>
    );
}
