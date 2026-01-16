'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type NotificationType = 'info' | 'success' | 'error' | 'loading';

export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    timestamp: Date;
    read: boolean;
    link?: string;
    details?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
    updateNotification: (id: string, updates: Partial<Notification>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
    unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((payload: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newNotification: Notification = {
            ...payload,
            id,
            timestamp: new Date(),
            read: false,
        };
        setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50
        return id;
    }, []);

    const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
        );
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                addNotification,
                updateNotification,
                markAsRead,
                markAllAsRead,
                clearNotifications,
                unreadCount,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
