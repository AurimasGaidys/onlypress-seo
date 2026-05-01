// src/components/public-releases/ReleaseViewModal.tsx
import { RssRelease } from '@/types/rss';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import DOMPurify from 'isomorphic-dompurify';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  FilePenLine, Loader2, Newspaper, BarChart3, MessageSquareQuote,
  Rocket, Info, User, Calendar, X, Tag, Star, Building
} from 'lucide-react';
import { Label } from '@/components/ui/label';

type RewriteStyle = "news_article" | "analytical_review" | "qa_format";
type DataSource = 'bns' | 'cities';

interface ReleaseViewModalProps {
  release: RssRelease | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  dataSource: DataSource;
  onImportAndEdit: (release: RssRelease) => void;
  onRewriteAndImport: (release: RssRelease, style: RewriteStyle) => void;
  isImporting: boolean;
  isProcessing: boolean;
  isFavorite: boolean;
  onToggleFavorite: (release: RssRelease | null) => void;
}

export default function ReleaseViewModal({
  release,
  isOpen,
  setIsOpen,
  dataSource,
  onImportAndEdit,
  onRewriteAndImport,
  isImporting,
  isProcessing,
  isFavorite,
  onToggleFavorite,
}: ReleaseViewModalProps) {
  if (!release) return null;

  const sanitizedContent = DOMPurify.sanitize(release.textInfo.content);

  // --- PRADĖTI PATAISYMĄ ČIA ---
  // 1. Patikriname, ar egzistuoja pagrindinė nuotrauka (`featuredImage`)
  const featuredImageUrl = release.textInfo.seo?.featuredImage;
  let finalContent = sanitizedContent;

  // 2. Surenkame visas nuotraukas, kurios JAU YRA turinyje
  const imagesInContent = Array.from(
    new DOMParser().parseFromString(sanitizedContent, 'text/html').querySelectorAll('img')
  ).map(img => img.src);

  // 3. Pridedame pagrindinę nuotrauką TIK jei jos dar nėra turinyje, kad išvengtume dublikatų
  if (featuredImageUrl && !imagesInContent.some(src => src.includes(featuredImageUrl))) {
    finalContent += `
      <p style="text-align: center; margin-top: 2em;">
        <img
          src="${featuredImageUrl}"
          alt="${release.textInfo.title}"
          style="max-width: 100%; height: auto; border-radius: 8px;"
        />
      </p>
    `;
  }
  // --- PATAISYMO PABAIGA ---

  const isLoading = isImporting || isProcessing;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* === GALUTINIS SPRENDIMAS: Naudojame inline stilių === */}
      <DialogContent
        className="p-0 flex flex-col"
        showCloseButton={false}
        style={{
          width: '90vw',
          maxWidth: '90vw',
          height: '90vh'
        }}
      >
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <div className="flex-1 overflow-hidden pr-8">
                 <DialogTitle className="truncate text-xl">{release.textInfo.title}</DialogTitle>
                 <DialogDescription className="truncate">{release.publishCategories?.join(', ')}</DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
            </Button>
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-grow min-h-0">
          <ResizablePanel defaultSize={70} minSize={50}>
            <div className="h-full overflow-y-auto p-6 lg:p-8">

              <div
                className="prose dark:prose-invert max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: finalContent }} // <-- Naudojame finalContent
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={30} minSize={25}>
            <div className="h-full overflow-y-auto p-6 bg-muted/30 flex flex-col space-y-6">

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><Rocket className="h-5 w-5 text-primary" /> Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* NAUJAS FAVORITŲ MYGTUKAS */}
                  <Button onClick={() => onToggleFavorite(release)} variant={isFavorite ? "secondary" : "outline"} className="w-full h-10 text-base">
                      <Star className={cn("mr-2 h-4 w-4", isFavorite && "fill-current text-yellow-400")} />
                      {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  </Button>

                  <Button onClick={() => onImportAndEdit(release)} disabled={isLoading} variant="secondary" className="w-full h-10 text-base">
                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePenLine className="mr-2 h-4 w-4" />}
                    Import Original
                  </Button>
                  <Separator className="my-4"/>
                  <Label className="text-sm font-medium">Rewrite with AI</Label>
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => onRewriteAndImport(release, 'news_article')} disabled={isLoading} className="w-full justify-start h-10">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Newspaper className="mr-2 h-4 w-4" />}
                        As News Article
                    </Button>
                    <Button onClick={() => onRewriteAndImport(release, 'analytical_review')} disabled={isLoading} className="w-full justify-start h-10">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
                        As Analytical Review
                    </Button>
                    <Button onClick={() => onRewriteAndImport(release, 'qa_format')} disabled={isLoading} className="w-full justify-start h-10">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquareQuote className="mr-2 h-4 w-4" />}
                        As Q&A Format
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><Info className="h-5 w-5" /> Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-foreground">Published</p>
                        <p className="text-muted-foreground">{format(new Date(release.dateCreated), 'yyyy-MM-dd, HH:mm')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Tag className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-foreground">Categories</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {release.publishCategories?.map((category: string) => (
                                <Badge key={category} variant="secondary">{capitalize(category)}</Badge>
                            ))}
                        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {dataSource === 'cities' && release.sourceName ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building className="h-5 w-5" /> Source
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p>
                      <span className="font-semibold text-foreground">Name:</span>{' '}
                      <span className="text-muted-foreground">{release.sourceName}</span>
                    </p>
                  </CardContent>
                </Card>
              ) : dataSource === 'bns' && release.contacts ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5" /> Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {release.contacts.name && <p><span className="font-semibold text-foreground">Name:</span> <span className="text-muted-foreground">{release.contacts.name}</span></p>}
                        {release.contacts.company && <p><span className="font-semibold text-foreground">Company:</span> <span className="text-muted-foreground">{release.contacts.company}</span></p>}
                        {release.contacts.position && <p><span className="font-semibold text-foreground">Position:</span> <span className="text-muted-foreground">{release.contacts.position}</span></p>}
                        {release.contacts.phone && <p><span className="font-semibold text-foreground">Phone:</span> <span className="text-muted-foreground">{release.contacts.phone}</span></p>}
                    </CardContent>
                </Card>
              ) : null}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </DialogContent>
    </Dialog>
  );
}

const capitalize = (s: string) => {
  if (typeof s !== 'string' || s.length === 0) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};
