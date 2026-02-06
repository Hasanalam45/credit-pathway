/**
 * Dashboard Service
 * 
 * Fetches dashboard statistics from Firestore including:
 * - Total Users
 * - Active Users
 * - Members by Tier
 * - Open Disputes
 * - Letters Generated
 */

import {
  collection,
  query,
  getDocs,
  where,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { firestore } from "../config/firebase";
import type { DateRange } from "../pages/dashboard/DashboardPage";

/**
 * Dashboard statistics result
 */
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  membersByTier: {
    percentage: number;
    total: number;
    byTier: Record<string, number>;
  };
  openDisputes: number;
  lettersGenerated: number;
  // For calculating deltas (percentage changes)
  previousPeriodStats?: {
    totalUsers: number;
    activeUsers: number;
    membersByTier: number;
    openDisputes: number;
    lettersGenerated: number;
  };
}

/**
 * Calculate date range boundaries
 */
const getDateRange = (range: DateRange): { start: Date; end: Date } => {
  const end = new Date();
  end.setHours(23, 59, 59, 999); // End of today

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
    case "all_time":
      // Set start to a very early date to include all data
      start.setFullYear(2000, 0, 1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  if (range !== "all_time" && range !== "this_month" && range !== "this_quarter") {
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
};

/**
 * Calculate previous period date range for comparison
 */
const getPreviousPeriodRange = (range: DateRange): { start: Date; end: Date } => {
  // For "all_time", we can't calculate a meaningful previous period
  // Return the same range as current (no comparison)
  if (range === "all_time") {
    const current = getDateRange(range);
    return { start: current.start, end: current.end };
  }
  
  const current = getDateRange(range);
  const duration = current.end.getTime() - current.start.getTime();
  
  const previousEnd = new Date(current.start);
  previousEnd.setTime(previousEnd.getTime() - 1); // One millisecond before current period
  previousEnd.setHours(23, 59, 59, 999);
  
  const previousStart = new Date(previousEnd);
  previousStart.setTime(previousStart.getTime() - duration);
  previousStart.setHours(0, 0, 0, 0);

  return { start: previousStart, end: previousEnd };
};

/**
 * Get total count of users
 * @param beforeDate - Optional: count users created before this date
 */
const getTotalUsers = async (beforeDate?: Date): Promise<number> => {
  try {
    const usersRef = collection(firestore, "users");
    
    if (beforeDate) {
      // Count users created before the specified date
      const beforeTimestamp = Timestamp.fromDate(beforeDate);
      const q = query(usersRef, where("createdAt", "<", beforeTimestamp));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } else {
      // Count all users
      const snapshot = await getDocs(usersRef);
      return snapshot.size;
    }
  } catch (error) {
    console.error("Error getting total users:", error);
    // If query fails (e.g., index missing), fallback to counting all
    if (beforeDate) {
      const snapshot = await getDocs(collection(firestore, "users"));
      let count = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.();
        if (createdAt && createdAt < beforeDate) {
          count++;
        }
      });
      return count;
    }
    throw error;
  }
};

/**
 * Get active users (users with activity within date range)
 * Activity is determined by: updatedAt or createdAt timestamps
 */
const getActiveUsers = async (startDate: Date, endDate: Date): Promise<number> => {
  try {
    const usersRef = collection(firestore, "users");
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Query users with activity in the date range
    // Check updatedAt or createdAt (lastActiveAt doesn't exist in user model)
    const queries = [
      query(usersRef, where("updatedAt", ">=", startTimestamp), where("updatedAt", "<=", endTimestamp)),
      query(usersRef, where("createdAt", ">=", startTimestamp), where("createdAt", "<=", endTimestamp)),
    ];

    // Execute all queries and get unique user IDs
    const userIds = new Set<string>();
    
    for (const q of queries) {
      try {
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          userIds.add(doc.id);
        });
      } catch (error) {
        // Some queries might fail if indexes don't exist, continue with others
        console.warn("Query failed (index might be missing):", error);
      }
    }

    // If no indexed queries work, fallback to checking all users
    if (userIds.size === 0) {
      const allUsersSnapshot = await getDocs(usersRef);
      allUsersSnapshot.forEach((doc) => {
        const data = doc.data();
        // Check updatedAt or createdAt (lastActiveAt doesn't exist in user model)
        const lastActive = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.();
        if (lastActive && lastActive >= startDate && lastActive <= endDate) {
          userIds.add(doc.id);
        }
      });
    }

    return userIds.size;
  } catch (error) {
    console.error("Error getting active users:", error);
    // Return 0 on error to prevent breaking the dashboard
    return 0;
  }
};

/**
 * Get users by membership tier
 */
const getMembersByTier = async (): Promise<{
  total: number;
  byTier: Record<string, number>;
  percentage: number;
}> => {
  try {
    const usersRef = collection(firestore, "users");
    const snapshot = await getDocs(usersRef);
    
    const byTier: Record<string, number> = {};
    let total = 0;
    let membersWithTier = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Check for membershipTier field (could be in different formats)
      const tier = data.membershipTier || data.tier || data.membership || "free";
      
      byTier[tier] = (byTier[tier] || 0) + 1;
      total++;
      
      // Count members (non-free tiers)
      if (tier !== "free" && tier !== "" && tier !== null) {
        membersWithTier++;
      }
    });

    // Calculate percentage of members (non-free) vs total
    const percentage = total > 0 ? Math.round((membersWithTier / total) * 100) : 0;

    return { total, byTier, percentage };
  } catch (error) {
    console.error("Error getting users by tier:", error);
    return { total: 0, byTier: {}, percentage: 0 };
  }
};

/**
 * Get open disputes count
 * Disputes are nested in user documents under creditReportAnalysis.disputeCandidates
 */
const getOpenDisputes = async (): Promise<number> => {
  try {
    const usersRef = collection(firestore, "users");
    const snapshot = await getDocs(usersRef);
    
    let openDisputes = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const analysis = data.creditReportAnalysis || {};
      const disputes = analysis.disputeCandidates || [];
      
      if (Array.isArray(disputes)) {
        disputes.forEach((dispute: any) => {
          // Count disputes that are open or don't have a status (assumed open)
          if (!dispute.status || dispute.status === "open" || dispute.status === "pending") {
            openDisputes++;
          }
        });
      }
    });

    return openDisputes;
  } catch (error) {
    console.error("Error getting open disputes:", error);
    return 0;
  }
};

/**
 * Get letters generated count
 * Check for letters collection or letters field in user documents
 */
const getLettersGenerated = async (startDate: Date, endDate: Date): Promise<number> => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Try to find letters collection first
    try {
      const lettersRef = collection(firestore, "letters");
      const q = query(
        lettersRef,
        where("createdAt", ">=", startTimestamp),
        where("createdAt", "<=", endTimestamp)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      // If letters collection doesn't exist or query fails, check user documents
      console.warn("Letters collection query failed, checking user documents:", error);
    }

    // Fallback: Check user documents for letters field
    let totalLetters = 0;
    const usersRef = collection(firestore, "users");
    const snapshot = await getDocs(usersRef);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const letters = data.letters || data.generatedLetters || [];
      
      if (Array.isArray(letters)) {
        letters.forEach((letter: any) => {
          const letterDate = letter.createdAt?.toDate?.() || letter.generatedAt?.toDate?.();
          if (letterDate && letterDate >= startDate && letterDate <= endDate) {
            totalLetters++;
          }
        });
      }
    });

    return totalLetters;
  } catch (error) {
    console.error("Error getting letters generated:", error);
    return 0;
  }
};

/**
 * Get all dashboard statistics
 */
export const getDashboardStats = async (
  dateRange: DateRange
): Promise<DashboardStats> => {
  try {
    const { start, end } = getDateRange(dateRange);
    const previousRange = getPreviousPeriodRange(dateRange);

    // Fetch current period stats
    const [
      totalUsers,
      activeUsers,
      membersByTier,
      openDisputes,
      lettersGenerated,
    ] = await Promise.all([
      getTotalUsers(), // All users up to now
      getActiveUsers(start, end),
      getMembersByTier(),
      getOpenDisputes(),
      getLettersGenerated(start, end),
    ]);

    // Fetch previous period stats for comparison
    // Note: For disputes and members by tier, we use current values as they don't change frequently
    // Only active users, total users, and letters generated are time-sensitive
    const [
      previousTotalUsers,
      previousActiveUsers,
      previousLettersGenerated,
    ] = await Promise.all([
      getTotalUsers(start), // Total users at the start of current period (end of previous period)
      getActiveUsers(previousRange.start, previousRange.end),
      getLettersGenerated(previousRange.start, previousRange.end),
    ]);

    return {
      totalUsers,
      activeUsers,
      membersByTier,
      openDisputes,
      lettersGenerated,
      previousPeriodStats: {
        totalUsers: previousTotalUsers, // Compare with previous period
        activeUsers: previousActiveUsers,
        membersByTier: membersByTier.percentage, // Use current as tier distribution is relatively stable
        openDisputes: openDisputes, // Use current as disputes are ongoing
        lettersGenerated: previousLettersGenerated,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

/**
 * Calculate percentage change between two values
 */
export const calculateDelta = (
  current: number,
  previous: number
): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number(((current - previous) / previous) * 100);
};

/**
 * Format number with commas (e.g., 1420 -> "1,420")
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US");
};

/**
 * Activity item for recent activity feed
 */
export interface ActivityItem {
  id: string;
  title: string;
  timeAgo: string;
  colorClass: string;
  timestamp: Date;
}

/**
 * Daily usage data point
 */
export interface DailyUsagePoint {
  label: string;
  value: number;
  date: Date;
}

/**
 * Get daily active users for the date range
 * Returns an array of daily counts
 */
export const getDailyActiveUsers = async (
  dateRange: DateRange
): Promise<DailyUsagePoint[]> => {
  try {
    const dateRangeResult = getDateRange(dateRange);
    
    // For "all_time", aggregate by month (last 12 months)
    if (dateRange === "all_time") {
      const months: { date: Date; label: string; start: Date; end: Date }[] = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now);
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
        
        months.push({
          date: monthStart,
          label: monthDate.toLocaleDateString("en-US", { month: "short" }),
          start: monthStart,
          end: monthEnd,
        });
      }
      
      // Get all users
      const usersRef = collection(firestore, "users");
      const snapshot = await getDocs(usersRef);
      
      // Initialize monthly counts
      const monthlyCounts = new Map<string, number>();
      const monthlyUserSets = new Map<string, Set<string>>();
      months.forEach((month) => {
        monthlyCounts.set(month.label, 0);
        monthlyUserSets.set(month.label, new Set());
      });
      
      // Count unique active users per month
      snapshot.forEach((doc) => {
        const userId = doc.id;
        const data = doc.data();
        
        const activityTimestamps: Date[] = [];
        if (data.updatedAt?.toDate) {
          activityTimestamps.push(data.updatedAt.toDate());
        }
        if (data.createdAt?.toDate) {
          activityTimestamps.push(data.createdAt.toDate());
        }
        
        months.forEach((month) => {
          const wasActiveInMonth = activityTimestamps.some(
            (timestamp) => timestamp >= month.start && timestamp <= month.end
          );
          
          if (wasActiveInMonth) {
            const userSet = monthlyUserSets.get(month.label);
            if (userSet) {
              userSet.add(userId);
            }
          }
        });
      });
      
      // Convert sets to counts
      monthlyUserSets.forEach((userSet, monthLabel) => {
        monthlyCounts.set(monthLabel, userSet.size);
      });
      
      // Convert to array format
      return months.map((month) => ({
        label: month.label,
        value: monthlyCounts.get(month.label) || 0,
        date: month.date,
      }));
    }
    
    // For other date ranges, use daily aggregation
    const { start, end } = dateRangeResult;
    
    // Determine number of days and generate day labels
    const days: { date: Date; label: string }[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      
      // For "last_7_days", use "Day 1", "Day 2", etc.
      const dayLabel = 
        dateRange === "last_7_days"
          ? `Day ${days.length + 1}`
          : dateStr;
      
      days.push({
        date: new Date(currentDate),
        label: dayLabel,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get all users
    const usersRef = collection(firestore, "users");
    const snapshot = await getDocs(usersRef);

    // Initialize daily counts
    const dailyCounts = new Map<string, number>();
    days.forEach((day) => {
      dailyCounts.set(day.date.toDateString(), 0);
    });

    // Count unique active users per day
    // Use a Set per day to track unique users
    const dailyUserSets = new Map<string, Set<string>>();
    days.forEach((day) => {
      dailyUserSets.set(day.date.toDateString(), new Set());
    });

    snapshot.forEach((doc) => {
      const userId = doc.id;
      const data = doc.data();
      
      // Get all activity timestamps for this user
      // Note: lastActiveAt doesn't exist in user model, only updatedAt and createdAt
      const activityTimestamps: Date[] = [];
      
      if (data.updatedAt?.toDate) {
        activityTimestamps.push(data.updatedAt.toDate());
      }
      if (data.createdAt?.toDate) {
        activityTimestamps.push(data.createdAt.toDate());
      }

      // For each day, check if user was active on that specific day
      days.forEach((day) => {
        const dayStart = new Date(day.date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day.date);
        dayEnd.setHours(23, 59, 59, 999);

        // Check if any activity timestamp falls on this day
        const wasActiveOnDay = activityTimestamps.some(
          (timestamp) => timestamp >= dayStart && timestamp <= dayEnd
        );

        if (wasActiveOnDay) {
          const dayKey = day.date.toDateString();
          const userSet = dailyUserSets.get(dayKey);
          if (userSet) {
            userSet.add(userId);
          }
        }
      });
    });

    // Convert sets to counts
    dailyUserSets.forEach((userSet, dayKey) => {
      dailyCounts.set(dayKey, userSet.size);
    });

    // Convert to array format
    const result: DailyUsagePoint[] = days.map((day) => ({
      label: day.label,
      value: dailyCounts.get(day.date.toDateString()) || 0,
      date: day.date,
    }));

    return result;
  } catch (error) {
    console.error("Error getting daily active users:", error);
    // Return empty array with correct structure on error
    return [];
  }
};

/**
 * Format time ago string (e.g., "5m ago", "2h ago", "3d ago")
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
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/**
 * Get recent activities from various sources
 * Combines: new users, disputes, membership changes, letters
 */
export const getRecentActivities = async (
  dateRange: DateRange,
  limitCount: number = 10
): Promise<ActivityItem[]> => {
  try {
    const activities: ActivityItem[] = [];
    const { start, end } = getDateRange(dateRange);

    // 1. Get recent user signups
    try {
      const usersRef = collection(firestore, "users");
      const recentUsersQuery = query(
        usersRef,
        where("createdAt", ">=", Timestamp.fromDate(start)),
        where("createdAt", "<=", Timestamp.fromDate(end)),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const usersSnapshot = await getDocs(recentUsersQuery);
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date();
        const email = data.email || data.name || "a user";
        const displayName = email.split("@")[0] || "user";
        
        activities.push({
          id: `user-${doc.id}`,
          title: `New user '${displayName}' signed up.`,
          timeAgo: formatTimeAgo(createdAt),
          colorClass: "bg-blue-500",
          timestamp: createdAt,
        });
      });
    } catch (error) {
      console.warn("Error fetching recent users:", error);
    }

    // 2. Get recent disputes (from user documents)
    // Use the same logic as disputesService.ts - getLastUpdatedDate and filter by date range
    try {
      const usersRef = collection(firestore, "users");
      const usersSnapshot = await getDocs(usersRef);
      const disputeActivities: ActivityItem[] = [];
      const isAllTime = dateRange === "all_time";
      const dateFilter = isAllTime ? null : { start, end };

      // Helper function to parse MM/DD/YYYY format (same as disputesService)
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

      // Helper function to get last updated date (same logic as disputesService)
      const getLastUpdatedDate = (dispute: any, userData: any): Date | null => {
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

      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        const analysis = userData.creditReportAnalysis || {};
        const disputes = analysis.disputeCandidates || [];

        if (Array.isArray(disputes)) {
          disputes.forEach((dispute: any, index: number) => {
            try {
              const status = dispute.status || "open";
              const disputeId = dispute.id || `${userDoc.id}-${index}`;
              
              // Get last updated date using the same logic as reports page
              const lastUpdated = getLastUpdatedDate(dispute, userData);
              
              // Filter by date range if provided (same logic as disputesService)
              if (dateFilter && lastUpdated) {
                if (lastUpdated < dateFilter.start || lastUpdated > dateFilter.end) {
                  return; // Skip this dispute
                }
              }
              
              // If no date filter or date is within range, include the dispute
              // Use lastUpdated if available, otherwise use current date as fallback
              const displayDate = lastUpdated || new Date();
              
              const isOpen = status === "open" || status === "pending";
              const isResolved = status === "resolved" || status === "closed";
              
              // Build title
              let title = `Dispute #${disputeId.slice(-3)} `;
              
              if (isResolved) {
                title += "was resolved";
              } else {
                title += "was opened";
              }
              
              // Add payment/activity indicators
              const indicators: string[] = [];
              if (dispute.lastPaymentDate) {
                indicators.push("Payment done");
              } else if (dispute.lastActivityDate) {
                indicators.push("Activity recorded");
              }
              
              if (indicators.length > 0) {
                title += ` (${indicators.join(", ")})`;
              }
              
              disputeActivities.push({
                id: `dispute-${isOpen ? "open" : "resolved"}-${disputeId}`,
                title: title,
                timeAgo: formatTimeAgo(displayDate),
                colorClass: isOpen ? "bg-red-500" : "bg-emerald-500",
                timestamp: displayDate,
              });
            } catch (error) {
              console.error(`Error processing dispute ${index} for user ${userDoc.id}:`, error);
              // Continue with next dispute
            }
          });
        }
      });

      activities.push(...disputeActivities);
    } catch (error) {
      console.warn("Error fetching disputes:", error);
    }

    // 3. Get recent letters generated
    try {
      // Try letters collection first
      const lettersRef = collection(firestore, "letters");
      const recentLettersQuery = query(
        lettersRef,
        where("createdAt", ">=", Timestamp.fromDate(start)),
        where("createdAt", "<=", Timestamp.fromDate(end)),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      
      try {
        const lettersSnapshot = await getDocs(recentLettersQuery);
        const letterCounts = new Map<string, number>();
        
        lettersSnapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate?.() || new Date();
          const dateKey = createdAt.toDateString();
          letterCounts.set(dateKey, (letterCounts.get(dateKey) || 0) + 1);
        });

        letterCounts.forEach((count, dateKey) => {
          const date = new Date(dateKey);
          activities.push({
            id: `letters-${dateKey}`,
            title: `${count} new letter${count > 1 ? "s" : ""} generated automatically.`,
            timeAgo: formatTimeAgo(date),
            colorClass: "bg-purple-500",
            timestamp: date,
          });
        });
      } catch (error) {
        // If letters collection doesn't exist or query fails, skip
        console.warn("Letters collection query failed:", error);
      }
    } catch (error) {
      console.warn("Error fetching letters:", error);
    }

    // 4. Get membership tier changes (check users with recent updates)
    try {
      const usersRef = collection(firestore, "users");
      const recentUpdatesQuery = query(
        usersRef,
        where("updatedAt", ">=", Timestamp.fromDate(start)),
        where("updatedAt", "<=", Timestamp.fromDate(end)),
        orderBy("updatedAt", "desc"),
        limit(limitCount)
      );
      
      try {
        const updatesSnapshot = await getDocs(recentUpdatesQuery);
        updatesSnapshot.forEach((doc) => {
          const data = doc.data();
          const membershipTier = data.membershipTier || data.tier;
          const updatedAt = data.updatedAt?.toDate?.() || new Date();
          const email = data.email || data.name || "user";
          const displayName = email.split("@")[0] || "user";

          if (membershipTier && (membershipTier === "Pro" || membershipTier === "Advantage" || membershipTier === "VIP")) {
            activities.push({
              id: `membership-${doc.id}`,
              title: `${membershipTier} membership activated for '${displayName}'.`,
              timeAgo: formatTimeAgo(updatedAt),
              colorClass: "bg-amber-400",
              timestamp: updatedAt,
            });
          }
        });
      } catch (error) {
        console.warn("Membership query failed:", error);
      }
    } catch (error) {
      console.warn("Error fetching membership changes:", error);
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Return limited results
    return activities.slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
};

