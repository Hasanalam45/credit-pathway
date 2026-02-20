/**
 * Custom hook for managing admin notifications
 */

import { useState, useEffect } from "react";
import {
  getRecentNotifications,
  getUnreadNotificationsByType,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
} from "../services/notificationService";
import type { AdminNotification } from "../services/notificationService";
import { useAuth } from "../auth/AuthProvider";

interface UseNotificationsReturn {
  notifications: AdminNotification[];
  unreadCounts: {
    systemFailure: number;
    newUserRegistration: number;
    apiError: number;
    total: number;
  };
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage admin notifications with real-time updates
 */
export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCounts, setUnreadCounts] = useState({
    systemFailure: 0,
    newUserRegistration: 0,
    apiError: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch unread counts
  const fetchUnreadCounts = async () => {
    try {
      const counts = await getUnreadNotificationsByType();
      setUnreadCounts(counts);
    } catch (err: any) {
      console.error("Error fetching unread counts:", err);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecentNotifications(50);
      setNotifications(data);
      await fetchUnreadCounts();
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((data) => {
      setNotifications(data);
      fetchUnreadCounts();
    }, 50);

    return () => unsubscribe();
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user?.firebaseUser?.uid) return;
    
    try {
      await markNotificationAsRead(notificationId, user.firebaseUser.uid);
      await fetchUnreadCounts();
    } catch (err: any) {
      console.error("Error marking notification as read:", err);
      throw err;
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.firebaseUser?.uid) return;
    
    try {
      await markAllNotificationsAsRead(user.firebaseUser.uid);
      await fetchUnreadCounts();
    } catch (err: any) {
      console.error("Error marking all notifications as read:", err);
      throw err;
    }
  };

  return {
    notifications,
    unreadCounts,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
};
