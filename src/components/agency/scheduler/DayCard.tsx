'use client';

import { useState } from 'react';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScheduledItem, SchedulerNote } from './types';
import { ArticleDocument } from '@/types/document';
import { Badge } from '@/components/ui/badge';
import { Upload, Plus, Pin } from 'lucide-react';

interface DayCardProps {
  day: Date;
  scheduledItems: ScheduledItem[];
  documentsMap: Map<string, ArticleDocument>;
  agencyId: string;
  clientId: string;
  onDrop: (e: React.DragEvent, day: Date) => void;
  isProcessingDrop: boolean;
  onDayClick: (day: Date) => void;
  isCurrentMonth: boolean;
  isToday: boolean;
  isProcessingDropForThisCard: boolean;
  isLastEditedDay: boolean;
  note?: SchedulerNote;
  onPinClick: (day: Date, content: string) => void;
}

export function DayCard({
  day,
  scheduledItems,
  documentsMap,
  onDrop,
  onDayClick,
  isCurrentMonth,
  isToday: isTodayDate,
  isProcessingDropForThisCard,
  isLastEditedDay,
  note,
  onPinClick
}: DayCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Nustatome dabartinį laiką vieną kartą, kad išvengtume perskaičiavimų
  const now = new Date();
  const isPastDay = isPast(day) && !isTodayDate;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e, day);
  };

  const handleClick = () => {
    onDayClick(day);
  };

  return (
    <div
      className={cn(
        'relative min-h-[160px] p-2 border rounded-lg transition-all duration-200 cursor-pointer hover:bg-muted/50 group',
        {
          'bg-primary/10 border-primary/50': isTodayDate,
          'bg-green-50/50 border-green-200/50': isPastDay && isCurrentMonth, // Žalias atspalvis praėjusioms dienoms
          'bg-muted/30 border-border/50 opacity-60': !isCurrentMonth,
          'ring-2 ring-primary ring-offset-2': isProcessingDropForThisCard || isDragOver,
          'bg-orange-100 border-orange-300 hover:bg-orange-100/80': isLastEditedDay, // NAUJAS SOFTESTAS STILIUS
        }
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* Pin icon */}
      <div 
        className="absolute top-1 right-1 p-1 rounded-full cursor-pointer hover:bg-muted z-20"
        onClick={(e) => {
          e.stopPropagation(); // LABAI SVARBU: Sustabdome, kad neatsidarytų dienos modalas.
          onPinClick(day, note?.content || '');
        }}
      >
        <Pin className={cn(
          "h-4 w-4 transition-colors",
          note?.content ? "text-red-500 fill-red-500" : "text-muted-foreground/30 group-hover:text-muted-foreground"
        )} />
      </div>

      {isDragOver ? (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 rounded-lg">
          <Upload className="h-10 w-10 text-primary" />
          <p className="mt-2 font-semibold text-primary">Drop to schedule</p>
        </div>
      ) : scheduledItems.length === 0 ? (
        <>
          <div className={cn('absolute top-2 left-2 text-lg font-bold', { 
            'text-primary': isTodayDate, 
            'text-black': isLastEditedDay, // JUODA SPALVA KAI PAŽYMĖTA
            'text-foreground': !isTodayDate && !isLastEditedDay 
          })}>
            {format(day, 'd')}
          </div>
          <div className="flex h-full items-center justify-center">
            <Plus className="h-12 w-12 text-muted-foreground/20 group-hover:text-primary/50 transition-colors" />
          </div>
        </>
      ) : (
        <>
          <div className={cn('text-lg font-bold mb-1', { 
            'text-primary': isTodayDate, 
            'text-black': isLastEditedDay, // JUODA SPALVA KAI PAŽYMĖTA
            'text-foreground': !isTodayDate && !isLastEditedDay 
          })}>
            {format(day, 'd')}
          </div>
          <div className="space-y-1">
            {scheduledItems.slice(0, 3).map((item) => {
              const document = documentsMap.get(item.documentId);
              
              const scheduledDate = typeof item.scheduledAt === 'object' && 'toDate' in item.scheduledAt
                ? item.scheduledAt.toDate()
                : new Date(item.scheduledAt as string | number | Date);
              
              const timeString = format(scheduledDate, 'HH:mm');
              const title = document?.title ? 
                (document.title.length > 15 ? `${document.title.substring(0, 15)}...` : document.title) : 
                `Loading...`;

              // "Protingas" statusas: jei laikas praėjo, bet DB statusas dar 'scheduled', rodome kaip 'published'
              const isPastTime = scheduledDate < now;
              const effectiveStatus = (isPastTime && item.status === 'scheduled') ? 'published' : item.status;

              return (
                <div
                  key={item.id}
                  className={cn(
                    'text-xs p-1 rounded truncate',
                    {
                      'bg-green-100 text-green-800': effectiveStatus === 'published',
                      'bg-blue-100 text-blue-800': effectiveStatus === 'scheduled',
                      'bg-yellow-100 text-yellow-800': effectiveStatus === 'draft',
                      'bg-gray-100 text-gray-800': !effectiveStatus || effectiveStatus === 'pending',
                    }
                  )}
                  title={`${timeString} - ${document?.title || `Loading document...`}`}
                >
                  <span className="font-semibold">{timeString}</span> {title}
                </div>
              );
            })}
            {scheduledItems.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{scheduledItems.length - 3} more
              </div>
            )}
            {isProcessingDropForThisCard && (
              <div className="text-xs text-primary text-center animate-pulse">
                Processing...
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
