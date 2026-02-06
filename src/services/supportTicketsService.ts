/**
 * Support Tickets Service
 * 
 * Fetches support threads from Firestore, maps them to support tickets,
 * and provides functions for managing tickets and messages.
 */

import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { firestore } from "../config/firebase";
import type { SupportTicket } from "../components/support/SupportTicketsTable";
import type { DateRange } from "../pages/dashboard/DashboardPage";

export type TicketMessage = {
  id: string;
  author: string;
  text: string;
  date: string;
};

/**
 * Calculate date range boundaries
 */
const getDateRange = (range: DateRange): { start: Date | null; end: Date | null } => {
  // For "all_time", return null to indicate no date filtering
  if (range === "all_time") {
    return { start: null, end: null };
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();

  switch (range) {
    case "last_7_days":
      start.setDate(start.getDate() - 7);
      break;
    case "last_30_days":
      start.setDate(start.getDate() - 30);
      break;
    case "this_month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "this_quarter":
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
};

/**
 * Format timestamp to date string (YYYY-MM-DD)
 */
const formatDate = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  return date.toISOString().slice(0, 10);
};

/**
 * Format timestamp to relative time (e.g., "2h ago", "Yesterday")
 */
const formatTimeAgo = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return "Never";
  
  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // For older dates, show formatted date
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/**
 * Get user email from users collection
 */
const getUserEmail = async (userId: string): Promise<string> => {
  try {
    const userDoc = await getDoc(doc(firestore, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.email || userData.name || userId;
    }
    return userId; // Fallback to userId if user not found
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return userId; // Fallback to userId on error
  }
};

/**
 * Find user ID by email address
 */
const getUserIdByEmail = async (email: string): Promise<string | null> => {
  try {
    const usersRef = collection(firestore, "users");
    const usersSnapshot = await getDocs(usersRef);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.email === email) {
        return userDoc.id;
      }
    }
    
    return null; // User not found
  } catch (error) {
    console.error(`Error finding user by email ${email}:`, error);
    return null;
  }
};

/**
 * Map Firestore thread document data to SupportTicket
 */
const mapThreadToTicket = async (
  threadData: DocumentData,
  threadId: string
): Promise<SupportTicket | null> => {
  try {
    const userId = threadData.userId || threadId;
    
    // Get user email
    const userEmail = await getUserEmail(userId);
    
    // Get subject (from thread or first 50 chars of lastMessage)
    const subject = threadData.subject || 
      (threadData.lastMessage 
        ? threadData.lastMessage.substring(0, 50) + (threadData.lastMessage.length > 50 ? "..." : "")
        : "No subject");
    
    // Get status (default to "open")
    const status = threadData.status || "open";
    
    // Get priority (default to "medium")
    const priority = threadData.priority || "medium";
    
    // Get assignedTo (default to empty)
    const assignedTo = threadData.assignedTo || "";
    
    // Get lastMessage
    const message = threadData.lastMessage || "";
    
    // Get lastUpdated (from lastMessageAt or createdAt)
    const lastMessageAt = threadData.lastMessageAt || threadData.createdAt;
    const lastUpdated = formatTimeAgo(lastMessageAt);
    
    // Fetch recent messages (limit to 10 for performance in list view)
    const messagesRef = collection(firestore, "supportThreads", threadId, "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "desc"), limit(10));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    const messages: TicketMessage[] = [];
    messagesSnapshot.forEach((msgDoc) => {
      const msgData = msgDoc.data();
      const sender = msgData.sender || "user";
      const author = sender === "user" ? userEmail : (sender === "admin" || sender === "support" ? "Support" : sender);
      
      messages.push({
        id: msgDoc.id,
        author,
        text: msgData.text || "",
        date: formatDate(msgData.createdAt),
      });
    });
    
    // Reverse to show oldest first (for display)
    messages.reverse();
    
    return {
      id: threadId,
      subject,
      user: userEmail,
      status: status as "open" | "pending" | "closed",
      priority: priority as "low" | "medium" | "high",
      assignedTo,
      message,
      messages,
      lastUpdated,
    };
  } catch (error) {
    console.error(`Error mapping thread ${threadId}:`, error);
    return null;
  }
};

/**
 * Get all support tickets filtered by date range
 */
export const getSupportTickets = async (
  dateRange: DateRange
): Promise<SupportTicket[]> => {
  try {
    const { start, end } = getDateRange(dateRange);
    
    // Fetch all support threads
    const threadsRef = collection(firestore, "supportThreads");
    const threadsSnapshot = await getDocs(threadsRef);
    
    const tickets: SupportTicket[] = [];
    
    for (const threadDoc of threadsSnapshot.docs) {
      const threadData = threadDoc.data();
      const threadId = threadDoc.id;
      
      // Filter by date range (only if date range is specified, not "all_time")
      if (start && end) {
        const lastMessageAt = threadData.lastMessageAt || threadData.createdAt;
        if (lastMessageAt) {
          const messageDate = lastMessageAt.toDate();
          if (messageDate < start || messageDate > end) {
            continue; // Skip threads outside date range
          }
        } else {
          // If no timestamp, skip (shouldn't happen, but handle gracefully)
          continue;
        }
      }
      // If start and end are null (all_time), don't filter by date - show all tickets
      
      // Map thread to ticket
      const ticket = await mapThreadToTicket(threadData, threadId);
      if (ticket) {
        tickets.push(ticket);
      }
    }
    
    // Sort by lastMessageAt descending (most recent first)
    tickets.sort((a, b) => {
      // Find the original thread documents to get timestamps
      const aThread = threadsSnapshot.docs.find((d) => d.id === a.id);
      const bThread = threadsSnapshot.docs.find((d) => d.id === b.id);
      
      if (!aThread || !bThread) return 0;
      
      const aData = aThread.data();
      const bData = bThread.data();
      const aTime = aData.lastMessageAt || aData.createdAt;
      const bTime = bData.lastMessageAt || bData.createdAt;
      
      if (!aTime && !bTime) return 0;
      if (!aTime) return 1;
      if (!bTime) return -1;
      
      return bTime.toMillis() - aTime.toMillis();
    });
    
    return tickets;
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    throw error;
  }
};

/**
 * Get all messages for a specific support thread
 */
export const getSupportThreadMessages = async (
  threadId: string
): Promise<TicketMessage[]> => {
  try {
    const messagesRef = collection(firestore, "supportThreads", threadId, "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    // Get user email for mapping
    const threadDoc = await getDoc(doc(firestore, "supportThreads", threadId));
    const threadData = threadDoc.data();
    const userId = threadData?.userId || threadId;
    const userEmail = await getUserEmail(userId);
    
    const messages: TicketMessage[] = [];
    messagesSnapshot.forEach((msgDoc) => {
      const msgData = msgDoc.data();
      const sender = msgData.sender || "user";
      const author = sender === "user" 
        ? userEmail 
        : (sender === "admin" || sender === "support" ? "Support" : sender);
      
      messages.push({
        id: msgDoc.id,
        author,
        text: msgData.text || "",
        date: formatDate(msgData.createdAt),
      });
    });
    
    return messages;
  } catch (error) {
    console.error(`Error fetching messages for thread ${threadId}:`, error);
    throw error;
  }
};

/**
 * Send admin reply to a support thread
 */
export const sendAdminReply = async (
  threadId: string,
  text: string
): Promise<void> => {
  try {
    const threadRef = doc(firestore, "supportThreads", threadId);
    const messagesRef = collection(firestore, "supportThreads", threadId, "messages");
    
    // Add message to subcollection
    await addDoc(messagesRef, {
      userId: threadId, // Thread ID is the userId
      sender: "admin",
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    
    // Update thread document with last message
    await updateDoc(threadRef, {
      lastMessage: text.trim(),
      lastMessageAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error sending admin reply to thread ${threadId}:`, error);
    throw error;
  }
};

/**
 * Update ticket metadata (status, priority, assignedTo, subject, adminNote)
 */
export const updateTicketMetadata = async (
  threadId: string,
  updates: {
    status?: "open" | "pending" | "closed";
    priority?: "low" | "medium" | "high";
    assignedTo?: string;
    subject?: string;
    adminNote?: string;
  }
): Promise<void> => {
  try {
    const threadRef = doc(firestore, "supportThreads", threadId);
    
    // Build update object with only provided fields
    const updateData: DocumentData = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.assignedTo !== undefined) updateData.assignedTo = updates.assignedTo;
    if (updates.subject !== undefined) updateData.subject = updates.subject;
    if (updates.adminNote !== undefined) updateData.adminNote = updates.adminNote;
    
    // Use merge to preserve existing fields
    await updateDoc(threadRef, updateData);
  } catch (error) {
    console.error(`Error updating ticket metadata for thread ${threadId}:`, error);
    throw error;
  }
};

/**
 * Create a new support ticket (thread)
 * Accepts either userId or email - if email is provided, will look up userId
 */
export const createSupportTicket = async (
  userIdOrEmail: string,
  subject: string,
  initialMessage?: string
): Promise<string> => {
  try {
    // Check if userIdOrEmail is an email (contains @) or a userId
    let userId: string;
    if (userIdOrEmail.includes("@")) {
      // It's an email, find the userId
      const foundUserId = await getUserIdByEmail(userIdOrEmail);
      if (!foundUserId) {
        throw new Error(`User not found with email: ${userIdOrEmail}`);
      }
      userId = foundUserId;
    } else {
      // It's already a userId
      userId = userIdOrEmail;
    }
    
    const threadRef = doc(firestore, "supportThreads", userId);
    
    // Check if thread already exists
    const threadDoc = await getDoc(threadRef);
    
    const threadData: DocumentData = {
      userId,
      subject,
      status: "open",
      priority: "medium",
      assignedTo: "",
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    };
    
    if (initialMessage) {
      threadData.lastMessage = initialMessage;
    } else {
      threadData.lastMessage = subject; // Use subject as last message if no initial message
    }
    
    if (threadDoc.exists()) {
      // Update existing thread with new metadata
      await updateDoc(threadRef, threadData);
    } else {
      // Create new thread
      await setDoc(threadRef, threadData);
    }
    
    // If initial message provided, add it to messages subcollection
    if (initialMessage) {
      const messagesRef = collection(firestore, "supportThreads", userId, "messages");
      await addDoc(messagesRef, {
        userId,
        sender: "admin",
        text: initialMessage.trim(),
        createdAt: serverTimestamp(),
      });
    }
    
    return userId;
  } catch (error) {
    console.error(`Error creating support ticket for user ${userIdOrEmail}:`, error);
    throw error;
  }
};

/**
 * Debug function to check for support threads in database
 * Call this function to see all support threads and their details
 */
export const debugSupportThreads = async (): Promise<void> => {
  // Debug function removed - no longer needed
};

