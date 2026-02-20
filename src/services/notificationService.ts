/**
 * Admin Notification Service
 * 
 * Handles admin notifications for:
 * - System Failure
 * - New User Registration
 * - API Error
 */

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  Timestamp, 
  orderBy, 
  limit,
  onSnapshot,
  QueryConstraint,
} from "firebase/firestore";
import { firestore } from "../config/firebase";

export type NotificationType = "systemFailure" | "newUserRegistration" | "apiError";

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: "unread" | "read";
  userId?: string;
  errorCode?: string;
  errorDetails?: string;
  createdAt: Date;
  readAt?: Date;
  readBy?: string[];
  actionUrl?: string;
}

/**
 * Create a new admin notification
 */
export const createAdminNotification = async (
  data: Omit<AdminNotification, "id" | "createdAt" | "status" | "readBy">
): Promise<string> => {
  try {
    const notificationsRef = collection(firestore, "admin_notifications");
    
    // Filter out undefined values (Firestore doesn't accept undefined)
    const notificationData: Record<string, any> = {
      type: data.type,
      title: data.title,
      message: data.message,
      status: "unread",
      createdAt: Timestamp.now(),
      readBy: [],
    };
    
    // Only add optional fields if they have values
    if (data.userId !== undefined) {
      notificationData.userId = data.userId;
    }
    if (data.errorCode !== undefined) {
      notificationData.errorCode = data.errorCode;
    }
    if (data.errorDetails !== undefined) {
      notificationData.errorDetails = data.errorDetails;
    }
    if (data.actionUrl !== undefined) {
      notificationData.actionUrl = data.actionUrl;
    }
    
    const docRef = await addDoc(notificationsRef, notificationData);
    console.log("✅ Admin notification created:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating admin notification:", error);
    throw error;
  }
};

/**
 * Get unread notification counts by type
 */
export const getUnreadNotificationsByType = async (): Promise<{
  systemFailure: number;
  newUserRegistration: number;
  apiError: number;
  total: number;
}> => {
  try {
    const notificationsRef = collection(firestore, "admin_notifications");
    const q = query(notificationsRef, where("status", "==", "unread"));
    const snapshot = await getDocs(q);
    
    const counts = {
      systemFailure: 0,
      newUserRegistration: 0,
      apiError: 0,
      total: snapshot.size,
    };
    
    snapshot.forEach(doc => {
      const type = doc.data().type as NotificationType;
      if (type in counts) {
        counts[type]++;
      }
    });
    
    return counts;
  } catch (error) {
    console.error("❌ Error getting unread notifications:", error);
    return {
      systemFailure: 0,
      newUserRegistration: 0,
      apiError: 0,
      total: 0,
    };
  }
};

/**
 * Get recent notifications with optional filters
 */
export const getRecentNotifications = async (
  limitCount: number = 50,
  typeFilter?: NotificationType,
  statusFilter?: "unread" | "read"
): Promise<AdminNotification[]> => {
  try {
    const notificationsRef = collection(firestore, "admin_notifications");
    
    const constraints: QueryConstraint[] = [];
    
    if (typeFilter) {
      constraints.push(where("type", "==", typeFilter));
    }
    
    if (statusFilter) {
      constraints.push(where("status", "==", statusFilter));
    }
    
    constraints.push(orderBy("createdAt", "desc"));
    constraints.push(limit(limitCount));
    
    const q = query(notificationsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      type: doc.data().type,
      title: doc.data().title,
      message: doc.data().message,
      status: doc.data().status,
      userId: doc.data().userId,
      errorCode: doc.data().errorCode,
      errorDetails: doc.data().errorDetails,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      readAt: doc.data().readAt?.toDate(),
      readBy: doc.data().readBy || [],
      actionUrl: doc.data().actionUrl,
    })) as AdminNotification[];
  } catch (error) {
    console.error("❌ Error getting recent notifications:", error);
    return [];
  }
};

/**
 * Subscribe to real-time notification updates
 */
export const subscribeToNotifications = (
  callback: (notifications: AdminNotification[]) => void,
  limitCount: number = 50
): (() => void) => {
  try {
    const notificationsRef = collection(firestore, "admin_notifications");
    const q = query(
      notificationsRef,
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        type: doc.data().type,
        title: doc.data().title,
        message: doc.data().message,
        status: doc.data().status,
        userId: doc.data().userId,
        errorCode: doc.data().errorCode,
        errorDetails: doc.data().errorDetails,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        readAt: doc.data().readAt?.toDate(),
        readBy: doc.data().readBy || [],
        actionUrl: doc.data().actionUrl,
      })) as AdminNotification[];
      
      callback(notifications);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("❌ Error subscribing to notifications:", error);
    return () => {};
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string,
  adminId: string
): Promise<void> => {
  try {
    const notificationRef = doc(firestore, "admin_notifications", notificationId);
    await updateDoc(notificationRef, {
      status: "read",
      readAt: Timestamp.now(),
      readBy: [adminId],
    });
    console.log("✅ Notification marked as read:", notificationId);
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (adminId: string): Promise<void> => {
  try {
    const notificationsRef = collection(firestore, "admin_notifications");
    const q = query(notificationsRef, where("status", "==", "unread"));
    const snapshot = await getDocs(q);
    
    const updates = snapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        status: "read",
        readAt: Timestamp.now(),
        readBy: [adminId],
      })
    );
    
    await Promise.all(updates);
    console.log("✅ All notifications marked as read");
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Helper function to get notification type label
 */
export const getNotificationTypeLabel = (type: NotificationType): string => {
  switch (type) {
    case "systemFailure":
      return "System Failure";
    case "newUserRegistration":
      return "New User Registration";
    case "apiError":
      return "API Error";
    default:
      return type;
  }
};

/**
 * Helper function to get notification type color
 */
export const getNotificationTypeColor = (type: NotificationType): string => {
  switch (type) {
    case "systemFailure":
      return "red";
    case "newUserRegistration":
      return "blue";
    case "apiError":
      return "amber";
    default:
      return "gray";
  }
};
