'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, CalendarDays, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSchedulerDataByProject } from '@/hooks/useSchedulerDataByProject';
import { useSchedulerDndByProject } from '@/hooks/useSchedulerDndByProject';
import { useAgencyData } from '@/hooks/useAgencyData';
import { useSchedulerNotes } from '@/hooks/useSchedulerNotes';
import { toast } from 'sonner';
import CalendarGrid from './CalendarGrid';
import DayScheduleModal from './DayScheduleModal';
import CreationModal from './CreationModal';
import NoteModal from './NoteModal';
import { PortalPublic } from '@/types/portalPublic';
import { ClientPicker } from '@/components/aa_pickers/clientPicker';

interface SchedulerPageProps {
  agencyId: string;
  portals: PortalPublic[];
}

export default function SchedulerPage({ agencyId, portals }: SchedulerPageProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [timeInterval, setTimeInterval] = useState<number>(4); // Pagal nutylėjimą 4 valandos
  const [projectIntervals, setProjectIntervals] = useState<{ [key: string]: number }>({}); // Projektų intervalai
  const [globalInterval, setGlobalInterval] = useState<number>(4); // Globalus intervalas

  const [modalDay, setModalDay] = useState<Date | null>(null);
  const [modalType, setModalType] = useState<'schedule' | 'creation' | null>(null);
  const [droppingOnDay, setDroppingOnDay] = useState<string | null>(null);
  const [noteModalState, setNoteModalState] = useState<{ day: Date; content: string } | null>(null);

  // 1. Gauname visus agentūros duomenis, įskaitant visus dokumentus
  const { projects, documents, loading: agencyDataLoading } = useAgencyData(agencyId);

  // Duomenų paėmimas pagal PROJEKTĄ
  const { documentsMap, isLoading: schedulerLoading, schedulesByDay, refetch } = useSchedulerDataByProject(
    agencyId,
    selectedProjectId,
    currentMonth
  );

  // Priminimų duomenų paėmimas
  const { notesByDay, refetch: refetchNotes } = useSchedulerNotes(
    agencyId,
    selectedProjectId,
    currentMonth
  );

  // PATAISYTAS BLOKAS PRASIDEDA ČIA
  const highlightInfo = useMemo(() => {
    // 1. Patikriname, ar turime visus reikiamus duomenis
    if (!selectedProjectId || !documents || documents.length === 0 || schedulesByDay.size === 0) {
      return null;
    }

    // 2. Išfiltruojame TIK šio projekto dokumentus
    const projectDocuments = documents.filter(doc => doc.projectId === selectedProjectId);
    if (projectDocuments.length === 0) {
      return null;
    }

    // 3. Surandame dokumentą su naujausia `lastEdited` data
    projectDocuments.sort((a, b) => {
      const dateA = a.lastEdited instanceof Date ? a.lastEdited.getTime() : (a.lastEdited as { toDate: () => Date }).toDate().getTime();
      const dateB = b.lastEdited instanceof Date ? b.lastEdited.getTime() : (b.lastEdited as { toDate: () => Date }).toDate().getTime();
      return dateB - dateA;
    });
    const lastEditedDoc = projectDocuments[0];
    const lastEditedDocId = lastEditedDoc.id;

    // 4. Surandame, kur šis dokumentas yra SUPLANUOTAS šiame mėnesyje
    const allSchedulesInMonth = Array.from(schedulesByDay.values()).flat();
    const targetSchedule = allSchedulesInMonth.find(s => s.documentId === lastEditedDocId);

    // 5. Jei radome suplanuotą įrašą, grąžiname reikiamą informaciją
    if (targetSchedule) {
      const scheduledDate = targetSchedule.scheduledAt instanceof Date
        ? targetSchedule.scheduledAt
        : (targetSchedule.scheduledAt as { toDate: () => Date }).toDate();

      return {
        docId: lastEditedDocId,       // Dokumento ID modalui
        scheduledDate: scheduledDate, // Diena, kurią reikia nuspalvinti
      };
    }

    return null; // Neradome suplanuoto įrašo šiam dokumentui
  }, [selectedProjectId, documents, schedulesByDay]); // Dabar priklausome ir nuo schedulesByDay
  // PATAISYTO BLOKO PABAIGA

  // Krauname išsaugotus intervalus iš localStorage
  useEffect(() => {
    try {
      const savedGlobalInterval = localStorage.getItem('scheduler-global-interval');
      const savedProjectIntervals = localStorage.getItem('scheduler-project-intervals');

      if (savedGlobalInterval) {
        const global = JSON.parse(savedGlobalInterval);
        setGlobalInterval(global);
      }

      if (savedProjectIntervals) {
        setProjectIntervals(JSON.parse(savedProjectIntervals));
      }
    } catch (error) {
      console.error('Error loading intervals from localStorage:', error);
    }
  }, []);

  // Automatiškai pasirenkame pirmą projektą, kai duomenys užsikrauna ir projektas dar nepasirinktas
  useEffect(() => {
    if (!agencyDataLoading && projects.length > 0 && !selectedProjectId) {
      const firstProject = projects[0];
      setSelectedProjectId(firstProject.id);

      // Išsaugome, kad šis projektas buvo automatiškai pasirinktas
      try {
        localStorage.setItem('scheduler-auto-selected-project', agencyId);
      } catch (error) {
        console.error('Error saving auto-selected project:', error);
      }
    }
  }, [agencyDataLoading, projects, selectedProjectId, agencyId]);

  // Keičiant projektą, naudojame jam specifinį intervalą arba globalų
  useEffect(() => {
    if (selectedProjectId && projectIntervals[selectedProjectId]) {
      setTimeInterval(projectIntervals[selectedProjectId]);
    } else {
      setTimeInterval(globalInterval);
    }
  }, [selectedProjectId, projectIntervals, globalInterval]);

  // Funkcija intervalo pakeitimui su išsaugojimu
  // const handleIntervalChange = (newInterval: number) => {
  //   setTimeInterval(newInterval);

  //   if (selectedProjectId) {
  //     // Išsaugome projektui specifinį intervalą
  //     const newProjectIntervals = { ...projectIntervals, [selectedProjectId]: newInterval };
  //     setProjectIntervals(newProjectIntervals);
  //     localStorage.setItem('scheduler-project-intervals', JSON.stringify(newProjectIntervals));
  //   } else {
  //     // Išsaugome globalų intervalą
  //     setGlobalInterval(newInterval);
  //     localStorage.setItem('scheduler-global-interval', JSON.stringify(newInterval));
  //   }
  // };

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [selectedProjectId, projects]);

  //3. DND funkcionalumas pagal PROJEKTĄ
  const { handleDrop, isProcessingDrop } = useSchedulerDndByProject({
    agencyId,
    clientId: selectedProject?.clientId || null,
    projectId: selectedProjectId,
    onScheduleComplete: () => setDroppingOnDay(null),
    refetchData: refetch,
  });

  const isLoading = agencyDataLoading || schedulerLoading;

  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const handleDayClick = (day: Date) => {
    if (!selectedProjectId) {
      toast.error("Please select a project first.");
      return;
    }
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

  const handlePinClick = (day: Date, content: string) => {
    setNoteModalState({ day, content });
  };

  // Enhanced drop handler with granular loading
  const handleDropWithLoading = async (e: React.DragEvent, day: Date) => {
    if (!selectedProjectId) {
      toast.error("Please select a project before dropping a file.");
      return;
    }
    const dayKey = format(day, 'yyyy-MM-dd');
    setDroppingOnDay(dayKey);

    try {
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        await handleDrop(file, day);
      }
    } finally {
      setDroppingOnDay(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6" />Content Calendar</h2>
        {/* <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6" />Content Calendar</h2>
          <Button variant="outline" size="sm" onClick={() => {
            if (!selectedProjectId) {
              toast.error("Please select a project first.");
              return;
            }
            setModalDay(new Date());
            setModalType('creation');
          }}> <Plus className="h-4 w-4 mr-2" /> Quick Add </Button>
        </div> */}

        <div className="flex items-center gap-3 flex-wrap">
          <ClientPicker
            agencyId={agencyId}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
          />

          {/* Laiko intervalo valdiklis
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Interval:</span>
            <Select value={timeInterval.toString()} onValueChange={(value) => handleIntervalChange(Number(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">30min</SelectItem>
                <SelectItem value="1">1 val</SelectItem>
                <SelectItem value="2">2 val</SelectItem>
                <SelectItem value="3">3 val</SelectItem>
                <SelectItem value="4">4 val</SelectItem>
                <SelectItem value="5">5 val</SelectItem>
                <SelectItem value="6">6 val</SelectItem>
              </SelectContent>
            </Select>
          </div> */}


        </div>

      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={handlePreviousMonth}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} className="h-10 px-3"><CalendarDays className="h-4 w-4 mr-2" />Today</Button>
        <span className="font-semibold min-w-[150px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
        <Button variant="outline" size="icon" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      {isLoading ? (<Skeleton className="h-[60vh] w-full" />) :
        !selectedProjectId ? (
          <div className="text-center py-12"><Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" /><h3 className="text-xl font-semibold mb-2">Select a Project</h3><p className="text-muted-foreground mb-6">Please select a project to view its content calendar.</p></div>
        ) : (
          <CalendarGrid
            month={currentMonth}
            schedulesByDay={schedulesByDay}
            documentsMap={documentsMap}
            onDrop={handleDropWithLoading}
            isProcessingDrop={isProcessingDrop}
            onDayClick={handleDayClick}
            droppingOnDay={droppingOnDay}
            agencyId={agencyId}
            clientId={selectedProject?.clientId || ''}
            highlightInfo={highlightInfo} // <-- PERVADINOME IR PERDAVĖME TEISINGUS DUOMENIS
            notesByDay={notesByDay}
            onPinClick={handlePinClick}
          />
        )}

      {modalDay && selectedProject && (
        <>
          <DayScheduleModal
            isOpen={modalType === 'schedule'}
            setIsOpen={(open) => !open && handleCloseModals()}
            day={modalDay}
            items={schedulesByDay.get(format(modalDay, 'yyyy-MM-dd')) || []}
            documentsMap={documentsMap}
            onSwitchToCreation={handleSwitchToCreation}
            refetch={refetch}
            timeInterval={timeInterval}
            portals={portals}
            lastEditedDocId={highlightInfo?.docId || null} // <-- PERDAVĖME TEISINGĄ ID
          />
          <CreationModal
            isOpen={modalType === 'creation'}
            setIsOpen={(open) => !open && handleCloseModals()}
            onCreationSuccess={() => {
              refetch();
              handleCloseModals();
            }}
            selectedDate={modalDay}
            agencyId={agencyId}
            clientId={selectedProject.clientId}
            projectId={selectedProject.id}
            timeInterval={timeInterval}
          />
        </>
      )}

      {noteModalState && selectedProject && (
        <NoteModal
          isOpen={!!noteModalState}
          setIsOpen={() => setNoteModalState(null)}
          day={noteModalState.day}
          projectId={selectedProjectId!}
          agencyId={agencyId}
          initialContent={noteModalState.content}
          onSave={refetchNotes} // Perduodame refetch funkciją
        />
      )}
    </div>
  );
}
