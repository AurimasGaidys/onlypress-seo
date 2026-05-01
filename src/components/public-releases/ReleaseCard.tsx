import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { RssRelease } from '@/types/rss';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ChevronLeft, ChevronRight, Image as ImageIcon, Star, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { extractImageUrls, getPlainTextPreview } from '@/lib/rss-utils';
import { cn } from '@/lib/utils';

// --- PAKEITIMAS PRASIDEDA ČIA (1/2) ---
type DataSource = 'bns' | 'cities';

interface ReleaseCardProps {
  release: RssRelease;
  onView: () => void;
  isLoading: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  dataSource: DataSource; // <-- PRIDEDAME NAUJĄ PROP
}
// --- PAKEITIMO PABAIGA (1/2) ---

export default function ReleaseCard({ release, onView, isLoading, isFavorite, onToggleFavorite, dataSource }: ReleaseCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- PAKEITIMAS PRASIDEDA ČIA (2/2) ---
  const imageUrls = useMemo(() => {
      // Pašaliname seną sąlygą ir visada kviečiame funkciją su abiem argumentais
      return extractImageUrls(release, dataSource);
  }, [release, dataSource]);
  // --- PAKEITIMO PABAIGA (2/2) ---
  const descriptionPreview = useMemo(() => {
    const preview = getPlainTextPreview(release.textInfo.content, 120);
    return preview || "No description available";
  }, [release.textInfo.content]);

  // === PRADĖTI PAKEITIMĄ ČIA: Automatinės karuselės logika ===
  useEffect(() => {
    // 1. Vykdome tik jei yra daugiau nei viena nuotrauka.
    if (imageUrls.length <= 1) {
      return;
    }

    // 2. Apskaičiuojame atsitiktinį intervalą tarp 4 ir 7 sekundžių.
    const minDelay = 4000;
    const maxDelay = 7000;
    const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

    // 3. Nustatome laikmatį, kuris pakeis nuotrauką.
    const timerId = setTimeout(() => {
      // Saugus būdas pereiti prie kitos nuotraukos, grįžtant į pradžią pasiekus pabaigą.
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % imageUrls.length);
    }, randomDelay);

    // 4. Valymo funkcija. Ji bus iškviesta, kai komponentas bus sunaikintas
    // arba kai pasikeis priklausomybės (imageUrls, currentImageIndex).
    // Tai apsaugo nuo atminties nutekėjimo ir atnaujina laikmatį, jei vartotojas paspaudžia mygtuką.
    return () => {
      clearTimeout(timerId);
    };
  }, [imageUrls, currentImageIndex]); // Priklausomybės: laikmatis persikraus, jei pasikeis nuotraukos arba vartotojas perjungia rankiniu būdu.
  // === PAKEITIMO PABAIGA ===

  useEffect(() => {
    // Resetiname indeksą, kai pasikeičia pats pranešimas (`release`)
    setCurrentImageIndex(0);
  }, [release]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  return (
    <Card className="flex flex-col h-full hover:border-primary/50 transition-colors group">
      <div className="relative aspect-video w-full bg-muted/50 border-b overflow-hidden">
        {imageUrls.length > 0 ? (
          <>
            <div
              className="flex"
              style={{
                width: `${imageUrls.length * 100}%`,
                transform: `translateX(-${(currentImageIndex * 100) / imageUrls.length}%)`,
                transition: 'transform 0.5s ease-in-out'
              }}
            >
              {imageUrls.map((url, index) => (
                <Image
                  key={url}
                  src={url}
                  alt={`${release.textInfo.title} - image ${index + 1}`}
                  width={400}
                  height={225}
                  unoptimized={true}
                  style={{
                    width: `${100 / imageUrls.length}%`,
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => { e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; }}
                />
              ))}
            </div>
            {imageUrls.length > 1 && (
              <>
                <Button
                  variant="ghost" size="icon" onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost" size="icon" onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Badge variant="secondary" className="absolute bottom-2 right-2">
                  {currentImageIndex + 1} / {imageUrls.length}
                </Badge>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-muted/30">
            {/* Sluoksniuotos ikonos, vaizduojančios "vaizdas + AI" */}
            <div className="relative mb-3">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
              <Sparkles className="absolute -bottom-1 -right-1 h-6 w-6 text-primary" />
            </div>

            {/* Naujas tekstas */}
            <p className="font-semibold text-foreground">No Image Found</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Don't worry, our AI is ready to create stunning visuals for your article after you import it.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow p-4 space-y-3">
        <div onClick={onView} className="cursor-pointer">
            <CardHeader className="p-0">
                <CardTitle className="line-clamp-2 h-[3.5rem] leading-tight group-hover:text-primary transition-colors">
                    {release.textInfo.title}
                </CardTitle>
                <CardDescription>
                    {format(new Date(release.dateCreated), 'yyyy-MM-dd HH:mm')}
                </CardDescription>
            </CardHeader>
        </div>

        <CardContent className="p-0 flex-grow space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2 h-[2.5rem]">
                {descriptionPreview}
            </p>

            <div className="flex flex-wrap gap-2 h-[3rem] overflow-hidden">
                {release.publishCategories?.map(category => (
                    <Badge key={category} variant="secondary">{capitalize(category)}</Badge>
                ))}
            </div>
        </CardContent>

        <CardFooter className="p-0 flex gap-2">
          <Button variant="default" onClick={onView} className="flex-1">
            <Eye className="mr-2 h-4 w-4" /> View
          </Button>

          <Button
            variant={isFavorite ? "secondary" : "outline"}
            className="flex-1"
            onClick={(e) => {
                e.stopPropagation(); // Svarbu, kad neatsidarytų modal'as
                onToggleFavorite();
            }}
          >
            <Star className={cn("mr-2 h-4 w-4", isFavorite && "fill-current text-yellow-400")} />
            {isFavorite ? "Favorited" : "Favorite"}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}

// Pridedame capitalize funkciją, jei kartais jos čia nebūtų
const capitalize = (s: string) => {
  if (typeof s !== 'string' || s.length === 0) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};
