'use client';

import { useState } from 'react';
import { ArticleDocument } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Edit } from 'lucide-react';
import { format } from 'date-fns';
import ScheduleDocumentModal from './ScheduleDocumentModal';
import { useEditorTab } from '@/context/EditorTabContext';

interface DocumentActionsProps {
  document: ArticleDocument;
}

export default function DocumentActions({ document }: DocumentActionsProps) {
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const { activeTab, setActiveTab } = useEditorTab();

  if (document.publishAt) {
    return (
      <>
        <Button size="sm" variant="outline" onClick={() => setScheduleModalOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Schedule
        </Button>
        <Badge variant="secondary">
          <CalendarDays className="mr-2 h-4 w-4" />
          {format(document.publishAt || new Date(), 'MMM d, yyyy')}
        </Badge>
        <ScheduleDocumentModal
          isOpen={scheduleModalOpen}
          setIsOpen={setScheduleModalOpen}
          document={document}
        />
      </>
    );
  }

  // This condition will now apply to BOTH personal and agency documents
  if (document.status === 'draft' || document.status === 'approved') {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setActiveTab("publish")}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Schedule
          </Button>
        </div>
      </>
    );
  }

  return null; // For other statuses, show nothing for now
}

// TODO DELETE
// <ScheduleDocumentModal
//         isOpen={scheduleModalOpen}
//         setIsOpen={setScheduleModalOpen}
//         document={document}
//       />

//       <PublishModal
//         isOpen={isPublishModalOpen}
//         setIsOpen={setIsPublishModalOpen}
//         document={document}
//       />