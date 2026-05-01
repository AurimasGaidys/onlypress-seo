'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Edit, Trash2, Globe } from 'lucide-react';
import { ScheduledItem } from './types';
import { ArticleDocument } from '@/types/document';
import { PortalPublic } from '@/types/portalPublic';
import { format, isPast } from 'date-fns';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface SortableScheduleItemProps {
  item: ScheduledItem;
  document: ArticleDocument | undefined;
  portals: PortalPublic[];
  onEdit: (documentId: string) => void;
  onDelete: (scheduleId: string) => void;
  isLastEdited: boolean; // NAUJAS PROP
}

export function SortableScheduleItem({ item, document, portals, onEdit, onDelete, isLastEdited }: SortableScheduleItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };
  
  const scheduledDate = typeof item.scheduledAt === 'object' && 'toDate' in item.scheduledAt
    ? item.scheduledAt.toDate()
    : new Date(item.scheduledAt as string | number | Date);

  // Find portal by ID
  const portal = useMemo(() => {
    if (!item.portalId || item.portalId === '' || !portals) return null;
    return portals.find(p => p.id === item.portalId);
  }, [item.portalId, portals]);

  return (
    <Card ref={setNodeRef} style={style} className="relative mb-2 p-2 flex items-start gap-3 touch-none bg-background shadow-sm">
      {/* NAUJAS KODAS PRASIDEDA ČIA */}
      {isLastEdited && (
        <Badge className="absolute bottom-2 right-2 text-xs z-10 bg-orange-100 text-orange-800 hover:bg-orange-200">
          Last Edited
        </Badge>
      )}
      {/* NAUJAS KODAS PASIBAIGIA ČIA */}

      {document?.metadata?.featuredImage && (
        <Image
          src={document.metadata?.featuredImage || ''}
          alt={document.title}
          width={64}
          height={64}
          className="rounded-md object-cover w-16 h-16"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline">{format(scheduledDate, 'HH:mm')}</Badge>
          <button 
            onClick={() => onEdit(item.documentId)}
            className="text-sm font-semibold truncate text-left hover:text-blue-600 transition-colors hover:underline"
            title={document?.title || `Loading document...`}
          >
            {document?.title || `Loading...`}
          </button>
        </div>
        <div className="flex items-center gap-2">
            {portal ? (
              <a 
                href={portal.domain} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title={`Open ${portal.domain || portal.domain} in new tab`}
              >
                <Globe className="h-3 w-3" />
                <span className="truncate hover:underline">{portal.domain || portal.url}</span>
              </a>
            ) : (
              <Badge variant="outline" className="text-xs">No Portal</Badge>
            )}
            {/* "Protingas" statusas: jei laikas praėjo, bet DB statusas dar 'scheduled', rodome kaip 'published' */}
            {(() => {
                const isPastTime = isPast(scheduledDate);
                const effectiveStatus = (isPastTime && item.status === 'scheduled') ? 'published' : item.status;
                
                return (
                    <Badge className={cn(
                        "text-xs",
                        {
                            'bg-green-100 text-green-800': effectiveStatus === 'published',
                            'bg-blue-100 text-blue-800': effectiveStatus === 'scheduled',
                            'bg-yellow-100 text-yellow-800': effectiveStatus === 'draft',
                            'bg-gray-100 text-gray-800': !effectiveStatus || effectiveStatus === 'pending',
                        }
                    )}>
                        {effectiveStatus}
                    </Badge>
                );
            })()}
        </div>
      </div>
      <div className="flex gap-1">
        <div {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground">
          <GripVertical className="h-5 w-5" />
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(item.documentId)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
