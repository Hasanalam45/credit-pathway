/**
 * Mailing Service
 * 
 * Fetches letters/mailing logs from Firestore and maps them to MailLog type
 * for display in the Mailing Logs report tab.
 */

import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "../config/firebase";
import type { DateRange } from "../pages/dashboard/DashboardPage";

export type MailStatus = "queued" | "sent" | "failed";

export type MailLog = {
  id: string;
  user: string;
  item: string;
  channel: "Mail" | "Email";
  status: MailStatus;
  createdAt: string;
  error?: string;
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
 * Format timestamp to "YYYY-MM-DD HH:mm" string
 */
const formatCreatedAt = (timestamp: Date | null | undefined): string => {
  if (!timestamp) {
    const now = new Date();
    return now.toISOString().slice(0, 16).replace("T", " ");
  }
  
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, "0");
  const day = String(timestamp.getDate()).padStart(2, "0");
  const hours = String(timestamp.getHours()).padStart(2, "0");
  const minutes = String(timestamp.getMinutes()).padStart(2, "0");
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * Determine mail status from letter data
 */
const determineMailStatus = (letter: any): MailStatus => {
  if (letter.error) {
    return "failed";
  }
  if (letter.sentAt || letter.status === "sent") {
    return "sent";
  }
  return "queued";
};

/**
 * Get channel from letter data
 */
const getChannel = (letter: any): "Mail" | "Email" => {
  if (letter.channel) {
    const channel = letter.channel.toString().toLowerCase();
    if (channel === "email") return "Email";
    if (channel === "mail") return "Mail";
  }
  // Default to Mail if not specified
  return "Mail";
};

/**
 * Get item identifier for letter
 */
const getItemIdentifier = (letter: any, letterId: string): string => {
  if (letter.type) {
    const type = letter.type.toString().toLowerCase();
    if (type.includes("email")) {
      return "Email notice";
    }
  }
  return `Letter #${letterId.substring(0, 6)}`;
};

/**
 * Get user name by user ID (helper function)
 */
const getUserName = async (userId: string): Promise<string> => {
  try {
    const { doc, getDoc } = await import("firebase/firestore");
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
 * Get all mailing logs from Firestore
 * @param dateRange - Optional date range to filter logs
 */
export const getMailingLogs = async (dateRange?: DateRange): Promise<MailLog[]> => {
  try {
    const logs: MailLog[] = [];
    const dateFilter = dateRange ? getDateRange(dateRange) : null;
    
    const startTimestamp = dateFilter ? Timestamp.fromDate(dateFilter.start) : null;
    const endTimestamp = dateFilter ? Timestamp.fromDate(dateFilter.end) : null;
    
    // Try letters collection first
    try {
      const lettersRef = collection(firestore, "letters");
      let lettersQuery = query(lettersRef);
      
      if (startTimestamp && endTimestamp) {
        lettersQuery = query(
          lettersRef,
          where("createdAt", ">=", startTimestamp),
          where("createdAt", "<=", endTimestamp)
        );
      }
      
      const lettersSnapshot = await getDocs(lettersQuery);
      
      // Create a map to batch user lookups
      const userIds = new Set<string>();
      lettersSnapshot.forEach((doc) => {
        const data = doc.data();
        const userId = data.userId || data.user?.id || null;
        if (userId) userIds.add(userId);
      });
      
      // Batch fetch user names
      const userNamesMap = new Map<string, string>();
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          const name = await getUserName(userId);
          userNamesMap.set(userId, name);
        })
      );
      
      lettersSnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          const userId = data.userId || data.user?.id;
          const userName = userId ? userNamesMap.get(userId) || "Unknown User" : "Unknown User";
          
          const createdAt = data.createdAt?.toDate?.() || data.generatedAt?.toDate?.() || new Date();
          
          // Additional date range check in case query didn't filter properly
          if (dateFilter && (createdAt < dateFilter.start || createdAt > dateFilter.end)) {
            return;
          }
          
          const status = determineMailStatus(data);
          const channel = getChannel(data);
          const item = getItemIdentifier(data, doc.id);
          
          logs.push({
            id: doc.id,
            user: userName,
            item,
            channel,
            status,
            createdAt: formatCreatedAt(createdAt),
            error: data.error || undefined,
          });
        } catch (error) {
          console.error(`Error processing letter ${doc.id}:`, error);
        }
      });
    } catch (error) {
      // If letters collection doesn't exist or query fails, fallback to user documents
      console.warn("Letters collection query failed, checking user documents:", error);
    }
    
    // Fallback: Check user documents for letters
    const usersRef = collection(firestore, "users");
    const usersSnapshot = await getDocs(usersRef);
    
    usersSnapshot.forEach((userDoc) => {
      try {
        const userData = userDoc.data();
        const userName = userData.name || userData.email || "Unknown User";
        const letters = userData.letters || userData.generatedLetters || [];
        
        if (!Array.isArray(letters)) {
          return;
        }
        
        letters.forEach((letter: any, index: number) => {
          try {
            const letterDate = letter.createdAt?.toDate?.() || letter.generatedAt?.toDate?.();
            
            if (!letterDate) {
              return; // Skip letters without dates
            }
            
            // Filter by date range if provided
            if (dateFilter && (letterDate < dateFilter.start || letterDate > dateFilter.end)) {
              return;
            }
            
            const status = determineMailStatus(letter);
            const channel = getChannel(letter);
            const letterId = letter.id || `${userDoc.id}-${index}`;
            const item = getItemIdentifier(letter, letterId);
            
            logs.push({
              id: `${userDoc.id}-${index}`,
              user: userName,
              item,
              channel,
              status,
              createdAt: formatCreatedAt(letterDate),
              error: letter.error || undefined,
            });
          } catch (error) {
            console.error(`Error processing letter ${index} for user ${userDoc.id}:`, error);
          }
        });
      } catch (error) {
        console.error(`Error processing user ${userDoc.id}:`, error);
      }
    });
    
    // Sort by created date (most recent first)
    logs.sort((a, b) => {
      return b.createdAt.localeCompare(a.createdAt);
    });
    
    return logs;
  } catch (error) {
    console.error("Error getting mailing logs:", error);
    throw error;
  }
};

