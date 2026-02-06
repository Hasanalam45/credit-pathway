/**
 * Disputes Service
 * 
 * Fetches disputes from Firestore and maps them to DisputeRow type
 * for display in the Disputes & Letters report tab.
 */

import {
  collection,
  getDocs,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { firestore } from "../config/firebase";
import type { DateRange } from "../pages/dashboard/DashboardPage";

export type DisputeStatus = "open" | "resolved" | "mailed";

export type DisputeRow = {
  id: string;
  user: string;
  caseId: string;
  type: string;
  status: DisputeStatus;
  lastUpdated: string;
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
 * Parse MM/DD/YYYY format dates (e.g., "7/8/2019", "10/1/2019")
 */
const parseDateString = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.trim() === "" || dateStr === "null" || dateStr === "undefined") {
    return null;
  }
  
  try {
    const trimmed = dateStr.toString().trim();
    const parts = trimmed.split("/");
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && year > 1970 && year <= new Date().getFullYear() + 1) {
        const parsed = new Date(year, month, day);
        if (!isNaN(parsed.getTime()) && 
            parsed.getFullYear() === year &&
            parsed.getMonth() === month &&
            parsed.getDate() === day) {
          return parsed;
        }
      }
    }
    
    // Fallback to standard Date parsing
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime()) && 
        parsed.getFullYear() > 1970 &&
        parsed.getFullYear() <= new Date().getFullYear() + 1) {
      return parsed;
    }
  } catch (e) {
    // Date parsing failed
  }
  
  return null;
};

/**
 * Check if user has letters for a dispute
 * For now, we'll check if user has any letters (simplified check)
 */
const hasLettersForDispute = (userData: DocumentData): boolean => {
  const letters = userData.letters || userData.generatedLetters || [];
  return Array.isArray(letters) && letters.length > 0;
};

/**
 * Determine dispute status based on dispute and user data
 */
const determineDisputeStatus = (dispute: any, userData: DocumentData): DisputeStatus => {
  // If dispute has explicit resolved status
  if (dispute.status === "resolved" || dispute.status === "closed") {
    return "resolved";
  }
  
  // If user has letters, consider it mailed
  if (hasLettersForDispute(userData)) {
    return "mailed";
  }
  
  // Otherwise, it's open
  return "open";
};

/**
 * Get the most recent date from dispute timestamps
 */
const getLastUpdatedDate = (dispute: any, userData: DocumentData): Date | null => {
  const dates: Date[] = [];
  
  // Get all possible timestamps
  if (dispute.updatedAt?.toDate) {
    dates.push(dispute.updatedAt.toDate());
  }
  if (dispute.openedAt?.toDate) {
    dates.push(dispute.openedAt.toDate());
  }
  if (dispute.resolvedAt?.toDate) {
    dates.push(dispute.resolvedAt.toDate());
  }
  if (dispute.createdAt?.toDate) {
    dates.push(dispute.createdAt.toDate());
  }
  
  // Parse MM/DD/YYYY dates
  if (dispute.lastActivityDate) {
    const parsed = parseDateString(dispute.lastActivityDate.toString());
    if (parsed) dates.push(parsed);
  }
  if (dispute.lastPaymentDate) {
    const parsed = parseDateString(dispute.lastPaymentDate.toString());
    if (parsed) dates.push(parsed);
  }
  
  // Get creditReportAnalysisUpdatedAt from user document
  const analysisUpdatedAtStr = userData.creditReportAnalysisUpdatedAt;
  if (analysisUpdatedAtStr) {
    try {
      const parsed = new Date(analysisUpdatedAtStr);
      if (!isNaN(parsed.getTime())) {
        dates.push(parsed);
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  // Return the most recent date
  if (dates.length === 0) return null;
  return dates.reduce((latest, current) => current > latest ? current : latest);
};

/**
 * Format date to YYYY-MM-DD string
 */
const formatDate = (date: Date | null): string => {
  if (!date) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
};

/**
 * Get dispute type/category
 */
const getDisputeType = (dispute: any): string => {
  if (dispute.category) {
    return dispute.category;
  }
  if (dispute.reason) {
    // Return first 30 characters of reason
    return dispute.reason.length > 30 
      ? dispute.reason.substring(0, 30) + "..."
      : dispute.reason;
  }
  return "Dispute";
};

/**
 * Generate case ID for dispute
 */
const generateCaseId = (userId: string, disputeIndex: number): string => {
  const shortUserId = userId.substring(0, 8);
  return `D-${shortUserId}-${disputeIndex}`;
};

/**
 * Get all disputes from Firestore
 * @param dateRange - Optional date range to filter disputes
 */
export const getDisputes = async (dateRange?: DateRange): Promise<DisputeRow[]> => {
  try {
    const usersRef = collection(firestore, "users");
    const snapshot = await getDocs(usersRef);
    
    const disputes: DisputeRow[] = [];
    const dateFilter = dateRange ? getDateRange(dateRange) : null;
    
    snapshot.forEach((userDoc) => {
      try {
        const userData = userDoc.data();
        const analysis = userData.creditReportAnalysis || {};
        const disputesArray = analysis.disputeCandidates || [];
        
        if (!Array.isArray(disputesArray)) {
          return;
        }
        
        const userName = userData.name || userData.email || "Unknown User";
        
        disputesArray.forEach((dispute: any, index: number) => {
          try {
            // Get last updated date
            const lastUpdated = getLastUpdatedDate(dispute, userData);
            
            // Filter by date range if provided
            if (dateFilter && lastUpdated) {
              if (lastUpdated < dateFilter.start || lastUpdated > dateFilter.end) {
                return; // Skip this dispute
              }
            }
            
            // If no date filter or date is within range, include the dispute
            const status = determineDisputeStatus(dispute, userData);
            const type = getDisputeType(dispute);
            const caseId = generateCaseId(userDoc.id, index);
            const disputeId = `${userDoc.id}-${index}`;
            
            disputes.push({
              id: disputeId,
              user: userName,
              caseId,
              type,
              status,
              lastUpdated: formatDate(lastUpdated),
            });
          } catch (error) {
            console.error(`Error processing dispute ${index} for user ${userDoc.id}:`, error);
            // Continue with next dispute
          }
        });
      } catch (error) {
        console.error(`Error processing user ${userDoc.id}:`, error);
        // Continue with next user
      }
    });
    
    // Sort by last updated (most recent first)
    disputes.sort((a, b) => {
      return b.lastUpdated.localeCompare(a.lastUpdated);
    });
    
    return disputes;
  } catch (error) {
    console.error("Error getting disputes:", error);
    throw error;
  }
};

