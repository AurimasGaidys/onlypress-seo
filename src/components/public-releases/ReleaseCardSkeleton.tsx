// src/components/public-releases/ReleaseCardSkeleton.tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReleaseCardSkeleton() {
  return (
    <Card className="flex flex-col h-full animate-pulse">
      {/* Image Skeleton */}
      <Skeleton className="aspect-video w-full bg-muted border-b" />

      <div className="flex flex-col flex-grow p-4 space-y-3">
        {/* Header Skeleton */}
        <CardHeader className="p-0 space-y-2">
          <Skeleton className="h-5 w-3/4 bg-muted" />
          <Skeleton className="h-4 w-1/2 bg-muted" />
        </CardHeader>

        {/* Content Skeleton */}
        <CardContent className="p-0 flex-grow space-y-2">
          <Skeleton className="h-4 w-full bg-muted" />
          <Skeleton className="h-4 w-5/6 bg-muted" />
        </CardContent>

        {/* Footer Skeleton */}
        <CardFooter className="p-0 flex gap-2">
          <Skeleton className="h-10 w-full bg-muted" />
          <Skeleton className="h-10 w-full bg-muted" />
        </CardFooter>
      </div>
    </Card>
  );
}
