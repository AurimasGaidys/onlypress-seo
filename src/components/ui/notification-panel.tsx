// src/components/ui/notification-panel.tsx
'use client';

import { X, Bell, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/hooks/useNotifications';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRemoveNotification: (id: string) => void;
}

export default function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemoveNotification
}: NotificationPanelProps) {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'agency_invite':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'role_change':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'client_added':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    }
  };

  const unreadNotifications = notifications.filter(n => n.id == "");
  const readNotifications = notifications.filter(n => n.id == "");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-end">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Notifications</h3>
            {unreadNotifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadNotifications.length} unread
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[50vh]">
          <div className="p-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium text-muted-foreground mb-2">No notifications</h4>
                <p className="text-sm text-muted-foreground">
                  You&apos;re all caught up! Check back later for new updates.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Unread notifications */}
                {unreadNotifications.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">New</h4>
                    {unreadNotifications.map((notification) => (
                      <div
                        onClick={() => {
                          onMarkAsRead(notification.id);
                        }}
                        key={notification.id}
                        className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.actionUrl && (
                            <div className="mt-2">
                              <Button
                                size="sm"
                                className="text-xs"
                              >
                                {notification.actionText || 'View'}
                              </Button>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(notification.timestamp)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMarkAsRead(notification.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Read notifications */}
                {readNotifications.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Earlier</h4>
                    {readNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-75"
                      >
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {notification.message}
                          </p>
                          {notification.actionUrl && (
                            <div className="mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { console.log(notification.actionUrl)} }
                                className="text-xs"
                              >
                                {notification.actionText || 'View'}
                              </Button>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDate(notification.timestamp)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveNotification(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-muted-foreground">
            {unreadNotifications.length} unread, {readNotifications.length} read
          </div>
          <div className="flex gap-2">
            {unreadNotifications.length > 0 && (
              <Button size="sm" onClick={onMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
