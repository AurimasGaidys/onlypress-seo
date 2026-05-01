'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Plus, Loader2 } from 'lucide-react';
import { ScheduledItem } from './types';
import { ArticleDocument } from '@/types/document';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { SortableScheduleItem } from './SortableScheduleItem';
import { PortalPublic } from '@/types/portalPublic';

interface DayScheduleModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  day: Date;
  items: ScheduledItem[];
  documentsMap: Map<string, ArticleDocument>;
  onSwitchToCreation?: (day: Date) => void;
  refetch: () => void;
  timeInterval?: number; // Laiko intervalas valandomis
  portals: PortalPublic[]; // <-- 2. ADD THIS LINE
  lastEditedDocId: string | null; // NAUJAS PROP
}

export default function DayScheduleModal({
  isOpen,
  setIsOpen,
  day,
  items,
  documentsMap,
  onSwitchToCreation,
  refetch,
  timeInterval = 4, // Pagal nutylėjimą 4 valandos
  portals, // <-- GET PROP HERE
  lastEditedDocId, // NAUJAS PROP
}: DayScheduleModalProps) {
  const { user } = useAuth();
  const [activeItems, setActiveItems] = useState<ScheduledItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Atnaujiname vidinę būseną, kai pasikeičia iš išorės gaunami įrašai
  useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const dateA = new Date(typeof a.scheduledAt === 'string' ? a.scheduledAt : a.scheduledAt.toDate());
      const dateB = new Date(typeof b.scheduledAt === 'string' ? b.scheduledAt : b.scheduledAt.toDate());
      return dateA.getTime() - dateB.getTime();
    });
    setActiveItems(sorted);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = activeItems.findIndex((item) => item.id === active.id);
      const newIndex = activeItems.findIndex((item) => item.id === over?.id);
      
      const newOrder = arrayMove(activeItems, oldIndex, newIndex);
      setActiveItems(newOrder);

      // "Smart Time" atnaujinimo logika
      updateTimesAfterDrag(newOrder);
    }
  };

  const updateTimesAfterDrag = async (newOrder: ScheduledItem[]) => {
    if (!user) return;
    setIsUpdating(true);
    
    // Sukuriame naujus laikus pagal pasirinktą intervalą, pradedant nuo 8:00
    const newTimes = newOrder.map((item, index) => {
      const newDate = new Date(day);
      const hoursToAdd = index * timeInterval; // Priklauso nuo intervalo (pvz: 0.5, 1, 2, 3, 4, 5, 6)
      const totalHours = 8 + hoursToAdd;
      const hours = Math.floor(totalHours);
      const minutes = Math.round((totalHours - hours) * 60); // Valandų dalis į minutes
      
      newDate.setHours(hours, minutes, 0, 0);
      return { id: item.id, newScheduledAt: newDate.toISOString() };
    });

    try {
        const idToken = await user.getIdToken();
        // Lygiagrečiai siunčiame atnaujinimo užklausas su detaliu error handling
        const updatePromises = newTimes.map(async ({ id, newScheduledAt }) => {
            const response = await fetch(`/api/agency/schedules/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken, newScheduledAt }),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update schedule ${id}: ${response.status} ${errorText}`);
            }
            
            return response.json();
        });
        
        await Promise.all(updatePromises);
        toast.success("Schedule reordered successfully!");
        refetch(); // Atnaujiname duomenis iš serverio
    } catch (error) {
        console.error('Failed to reorder schedule:', error);
        toast.error(`Failed to reorder schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setActiveItems(items); // Atstatome pradinę tvarką
    } finally {
        setIsUpdating(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!user || !confirm('Are you sure you want to delete this scheduled item?')) return;
    try {
      const idToken = await user.getIdToken();
      await fetch(`/api/agency/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      toast.success("Schedule deleted!");
      refetch();
    } catch {
      toast.error("Failed to delete schedule.");
    }
  };

  const handleAddPost = () => {
    setIsOpen(false);
    if (onSwitchToCreation) {
      onSwitchToCreation(day);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{format(day, 'EEEE, MMMM d, yyyy')}</DialogTitle>
          <DialogDescription>Drag and drop to reorder posts for this day.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activeItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {activeItems.map(item => (
                <SortableScheduleItem
                  key={item.id}
                  item={item}
                  document={documentsMap.get(item.documentId)}
                  onEdit={(docId) => window.open(`/docs/${docId}`, '_blank')}
                  onDelete={handleDelete}
                  portals={portals} // <-- PASS PROP HERE
                  isLastEdited={item.documentId === lastEditedDocId} // NAUJAS PROP
                />
              ))}
            </SortableContext>
          </DndContext>

          {activeItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground h-full flex flex-col items-center justify-center">
              No scheduled posts for this day.
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t mt-auto">
            <Button onClick={handleAddPost} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Post
            </Button>
            {isUpdating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving changes...
                </div>
            )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
