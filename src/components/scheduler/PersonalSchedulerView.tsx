'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnifiedSchedulerData } from '@/hooks/useUnifiedSchedulerData';
import CalendarGrid from '@/components/agency/scheduler/CalendarGrid';
import DayScheduleModal from '@/components/agency/scheduler/DayScheduleModal';
import CreationModal from '@/components/agency/scheduler/CreationModal';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext'; // Pridėtas importas
import { PortalPublic } from '@/types/portalPublic';
import { useSchedulerNotes } from '@/hooks/useSchedulerNotes';

// <-- 2. CREATE PROPS INTERFACE -->
interface PersonalSchedulerViewProps {
  portals: PortalPublic[];
}

export default function PersonalSchedulerView({ portals }: PersonalSchedulerViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [modalDay, setModalDay] = useState<Date | null>(null);
  const [modalType, setModalType] = useState<'schedule' | 'creation' | null>(null);
  
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth(); // Pridėtas user hook

  // We use to unified hook with personal workspace context
  const { documentsMap, isLoading, schedulesByDay, refetch } = useUnifiedSchedulerData(activeWorkspace, currentMonth);

  // Apskaičiuojame highlightInfo - dokumentas su naujausia lastEdited data
  const highlightInfo = useMemo(() => {
    // 1. Patikriname, ar turime duomenų
    if (documentsMap.size === 0 || schedulesByDay.size === 0) {
      return null;
    }

    // 2. Konvertuojame documentsMap į masyvą ir surūšiuojame pagal lastEdited
    const documents = Array.from(documentsMap.values());
    if (documents.length === 0) {
      return null;
    }

    // 3. Surūšiuojame dokumentus pagal lastEdited datą (naujausi pirmi)
    documents.sort((a, b) => {
      const dateA = a.lastEdited instanceof Date ? a.lastEdited.getTime() : (a.lastEdited as { toDate: () => Date })?.toDate?.()?.getTime() || 0;
      const dateB = b.lastEdited instanceof Date ? b.lastEdited.getTime() : (b.lastEdited as { toDate: () => Date })?.toDate?.()?.getTime() || 0;
      return dateB - dateA;
    });
    
    const lastEditedDoc = documents[0];
    const lastEditedDocId = lastEditedDoc.id;

    // 4. Surandame, kur šis dokumentas yra suplanuotas
    const allSchedulesInMonth = Array.from(schedulesByDay.values()).flat();
    const targetSchedule = allSchedulesInMonth.find(s => s.documentId === lastEditedDocId);

    // 5. Jei radome suplanuotą įrašą, grąžiname reikiamą informaciją
    if (targetSchedule) {
      const scheduledDate = targetSchedule.scheduledAt instanceof Date
          ? targetSchedule.scheduledAt
          : (targetSchedule.scheduledAt as { toDate: () => Date }).toDate();
      
      return {
        docId: lastEditedDocId,
        scheduledDate: scheduledDate,
      };
    }

    return null;
  }, [documentsMap, schedulesByDay]);
  
  // Pridėtas scheduler notes hook su teisingais parametrais
  const personalAgencyId = user ? `personal_${user.uid}` : '';
  const personalClientId = personalAgencyId ? `${personalAgencyId}_default_client` : '';
  const agencyProjectId = (activeWorkspace as { projectId?: string | null }).projectId;
  const finalProjectId = activeWorkspace.type === 'agency' ? (agencyProjectId || 'personal') : 'personal';
  const finalAgencyId = activeWorkspace.type === 'agency' ? (activeWorkspace.id || '') : personalAgencyId;
  const { notesByDay } = useSchedulerNotes(
    finalAgencyId, 
    finalProjectId,
    currentMonth
  );

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDayClick = (day: Date) => {
    const daySchedules = schedulesByDay.get(format(day, 'yyyy-MM-dd')) || [];
    setModalDay(day);
    setModalType(daySchedules.length > 0 ? 'schedule' : 'creation');
  };

  const handleSwitchToCreation = (day: Date) => {
    setModalDay(day);
    setModalType('creation');
  };

  const handleCloseModals = (shouldRefetch = false) => {
    setModalDay(null);
    setModalType(null);
    if (shouldRefetch) {
      refetch();
    }
  };

  // onPinClick funkcija
  const handlePinClick = (day: Date, content: string) => {
    console.log('Pin clicked:', day, content);
    // TODO: Implement pin click functionality
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6" />My Content Calendar</h2>
        
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} className="h-10 px-3"><CalendarDays className="h-4 w-4 mr-2" />Today</Button>
          <span className="font-semibold min-w-[150px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
          <Button variant="outline" size="icon" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[60vh] w-full" />
      ) : (
        <CalendarGrid
          month={currentMonth}
          schedulesByDay={schedulesByDay}
          documentsMap={documentsMap}
          onDrop={() => {}} // Drag-and-drop is not implemented for personal view yet
          isProcessingDrop={false}
          onDayClick={handleDayClick}
          droppingOnDay={null}
          // For personal space, use actual personal agency values
          agencyId={personalAgencyId} 
          clientId={personalClientId}
          highlightInfo={highlightInfo} // Perduodame apskaičiuotą highlightInfo
          notesByDay={notesByDay}
          onPinClick={handlePinClick}
        />
      )}

      {modalDay && (
        <>
          <DayScheduleModal
            isOpen={modalType === 'schedule'}
            setIsOpen={(open) => !open && handleCloseModals()}
            day={modalDay}
            items={schedulesByDay.get(format(modalDay, 'yyyy-MM-dd')) || []}
            documentsMap={documentsMap}
            onSwitchToCreation={handleSwitchToCreation}
            refetch={refetch}
            portals={portals}
            lastEditedDocId={highlightInfo?.docId || null} // Perduodame last edited dokumento ID
          />
          <CreationModal
            isOpen={modalType === 'creation'}
            setIsOpen={(open) => !open && handleCloseModals()}
            onCreationSuccess={() => {
                refetch();
                handleCloseModals();
            }}
            selectedDate={modalDay}
            // For personal space, use actual personal agency values
            agencyId={personalAgencyId}
            clientId={personalClientId}
            projectId={personalAgencyId ? `${personalAgencyId}_default_project` : ''}
          />
        </>
      )}
    </div>
  );
}
