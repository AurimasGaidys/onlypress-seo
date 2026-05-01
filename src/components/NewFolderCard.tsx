'use client';

import { Card } from './ui/card';
import { PlusCircle } from 'lucide-react';
import CreateFolderDialog from './CreateFolderDialog';

export default function NewFolderCard() {
  return (
    <CreateFolderDialog>
      <Card className="flex h-full flex-col items-center justify-center border-2 border-dashed bg-muted/50 hover:border-primary/50 hover:bg-muted transition-colors cursor-pointer">
        <PlusCircle className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 font-medium text-muted-foreground">New Folder</p>
      </Card>
    </CreateFolderDialog>
  );
}
