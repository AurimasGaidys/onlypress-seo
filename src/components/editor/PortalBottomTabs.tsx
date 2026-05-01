'use client';

import { PortalPublic } from '@/types/portalPublic';
import { PortalVariant } from '@/types/document';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Clock,
  Loader2,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortalBottomTabsProps {
  portals: PortalPublic[];
  publishVariants: Record<string, PortalVariant>;
  activePortalId: string | null;
  onTabClick: (portalId: string | null) => void;
}

export default function PortalBottomTabs({
  portals,
  publishVariants,
  activePortalId,
  onTabClick,
}: PortalBottomTabsProps) {

  const getStatusIcon = (status: PortalVariant['status']) => {
    switch (status) {
      case 'generated':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'generating':
        return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />;
      case 'published':
        return <CheckCircle2 className="h-3 w-3 text-primary" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-destructive" />;
      case 'pending':
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: PortalVariant['status']) => {
    switch (status) {
      case 'generated':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'generating':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'published':
        return 'border-primary bg-primary/10';
      case 'failed':
        return 'border-destructive bg-destructive/10';
      default:
        return 'border-border bg-muted/50';
    }
  };

  return (
    <div className="border-t bg-background">
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-2">
        {/* Tabs for Each Portal */}
        {portals.map(portal => {
          const variant = publishVariants[portal.id];
          const displayTitle = portal.title || portal.description || portal.domain;
          const status = variant?.status || 'pending';
          const isActive = activePortalId === portal.id;

          return (
            <Button
              key={portal.id}
              variant="ghost"
              size="sm"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 transition-all relative",
                isActive
                  ? `border-primary bg-accent ${getStatusColor(status)}`
                  : "border-transparent hover:bg-accent/50"
              )}
              onClick={() => onTabClick(portal.id)}
            >
              {getStatusIcon(status)}
              <span className="font-medium max-w-[120px] truncate">
                {displayTitle}
              </span>

              {/* Price Badge */}
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5 h-auto"
              >
                €{portal.price?.toFixed(0) || '0'}
              </Badge>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
