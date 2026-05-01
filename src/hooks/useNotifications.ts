// src/hooks/useNotifications.ts
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Notification {
  id: string;
  type: 'agency_invite' | 'role_change' | 'client_added' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Gauti notifications iš Firestore ir localStorage
  useEffect(() => {
    if (!user) {
      // Jei vartotojas neprisijungęs, galėtume naudoti localStorage
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
      }
      return;
    }

    // Prisijungusiam vartotojui - gauname iš Firestore
    const notificationsQuery = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as Notification[];

      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);

      // Išsaugome į localStorage cache
      localStorage.setItem('notifications', JSON.stringify(notificationsData));
    });

    return () => unsubscribe();
  }, [user]);

  // Išsaugoti notifications į localStorage
  const saveNotifications = (newNotifications: Notification[]) => {
    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.read).length);
    localStorage.setItem('notifications', JSON.stringify(newNotifications));
  };

  // Pridėti naują notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    const updatedNotifications = [newNotification, ...notifications];
    saveNotifications(updatedNotifications);

    return newNotification;
  };

  // Pažymėti notification kaip skaitytą
  const markAsRead = async (id: string) => {
    // Atnaujiname Firestore
    if (user) {
      try {
        const notificationRef = doc(db, 'users', user.uid, 'notifications', id);
        await updateDoc(notificationRef, { read: true });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    } else {
      console.warn('User not logged in, cannot update Firestore.');
    }

    // Atnaujiname local state
    const updatedNotifications = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updatedNotifications);
  };

  // Pažymėti visas notifications kaip skaitytas
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updatedNotifications);
  };

  // Ištrinti notification
  const removeNotification = (id: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== id);
    saveNotifications(updatedNotifications);
  };

  // Ištrinti visas notifications
  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  // Sukurti notification templates
  const createNotification = {
    agencyInvite: (agencyName: string, inviterName: string) => ({
      type: 'agency_invite' as const,
      title: '🎉 Agency Invitation',
      message: `You have been invited to join "${agencyName}" by ${inviterName}`,
      actionUrl: '/workspaces',
      actionText: 'View Workspaces'
    }),

    roleChange: (agencyName: string, newRole: string) => ({
      type: 'role_change' as const,
      title: '👤 Role Updated',
      message: `Your role in "${agencyName}" has been changed to "${newRole}"`,
      actionUrl: '/workspaces',
      actionText: 'View Workspaces'
    }),

    clientAdded: (clientName: string, agencyName: string) => ({
      type: 'client_added' as const,
      title: '👥 New Client Added',
      message: `Client "${clientName}" has been added to "${agencyName}"`,
      actionUrl: `/agency/[agencyId]/clients`,
      actionText: 'View Client'
    }),

    system: (title: string, message: string) => ({
      type: 'system' as const,
      title,
      message,
      read: false
    })
  };

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    createNotification
  };
}
