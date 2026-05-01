'use client';

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, isToday, startOfWeek, endOfWeek, eachDayOfInterval as eachDayOfIntervalFull, isSameDay } from 'date-fns';
import { DayCard } from './DayCard';
import { ScheduledItem, SchedulerNote } from './types';
import { ArticleDocument } from '@/types/document';

interface CalendarGridProps {
  month: Date;
  schedulesByDay: Map<string, ScheduledItem[]>;
  documentsMap: Map<string, ArticleDocument>;
  agencyId: string;
  clientId: string;
  onDrop: (e: React.DragEvent, day: Date) => void;
  isProcessingDrop: boolean;
  onDayClick: (day: Date) => void;
  droppingOnDay: string | null;
  highlightInfo: { docId: string; scheduledDate: Date } | null; // <-- PAKEISTAS PROP
  notesByDay: Map<string, SchedulerNote>;
  onPinClick: (day: Date, content: string) => void;
}

export default function CalendarGrid({
  month,
  schedulesByDay,
  documentsMap,
  agencyId,
  clientId,
  onDrop,
  isProcessingDrop,
  onDayClick,
  droppingOnDay,
  highlightInfo, // <-- PAKEISTAS PROP
  notesByDay,
  onPinClick,
}: CalendarGridProps) {

  const days = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfIntervalFull({ start: calendarStart, end: calendarEnd });
  }, [month]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Savaitės dienų antraštės */}
      {weekDays.map((day) => (
        <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
          {day}
        </div>
      ))}
      
      {/* Dienos kortelės */}
      {days.map((day) => {
        const dayKey = format(day, 'yyyy-MM-dd');
        const scheduledItemsForDay = schedulesByDay.get(dayKey) || [];
        const isProcessingDropForThisCard = droppingOnDay === dayKey;
        const isCurrentMonth = day.getMonth() === month.getMonth();
        const note = notesByDay.get(dayKey);
        
        // PATAISYTA LOGIKA ČIA:
        const isLastEditedDay = highlightInfo ? isSameDay(day, highlightInfo.scheduledDate) : false;

        return (
          <DayCard
            key={dayKey}
            day={day}
            scheduledItems={scheduledItemsForDay}
            documentsMap={documentsMap}
            agencyId={agencyId}
            clientId={clientId}
            onDrop={onDrop}
            isProcessingDrop={isProcessingDrop}
            onDayClick={onDayClick}
            isCurrentMonth={isCurrentMonth}
            isToday={isToday(day)}
            isProcessingDropForThisCard={isProcessingDropForThisCard}
            isLastEditedDay={isLastEditedDay} // Perduodame teisingą reikšmę
            note={note}
            onPinClick={onPinClick}
          />
        );
      })}
    </div>
  );
}
