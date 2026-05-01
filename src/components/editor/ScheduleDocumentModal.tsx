// src/components/editor/ScheduleDocumentModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  Loader2, Send, Globe, TrendingUp, Users,
  Leaf, Bitcoin, Dice1, Heart, Briefcase, ShoppingBag, Camera,
  Music, Film, Book, Utensils, Car, Home, TreePine, Dumbbell,
  Stethoscope, Plane, GraduationCap
} from 'lucide-react';
import { ArticleDocument } from '@/types/document';
import { usePortals } from '@/hooks/usePortals';
import { useScheduleInfo } from '@/hooks/useScheduleInfo';
import { ClientPicker } from '../aaa_todo/AgencyPicker';
import { PublicationDateSelector } from '../aaa_todo/DateSelector';

interface ScheduleDocumentModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  document: ArticleDocument;
}

// Helper function to format large numbers
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

// Function to get icon for topic category
const getTopicIcon = (topic: string) => {
  const normalizedTopic = topic.toLowerCase().trim();

  // Map topics to icons
  if (normalizedTopic.includes('cbd') || normalizedTopic.includes('pharmacy') || normalizedTopic.includes('dietary')) {
    return Leaf;
  }
  if (normalizedTopic.includes('cryptocurrency') || normalizedTopic.includes('crypto')) {
    return Bitcoin;
  }
  if (normalizedTopic.includes('gambling') || normalizedTopic.includes('casino')) {
    return Dice1;
  }
  if (normalizedTopic.includes('adult') || normalizedTopic.includes('dating')) {
    return Heart;
  }
  if (normalizedTopic.includes('loan') || normalizedTopic.includes('finance')) {
    return Briefcase;
  }
  if (normalizedTopic.includes('shopping') || normalizedTopic.includes('retail')) {
    return ShoppingBag;
  }
  if (normalizedTopic.includes('photo') || normalizedTopic.includes('camera')) {
    return Camera;
  }
  if (normalizedTopic.includes('music') || normalizedTopic.includes('audio')) {
    return Music;
  }
  if (normalizedTopic.includes('film') || normalizedTopic.includes('movie') || normalizedTopic.includes('video')) {
    return Film;
  }
  if (normalizedTopic.includes('book') || normalizedTopic.includes('reading')) {
    return Book;
  }
  if (normalizedTopic.includes('food') || normalizedTopic.includes('restaurant')) {
    return Utensils;
  }
  if (normalizedTopic.includes('car') || normalizedTopic.includes('auto')) {
    return Car;
  }
  if (normalizedTopic.includes('home') || normalizedTopic.includes('real estate')) {
    return Home;
  }
  if (normalizedTopic.includes('nature') || normalizedTopic.includes('environment')) {
    return TreePine;
  }
  if (normalizedTopic.includes('fitness') || normalizedTopic.includes('gym')) {
    return Dumbbell;
  }
  if (normalizedTopic.includes('health') || normalizedTopic.includes('medical')) {
    return Stethoscope;
  }
  if (normalizedTopic.includes('travel') || normalizedTopic.includes('vacation')) {
    return Plane;
  }
  if (normalizedTopic.includes('education') || normalizedTopic.includes('school')) {
    return GraduationCap;
  }

  // Default icon
  return Briefcase;
};

export default function ScheduleDocumentModal({ isOpen, setIsOpen, document }: ScheduleDocumentModalProps) {
  // Esamos būsenos
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPortalId, setSelectedPortalId] = useState<string>('');
  const [isScheduling, setIsScheduling] = useState(false);
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();

  // --- NAUJOS BŪSENOS (Tik agentūroms) ---
  const [selectedClientId, setSelectedClientId] = useState<string | null>(document.clientId || null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(document.projectId || null);

  // --- HOOK'AI DUOMENIMS GAUTI ---

  const { portals, loading: portalsLoading } = usePortals();
  const { scheduleInfo } = useScheduleInfo(document.id);

  // Automatiškai nustatome datą pagal esamą schedule informaciją arba šiandienos datą
  useEffect(() => {
    if (isOpen) {
      if (scheduleInfo) {
        const scheduledDate = new Date(scheduleInfo.scheduledAt as string | number | Date);
        if (typeof scheduleInfo.scheduledAt === 'object' && 'toDate' in scheduleInfo.scheduledAt) {
          scheduledDate.setTime(scheduleInfo.scheduledAt.toDate().getTime());
        }
        setSelectedDate(scheduledDate);
      } else {
        // Automatiškai pasirinkti šiandienos datą
        setSelectedDate(new Date());
      }
    }
  }, [scheduleInfo, isOpen]);


  const handleSchedule = async () => {
    if (!user || !selectedDate || !selectedPortalId) {
      toast.error("Please select all required fields.");
      return;
    }

    setIsScheduling(true);
    try {
      const idToken = await user.getIdToken();

      // Format date
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const scheduledDate = `${year}-${month}-${day}`;

      if (activeWorkspace.type === 'agency') {
        // --- AGENTŪROS LOGIKA ---
        if (!selectedProjectId) {
          throw new Error("Please select a client and a project.");
        }

        const payload = {
          idToken,
          documentId: document.id,
          agencyId: activeWorkspace.id || '',
          clientId: selectedClientId || '',
          projectId: selectedProjectId,
          portalId: selectedPortalId,
          scheduledDate,
        };

        const response = await fetch('/api/agency/schedule-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Agency scheduling failed');

      } else {
        // --- ASMENINĖS ERDVĖS LOGIKA (PATAISYTA - SUVIENODINTA) ---

        // PAKEITIMAS: Siunčiame plokščią struktūrą, be 'scheduleData'
        const payload = {
          idToken,
          documentId: document.id,
          portalId: selectedPortalId,
          scheduledDate,
          // Pridedame tuščius laukus, kad API struktūra būtų vienoda (nebūtina, jei API to nereikalauja, bet gera praktika)
          agencyId: null,
          clientId: null,
          projectId: null
        };

        const response = await fetch('/api/scheduler/personal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Personal scheduling failed');
      }

      toast.success(`Document scheduled successfully!`);
      setIsOpen(false);
      window.location.reload();

    } catch (error) {
      toast.error("Scheduling Failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsScheduling(false);
    }
  };

  const selectedPortal = portals?.find(p => p.id === selectedPortalId);

  // TODO aaa extract selectors to components

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[70vw] sm:w-[70vw] md:w-[70vw] lg:w-[70vw] xl:w-[70vw] max-w-[70vw] !max-w-none h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Schedule Document for Publication</DialogTitle>
          <DialogDescription>
            Choose {activeWorkspace.type === 'agency' ? 'project, ' : ''}date and portal to schedule &ldquo;{document.title}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <ClientPicker activeWorkspace={activeWorkspace}
          selectedClientId={selectedClientId}
          selectedProjectId={selectedProjectId}
          setSelectedClientId={setSelectedClientId}
          setSelectedProjectId={setSelectedProjectId}
          disabled={false}
        />

        <PublicationDateSelector selectedDate={selectedDate || new Date()} setSelectedDate={setSelectedDate} />

        {/* APATINĖ SEKCIJA: Portalų pasirinkimas (kaip PublishModal) */}
        <div className="flex-grow overflow-y-auto">
          {portalsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] min-w-[50px]"></TableHead>
                  <TableHead className="min-w-[150px]">Portal</TableHead>
                  <TableHead className="text-center min-w-[80px]">DR</TableHead>
                  <TableHead className="text-center min-w-[100px]">Visitors</TableHead>
                  <TableHead className="text-center min-w-[120px]">Sensitive topics</TableHead>
                  <TableHead className="text-right min-w-[100px]">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portals?.map(portal => (
                  <TableRow
                    key={portal.id}
                    onClick={() => setSelectedPortalId(portal.id)}
                    className="cursor-pointer"
                    data-state={selectedPortalId === portal.id ? 'selected' : ''}
                  >
                    <TableCell className="p-2">
                      <Checkbox
                        checked={selectedPortalId === portal.id}
                        onCheckedChange={() => setSelectedPortalId(portal.id)}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <div className="font-medium truncate">{portal.title || portal.description}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <Globe className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{portal.domain || portal.domain}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-2">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm">{portal.ahrefsDomainRating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-2">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{formatNumber(portal.usersPerMonth)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-2">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {portal.possiblePublicationsInTopics?.slice(0, 3).map((topic, index) => {
                          const Icon = getTopicIcon(topic);
                          return (
                            <div
                              key={index}
                              className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center"
                              title={topic}
                            >
                              <Icon className="h-3 w-3" />
                            </div>
                          );
                        })}
                        {portal.possiblePublicationsInTopics && portal.possiblePublicationsInTopics.length > 3 && (
                          <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                            +{portal.possiblePublicationsInTopics.length - 3}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right p-2 font-semibold whitespace-nowrap">
                      {portal.price.toFixed(2)} EUR
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter className="pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-muted-foreground">
              {selectedPortalId ? '1 portal selected' : 'No portal selected'}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                {selectedPortal && (
                  <>
                    <p className="font-bold text-lg">{selectedPortal.price.toFixed(2)} EUR</p>
                    <p className="text-xs text-muted-foreground">Portal Price</p>
                  </>
                )}
              </div>
              <Button
                size="lg"
                onClick={handleSchedule}
                disabled={isScheduling || !selectedDate || !selectedPortalId || (activeWorkspace.type === 'agency' && !selectedProjectId)}
              >
                {isScheduling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Schedule Document
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
