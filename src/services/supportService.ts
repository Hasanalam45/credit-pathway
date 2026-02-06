/**
 * Support Service
 * 
 * Fetches support issues (chats and scheduled calls) from Firestore
 * and maps them to IssueRow type for display in the User Issues & Support report tab.
 */

import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { firestore } from "../config/firebase";
import type { DateRange } from "../pages/dashboard/DashboardPage";

export type IssueStatus = "open" | "in_progress" | "resolved";

export type IssueRow = {
  id: string;
  user: string;
  subject: string;
  channel: "Chat" | "Phone" | "Email";
  advisor: string;
  status: IssueStatus;
  lastContact: string;
  _sortDate?: Date; // Internal field for sorting
};

/**
 * Calculate date range boundaries
 */
const getDateRange = (range: DateRange): { start: Date; end: Date } | null => {
  // For "all_time", return null to indicate no date filtering
  if (range === "all_time") {
    return null;
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
 * Format time ago string (e.g., "5m ago", "2h ago", "3d ago", "Yesterday")
 */
const formatTimeAgo = (date: Date): string => {
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
 * Get advisor name from advisor ID
 */
const getAdvisorName = (advisorId: string): string => {
  // Hardcoded mapping for now (could be fetched from advisors collection)
  const advisorMap: Record<string, string> = {
    "advisor_default": "Alex G.",
    "advisor_1": "Sam R.",
    "advisor_2": "Taylor P.",
  };
  
  return advisorMap[advisorId] || advisorId.replace("advisor_", "Advisor ").replace("_", " ");
};

/**
 * Get latest message from chat's messages subcollection
 */
const getLatestMessage = async (chatId: string): Promise<{ text: string; sentAt: Date } | null> => {
  try {
    const messagesRef = collection(firestore, "chats", chatId, "messages");
    const messagesQuery = query(messagesRef, orderBy("sentAt", "desc"), limit(1));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    if (messagesSnapshot.empty) {
      return null;
    }
    
    const latestDoc = messagesSnapshot.docs[0];
    const data = latestDoc.data();
    const sentAt = data.sentAt?.toDate?.() || new Date();
    const text = data.text || "";
    
    return { text, sentAt };
  } catch (error) {
    console.error(`Error fetching latest message for chat ${chatId}:`, error);
    return null;
  }
};

/**
 * Determine issue status based on chat data
 */
const determineIssueStatus = (chat: DocumentData): IssueStatus => {
  const unreadCount = chat.unreadCount || 0;
  const lastMessageAt = chat.lastMessageAt?.toDate?.() || chat.createdAt?.toDate?.();
  
  if (!lastMessageAt) {
    return "resolved";
  }
  
  const now = new Date();
  const hoursSinceLastMessage = (now.getTime() - lastMessageAt.getTime()) / (1000 * 60 * 60);
  
  // If has unread messages and recent activity (within 24 hours), it's open
  if (unreadCount > 0 && hoursSinceLastMessage < 24) {
    return "open";
  }
  
  // If no unread but recent activity (within 7 days), it's in progress
  if (unreadCount === 0 && hoursSinceLastMessage < 168) { // 7 days
    return "in_progress";
  }
  
  // Otherwise, resolved
  return "resolved";
};

/**
 * Get user name by user ID
 */
const getUserName = async (userId: string): Promise<string> => {
  try {
    const userDocRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data?.name || data?.email || "Unknown User";
    }
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
  }
  return "Unknown User";
};

/**
 * Get subject from chat or call
 */
const getSubject = (chat: DocumentData, latestMessage: { text: string } | null, callTopic?: string): string => {
  if (callTopic) {
    return callTopic;
  }
  
  if (latestMessage?.text) {
    // Return first 50 characters of latest message
    return latestMessage.text.length > 50 
      ? latestMessage.text.substring(0, 50) + "..."
      : latestMessage.text;
  }
  
  if (chat.lastMessage) {
    return chat.lastMessage.length > 50
      ? chat.lastMessage.substring(0, 50) + "..."
      : chat.lastMessage;
  }
  
  return "Support request";
};

/**
 * Get all support issues from Firestore
 * @param dateRange - Optional date range to filter issues
 */
export const getSupportIssues = async (dateRange?: DateRange): Promise<IssueRow[]> => {
  try {
    const issues: IssueRow[] = [];
    const dateFilter = dateRange ? getDateRange(dateRange) : null;
    
    // Fetch all chats
    const chatsRef = collection(firestore, "chats");
    const chatsSnapshot = await getDocs(chatsRef);
    
    // Create a map to batch user lookups
    const userIds = new Set<string>();
    chatsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId) userIds.add(data.userId);
    });
    
    // Batch fetch user names
    const userNamesMap = new Map<string, string>();
    await Promise.all(
      Array.from(userIds).map(async (userId) => {
        const name = await getUserName(userId);
        userNamesMap.set(userId, name);
      })
    );
    
    // Process chats
    await Promise.all(
      chatsSnapshot.docs.map(async (chatDoc) => {
        try {
          const chatData = chatDoc.data();
          const userId = chatData.userId;
          const userName = userId ? userNamesMap.get(userId) || "Unknown User" : "Unknown User";
          
          const lastMessageAt = chatData.lastMessageAt?.toDate?.() || chatData.createdAt?.toDate?.();
          
          // Filter by date range if provided
          if (dateFilter && lastMessageAt) {
            if (lastMessageAt < dateFilter.start || lastMessageAt > dateFilter.end) {
              return; // Skip this chat
            }
          }
          
          // Get latest message
          const latestMessage = await getLatestMessage(chatDoc.id);
          const status = determineIssueStatus(chatData);
          const subject = getSubject(chatData, latestMessage);
          const advisorName = getAdvisorName(chatData.advisorId || "advisor_default");
          
          const contactDate = lastMessageAt || chatData.createdAt?.toDate?.() || new Date();
          
          issues.push({
            id: `chat-${chatDoc.id}`,
            user: userName,
            subject,
            channel: "Chat",
            advisor: advisorName,
            status,
            lastContact: formatTimeAgo(contactDate),
            _sortDate: contactDate,
          });
        } catch (error) {
          console.error(`Error processing chat ${chatDoc.id}:`, error);
        }
      })
    );
    
    // Fetch scheduled calls
    const callsRef = collection(firestore, "scheduled_calls");
    const callsSnapshot = await getDocs(callsRef);
    
    callsSnapshot.forEach((callDoc) => {
      try {
        const callData = callDoc.data();
        const userId = callData.userId;
        const userName = userId ? userNamesMap.get(userId) || "Unknown User" : "Unknown User";
        
        const scheduledAt = callData.scheduledAt?.toDate?.() || callData.createdAt?.toDate?.();
        const createdAt = callData.createdAt?.toDate?.();
        const contactDate = scheduledAt || createdAt || new Date();
        
        // Filter by date range if provided
        if (dateFilter) {
          if (contactDate < dateFilter.start || contactDate > dateFilter.end) {
            return; // Skip this call
          }
        }
        
        const topic = callData.topic || "Scheduled call";
        const advisorName = getAdvisorName(callData.advisorId || "advisor_default");
        const status = callData.status === "completed" ? "resolved" : 
                      callData.status === "cancelled" ? "resolved" :
                      callData.status === "approved" ? "in_progress" : "open";
        
        issues.push({
          id: `call-${callDoc.id}`,
          user: userName,
          subject: topic,
          channel: "Phone",
          advisor: advisorName,
          status: status as IssueStatus,
          lastContact: formatTimeAgo(contactDate),
          _sortDate: contactDate,
        });
      } catch (error) {
        console.error(`Error processing call ${callDoc.id}:`, error);
      }
    });
    
    // Sort by last contact (most recent first)
    issues.sort((a, b) => {
      const dateA = a._sortDate || new Date(0);
      const dateB = b._sortDate || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Remove internal sort field before returning
    return issues.map(({ _sortDate, ...issue }) => issue);
  } catch (error) {
    console.error("Error getting support issues:", error);
    throw error;
  }
};

