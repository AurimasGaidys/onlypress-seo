// src/components/header.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Menu, Settings, LogOut, PenSquare, Focus, Maximize2, Moon, Sun } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationBadge from './ui/notification-badge';
import NotificationPanel from './ui/notification-panel';
import BalanceDisplay from './BalanceDisplay';
import { cn } from '@/lib/utils';
import { useUI } from '@/context/UIContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useTheme } from 'next-themes';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { isFocusMode, setFocusMode } = useUI();
  const { activeWorkspace } = useWorkspace();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification 
  } = useNotifications();

  // Funkcija kuri grąžina teisingą home path pagal workspace tipą
  const getHomePath = () => {
    if (activeWorkspace.type === 'agency' && activeWorkspace.id) {
      return `/agency/${activeWorkspace.id}`;
    }
    return '/agency-select';
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("You have been logged out.");
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out.");
    }
  };

  const toggleFocusMode = () => {
    setFocusMode(!isFocusMode);
    toast.success(isFocusMode ? "Focus mode disabled" : "Focus mode enabled");
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30 h-16 shadow-sm">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Mobile: Menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onMenuClick} 
            className="md:hidden hover:bg-muted/50 transition-colors"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
          
          {/* Logo */}
          <Link href={getHomePath()} className="flex items-center gap-2 group">
            <div className="relative">
              <PenSquare className="h-6 w-6 text-primary group-hover:rotate-12 transition-transform duration-200" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Publikuota.lt
            </h1>
          </Link>
        </div>
        
        
        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="hover:bg-muted/50 transition-colors"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {/* Focus Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFocusMode}
            className={cn(
              "hover:bg-muted/50 transition-colors",
              isFocusMode && "bg-primary/10 text-primary hover:bg-primary/20"
            )}
            title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
          >
            {isFocusMode ? <Maximize2 className="h-4 w-4" /> : <Focus className="h-4 w-4" />}
          </Button>

          {/* Balance Display */}
          <div className="hidden sm:block">
            <BalanceDisplay />
          </div>
          
          {/* Notifications */}
          <NotificationBadge 
            unreadCount={0}//{unreadCount} 
            onNotificationsClick={() => setIsNotificationsOpen(true)} 
          />

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-10 w-10 rounded-full hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-10 w-10 ring-2 ring-border hover:ring-primary/50 transition-colors">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold border border-primary/20">
                    {user?.email?.[0].toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Signed in as</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-destructive focus:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Notifications Panel */}
      <NotificationPanel 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onRemoveNotification={removeNotification}
      />

    </>
  );
}
