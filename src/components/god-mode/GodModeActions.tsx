'use client';

import { ArticleDocument } from '@/types/document';
import { useScheduleInfo } from '@/hooks/useScheduleInfo';
import DocumentActions from '@/components/editor/DocumentActions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { CalendarDays, Send } from 'lucide-react';

interface GodModeActionsProps {
  document: ArticleDocument;
  isLocalSession: boolean;
}

export default function GodModeActions({ document, isLocalSession }: GodModeActionsProps) {
  const { scheduleInfo, loading: isScheduleLoading } = useScheduleInfo(isLocalSession ? null : document.id);

  // If it's a local, unsaved session, show disabled buttons with a tooltip.
  if (isLocalSession) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button size="sm" disabled>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save the document to enable scheduling.</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button size="sm" variant="default" disabled>
                  <Send className="mr-2 h-4 w-4" />
                  Publish
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save the document to enable publishing.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  // If it's a saved document, render the real actions component.
  return (
    <DocumentActions
      document={document}
      scheduleInfo={scheduleInfo}
      isScheduleLoading={isScheduleLoading}
    />
  );
}
