// src/components/workspace-switcher.tsx
'use client';

import { useState } from 'react'; // <-- PRIDĖK IMPORTĄ
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspace, type Workspace } from '@/context/WorkspaceContext';
import { useUserAgencies } from '@/hooks/useUserAgencies';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import CreateAgencyDialog from './agency/CreateAgencyDialog'; // <-- PRIDĖK IMPORTĄ

// const PERSONAL_WORKSPACE: Workspace = {
//   id: null,
//   type: 'user',
//   name: 'My Space'
// };

export function WorkspaceSwitcher() {
  const { user } = useAuth();
  const { activeWorkspace, setActiveWorkspace } = useWorkspace();
  const { agencies, loading: agenciesLoading } = useUserAgencies();
  const router = useRouter();
  
  // --- PRADĖK PAKEITIMĄ ČIA ---
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  // --- PAKEITIMO PABAIGA ---

  const handleSelectWorkspace = (workspace: Workspace) => {
    // 1. Nustatome naują aktyvią aplinką
    setActiveWorkspace(workspace);

    // 2. Redirect the user to the appropriate page (myspace deprecated)
    if (workspace.type === 'agency' && workspace.id) {
      router.push(`/agency/${workspace.id}`);
    } else {
      router.push('/agency-select');
    }
  };

  return (
    <> {/* <-- PRIDĖK FRAGMENTĄ */}
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={true}
          aria-label="Select workspace"
          className="w-full justify-start h-auto p-4 text-left hover:bg-muted/50 transition-all duration-200 group border border-transparent hover:border-border/50"
          disabled={agenciesLoading}
        >
          <div className="flex items-center gap-3 w-full">
            <Avatar className="h-10 w-10 ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all duration-200">
              <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                {activeWorkspace.type === 'user'
                  ? user?.email?.[0].toUpperCase()
                  : activeWorkspace.name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-base group-hover:text-primary transition-colors duration-200">
                  {activeWorkspace.name}
                </p>
                <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200">
                  {activeWorkspace.type === 'user' ? 'Personal Space' : 'Agency Workspace'}
                </p>
            </div>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50 group-hover:opacity-70 group-hover:rotate-180 transition-all duration-200" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-2" align="start" sideOffset={8}>
        {/* <DropdownMenuItem 
          onSelect={() => handleSelectWorkspace(PERSONAL_WORKSPACE)}
          className="group cursor-pointer rounded-md p-3 hover:bg-muted/50 transition-colors duration-200"
        >
          <div className="flex items-center gap-3 w-full">
            <Avatar className="h-8 w-8 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-200">
              <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                {user?.email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm group-hover:text-primary transition-colors duration-200">
                {PERSONAL_WORKSPACE.name}
              </p>
              <p className="text-xs text-muted-foreground">Personal workspace</p>
            </div>
            <Check className={cn(
              "h-4 w-4 text-primary transition-all duration-200", 
              activeWorkspace.type === 'user' ? "opacity-100 scale-100" : "opacity-0 scale-75"
            )} />
          </div>
        </DropdownMenuItem> */}
        
        <DropdownMenuSeparator className="my-1" />
        
        <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Agencies
        </DropdownMenuLabel>
        {agencies.map((agency) => (
          <DropdownMenuItem 
            key={agency.id} 
            onSelect={() => handleSelectWorkspace({ 
              id: agency.id, 
              type: 'agency', 
              name: agency.name,
              theme: agency.theme || 'default'
            })}
            className="group cursor-pointer rounded-md p-3 hover:bg-muted/50 transition-colors duration-200"
          >
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-8 w-8 ring-2 ring-muted group-hover:ring-primary/30 transition-all duration-200">
                <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-muted to-muted/50">
                  {agency.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm group-hover:text-primary transition-colors duration-200 truncate">
                  {agency.name}
                </p>
                <p className="text-xs text-muted-foreground">Agency workspace</p>
              </div>
              <Check className={cn(
                "h-4 w-4 text-primary transition-all duration-200", 
                activeWorkspace.id === agency.id ? "opacity-100 scale-100" : "opacity-0 scale-75"
              )} />
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem 
          onSelect={(e) => {
            e.preventDefault();
            setIsCreateDialogOpen(true);
          }}
          className="group cursor-pointer rounded-md p-3 hover:bg-primary/5 transition-colors duration-200 border border-dashed border-transparent hover:border-primary/20"
        >
          <div className="flex items-center gap-3 w-full">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-200">
              <PlusCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm group-hover:text-primary transition-colors duration-200">
                Create New Agency
              </p>
              <p className="text-xs text-muted-foreground">Start collaborating</p>
            </div>
          </div>
        </DropdownMenuItem>
        {/* --- PAKEITIMO PABAIGA --- */}
      </DropdownMenuContent>
    </DropdownMenu>

      {/* --- PRADĖK PAKEITIMĄ ČIA --- */}
      <CreateAgencyDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
      {/* --- PAKEITIMO PABAIGA --- */}
    </>
  );
}
