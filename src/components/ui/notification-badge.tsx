// src/components/ui/notification-badge.tsx
'use client';

import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NotificationBadgeProps {
  unreadCount: number;
  onNotificationsClick: () => void;
}

export default function NotificationBadge({ unreadCount, onNotificationsClick }: NotificationBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Animacija kai atsinaujina skaičių
  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  return (
    <button
      onClick={onNotificationsClick}
      className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      title="Notifications"
    >
      <Bell className={`h-4 w-4 ${isAnimating ? 'animate-pulse' : ''}`} />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-bold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
