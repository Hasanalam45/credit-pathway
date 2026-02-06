/**
 * Analytics Service
 * 
 * Fetches analytics data from Firestore for the Analytics Dashboard:
 * - Daily Active Users (DAU)
 * - Weekly Active Users (WAU)
 * - Membership Distribution
 * - System Engagement (Imports, Letters, Disputes)
 * - Top Articles
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
import type { AnalyticsRange } from "../pages/analytics/AnalyticsPage";

/**
 * Calculate date range boundaries for AnalyticsRange
 */
const calculateDateRange = (
  range: AnalyticsRange,
  customStartDate?: string,
  customEndDate?: string
): { start: Date; end: Date } => {
  // Handle custom range
  if (range === "custom" && customStartDate && customEndDate) {
    const start = new Date(customStartDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(customEndDate);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  // Handle predefined ranges
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
    case "custom":
      // Fallback to last 7 days if custom dates not provided
      start.setDate(start.getDate() - 7);
      break;
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
};

/**
 * Daily Active Users data point
 */
export interface DailyActiveUsersPoint {
  label: string;
  value: number;
  date: Date;
}

/**
 * Get daily active users for the date range
 */
export const getDailyActiveUsers = async (
  range: AnalyticsRange,
  customStartDate?: string,
  customEndDate?: string
): Promise<DailyActiveUsersPoint[]> => {
  try {
    const { start, end } = calculateDateRange(range, customStartDate, customEndDate);
    
    // Determine number of days and generate day labels
    const days: { date: Date; label: string }[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
      });
      
      days.push({
        date: new Date(currentDate),
        label: dateStr,
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

    // Count active users per day
    snapshot.forEach((doc) => {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toDate?.() as Date | null;
      const createdAt = data.createdAt?.toDate?.() as Date | null;
      
      // Use updatedAt if available, otherwise createdAt
      const activityDate = updatedAt || createdAt;
      
      if (activityDate) {
        const dateStr = activityDate.toDateString();
        if (dailyCounts.has(dateStr)) {
          dailyCounts.set(dateStr, (dailyCounts.get(dateStr) || 0) + 1);
        }
      }
    });

    // Map to result format
    return days.map((day) => ({
      label: day.label,
      value: dailyCounts.get(day.date.toDateString()) || 0,
      date: day.date,
    }));
  } catch (error) {
    console.error("Error getting daily active users:", error);
    return [];
  }
};

/**
 * Weekly Active Users data point
 */
export interface WeeklyActiveUsersPoint {
  label: string;
  value: number;
  weekStart: Date;
}

/**
 * Get weekly active users for the date range
 */
export const getWeeklyActiveUsers = async (
  range: AnalyticsRange,
  customStartDate?: string,
  customEndDate?: string
): Promise<WeeklyActiveUsersPoint[]> => {
  try {
    const { end } = calculateDateRange(range, customStartDate, customEndDate);
    
    // Calculate number of weeks
    const weeks = (() => {
      switch (range) {
        case "last_7_days":
          return 1;
        case "last_30_days":
          return 4;
        case "this_month":
          return 4;
        case "this_quarter":
          return 12;
        case "custom":
        default:
          return 4;
      }
    })();

    // Generate week labels - go backwards from end date
    const weekData: { weekStart: Date; label: string }[] = [];
    const currentDate = new Date(end);
    
    for (let i = weeks - 1; i >= 0; i--) {
      // Calculate week start (Monday of the week)
      const weekStart = new Date(currentDate);
      const dayOfWeek = weekStart.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days back
      weekStart.setDate(weekStart.getDate() - daysToMonday - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      weekData.push({
        weekStart: new Date(weekStart),
        label: `W-${weeks - i}`,
      });
    }
    
    // Sort by weekStart ascending
    weekData.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

    // Get all users
    const usersRef = collection(firestore, "users");
    const snapshot = await getDocs(usersRef);

    // Initialize weekly counts
    const weeklyCounts = new Map<string, number>();
    weekData.forEach((week) => {
      weeklyCounts.set(week.weekStart.toDateString(), 0);
    });

    // Count active users per week
    snapshot.forEach((doc) => {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toDate?.() as Date | null;
      const createdAt = data.createdAt?.toDate?.() as Date | null;
      
      const activityDate = updatedAt || createdAt;
      
      if (activityDate) {
        // Find which week this date belongs to
        weekData.forEach((week) => {
          const weekEnd = new Date(week.weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          if (activityDate >= week.weekStart && activityDate <= weekEnd) {
            const key = week.weekStart.toDateString();
            weeklyCounts.set(key, (weeklyCounts.get(key) || 0) + 1);
          }
        });
      }
    });

    // Map to result format
    return weekData.map((week) => ({
      label: week.label,
      value: weeklyCounts.get(week.weekStart.toDateString()) || 0,
      weekStart: week.weekStart,
    }));
  } catch (error) {
    console.error("Error getting weekly active users:", error);
    return [];
  }
};

/**
 * Membership distribution data point
 */
export interface MembershipDistributionPoint {
  label: string;
  value: number;
  color: string;
}

/**
 * Get users by membership tier (internal helper)
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
      const tier = data.membershipTier || data.tier || data.membership || "core";
      
      byTier[tier] = (byTier[tier] || 0) + 1;
      total++;
      
      // Count all non-empty tiers as members (Core, Advantage, Pro are all valid tiers)
      if (tier !== "" && tier !== null) {
        membersWithTier++;
      }
    });

    const percentage = total > 0 ? Math.round((membersWithTier / total) * 100) : 0;
    return { total, byTier, percentage };
  } catch (error) {
    console.error("Error getting users by tier:", error);
    return { total: 0, byTier: {}, percentage: 0 };
  }
};

/**
 * Get letters generated count (internal helper)
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
 * Get membership distribution
 */
export const getMembershipDistribution = async (): Promise<MembershipDistributionPoint[]> => {
  try {
    const result = await getMembersByTier();
    
    // Map tier names to display labels and colors
    // Only include the actual tiers used in the app: Core, Advantage, Pro
    const tierMapping: Record<string, { label: string; color: string }> = {
      pro: { label: "Pro", color: "#D4A317" },           // Gold
      advantage: { label: "Advantage", color: "#A0761A" }, // Dark gold/bronze
      core: { label: "Core", color: "#60460F" },        // Gray (different from others)
    };

    // Calculate percentages and format
    const total = result.total || 1; // Avoid division by zero
    const distribution: MembershipDistributionPoint[] = [];

    Object.entries(result.byTier).forEach(([tier, count]) => {
      const normalizedTier = tier.toLowerCase().trim();
      const mapping = tierMapping[normalizedTier] || { label: tier, color: "#9CA3AF" };
      const percentage = Math.round((count / total) * 100);
      
      distribution.push({
        label: `${mapping.label} (${percentage}%)`,
        value: percentage,
        color: mapping.color,
      });
    });

    // Sort by value descending
    return distribution.sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error("Error getting membership distribution:", error);
    return [];
  }
};

/**
 * System engagement metrics
 */
export interface SystemEngagement {
  imports: number;
  letters: number;
  disputes: number;
  total: number;
  change: number; // Percentage change from previous period
}

/**
 * Get credit report imports count
 */
const getCreditReportImports = async (start: Date, end: Date): Promise<number> => {
  try {
    const usersRef = collection(firestore, "users");
    const snapshot = await getDocs(usersRef);
    
    let count = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      const creditReportUrl = data.creditReportUrl;
      const updatedAt = data.updatedAt?.toDate?.() as Date | null;
      
      // Count if creditReportUrl exists and was set in the date range
      if (creditReportUrl && updatedAt) {
        if (updatedAt >= start && updatedAt <= end) {
          count++;
        }
      }
    });

    return count;
  } catch (error) {
    console.error("Error getting credit report imports:", error);
    return 0;
  }
};

/**
 * Helper function to parse MM/DD/YYYY format dates (e.g., "7/8/2019", "10/1/2019")
 */
const parseDateString = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.trim() === "" || dateStr === "null" || dateStr === "undefined") {
    return null;
  }
  
  try {
    const trimmed = dateStr.toString().trim();
    // Parse MM/DD/YYYY format
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
 * Get disputes created in date range
 * Uses same logic as Recent Activity: checks multiple date fields including
 * creditReportAnalysisUpdatedAt, lastPaymentDate, lastActivityDate, and other timestamps
 */
const getDisputesCreated = async (start: Date, end: Date): Promise<number> => {
  try {
    const usersRef = collection(firestore, "users");
    const snapshot = await getDocs(usersRef);
    
    let count = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      const analysis = data.creditReportAnalysis || {};
      const disputes = analysis.disputeCandidates || [];
      
      // Get creditReportAnalysisUpdatedAt from user document (when disputes were identified)
      const analysisUpdatedAtStr = data.creditReportAnalysisUpdatedAt;
      let analysisUpdatedAt: Date | null = null;
      if (analysisUpdatedAtStr) {
        // Parse ISO8601 string or try Date parsing
        try {
          analysisUpdatedAt = new Date(analysisUpdatedAtStr);
          if (isNaN(analysisUpdatedAt.getTime())) {
            analysisUpdatedAt = null;
          }
        } catch (e) {
          analysisUpdatedAt = null;
        }
      }
      
      if (Array.isArray(disputes)) {
        disputes.forEach((dispute: any) => {
          // Parse lastPaymentDate and lastActivityDate (they're in MM/DD/YYYY format)
          let lastPaymentDate: Date | null = null;
          let lastActivityDate: Date | null = null;
          
          if (dispute.lastPaymentDate) {
            lastPaymentDate = parseDateString(dispute.lastPaymentDate.toString());
          }
          
          if (dispute.lastActivityDate) {
            lastActivityDate = parseDateString(dispute.lastActivityDate.toString());
          }
          
          // Get all possible dispute timestamps
          const disputeCreatedAt = dispute.createdAt?.toDate?.();
          const disputeOpenedAt = dispute.openedAt?.toDate?.();
          const disputeResolvedAt = dispute.resolvedAt?.toDate?.();
          const disputeUpdatedAt = dispute.updatedAt?.toDate?.();
          
          // Check if ANY of these dates fall within the selected range
          const paymentInRange = lastPaymentDate ? (lastPaymentDate >= start && lastPaymentDate <= end) : false;
          const activityInRange = lastActivityDate ? (lastActivityDate >= start && lastActivityDate <= end) : false;
          const analysisInRange = analysisUpdatedAt ? (analysisUpdatedAt >= start && analysisUpdatedAt <= end) : false;
          const createdAtInRange = disputeCreatedAt ? (disputeCreatedAt >= start && disputeCreatedAt <= end) : false;
          const openedAtInRange = disputeOpenedAt ? (disputeOpenedAt >= start && disputeOpenedAt <= end) : false;
          const resolvedAtInRange = disputeResolvedAt ? (disputeResolvedAt >= start && disputeResolvedAt <= end) : false;
          const updatedAtInRange = disputeUpdatedAt ? (disputeUpdatedAt >= start && disputeUpdatedAt <= end) : false;
          
          // Count dispute if ANY date falls within the selected range
          const isWithinRange = paymentInRange || activityInRange || analysisInRange || 
                               createdAtInRange || openedAtInRange || resolvedAtInRange || updatedAtInRange;
          
          if (isWithinRange) {
            count++;
          }
        });
      }
    });

    return count;
  } catch (error) {
    console.error("Error getting disputes created:", error);
    return 0;
  }
};

/**
 * Get system engagement metrics
 */
export const getSystemEngagement = async (
  range: AnalyticsRange,
  customStartDate?: string,
  customEndDate?: string
): Promise<SystemEngagement> => {
  try {
    const { start, end } = calculateDateRange(range, customStartDate, customEndDate);
    
    // Calculate previous period for comparison
    const duration = end.getTime() - start.getTime();
    const previousEnd = new Date(start);
    previousEnd.setTime(previousEnd.getTime() - 1);
    previousEnd.setHours(23, 59, 59, 999);
    const previousStart = new Date(previousEnd);
    previousStart.setTime(previousStart.getTime() - duration);
    previousStart.setHours(0, 0, 0, 0);

    // Fetch current period data
    const [imports, letters, disputes] = await Promise.all([
      getCreditReportImports(start, end),
      getLettersGenerated(start, end),
      getDisputesCreated(start, end),
    ]);

    // Fetch previous period data for comparison
    const [prevImports, prevLetters, prevDisputes] = await Promise.all([
      getCreditReportImports(previousStart, previousEnd),
      getLettersGenerated(previousStart, previousEnd),
      getDisputesCreated(previousStart, previousEnd),
    ]);

    const total = imports + letters + disputes;
    const prevTotal = prevImports + prevLetters + prevDisputes;
    
    // Calculate percentage change
    const change = prevTotal > 0 
      ? Math.round(((total - prevTotal) / prevTotal) * 1000) / 10 
      : (total > 0 ? 100 : 0);

    return {
      imports,
      letters,
      disputes,
      total,
      change,
    };
  } catch (error) {
    console.error("Error getting system engagement:", error);
    return {
      imports: 0,
      letters: 0,
      disputes: 0,
      total: 0,
      change: 0,
    };
  }
};

/**
 * Top article data
 */
export interface TopArticle {
  title: string;
  views: number; // Using favorites as proxy, or 0 if no tracking
}

/**
 * Get article favorites count filtered by date range
 * Uses individual user subcollections instead of collectionGroup to avoid index requirement
 * Fetches all favorites and filters in memory to avoid too many queries
 */
const getArticleFavoritesCount = async (
  startDate: Date,
  endDate: Date
): Promise<{ articleId: string; title: string; count: number }[]> => {
  try {
    // Get all users first
    const usersRef = collection(firestore, "users");
    const usersSnapshot = await getDocs(usersRef);
    
    // Count favorites per article
    const favoritesCount = new Map<string, { title: string; count: number }>();
    
    // Process users in batches to avoid overwhelming Firestore
    const batchSize = 10;
    const userDocs = Array.from(usersSnapshot.docs);
    
    for (let i = 0; i < userDocs.length; i += batchSize) {
      const batch = userDocs.slice(i, i + batchSize);
      
      // Process batch in parallel
      await Promise.all(
        batch.map(async (userDoc) => {
          try {
            const favoritesRef = collection(
              firestore,
              `users/${userDoc.id}/favoriteArticles`
            );
            
            // Fetch all favorites (no date filter on query to avoid index issues)
            // We'll filter by date in memory
            const snapshot = await getDocs(favoritesRef);
            
            snapshot.forEach((doc) => {
              const data = doc.data();
              const createdAt = data.createdAt?.toDate?.();
              
              // Filter by date range in memory
              if (createdAt && createdAt >= startDate && createdAt <= endDate) {
                const articleId = (data.articleId || doc.id) as string;
                const title = (data.title || "Untitled Article") as string;
                
                const current = favoritesCount.get(articleId) || { title, count: 0 };
                favoritesCount.set(articleId, {
                  title: current.title || title,
                  count: current.count + 1,
                });
              }
            });
          } catch (error) {
            // Skip users with errors (e.g., no favoriteArticles subcollection)
            // Silently skip to avoid console spam
          }
        })
      );
    }

    // Convert to array
    return Array.from(favoritesCount.entries()).map(([articleId, data]) => ({
      articleId,
      title: data.title,
      count: data.count,
    }));
  } catch (error) {
    console.error("Error getting article favorites count:", error);
    return [];
  }
};

/**
 * Get top articles by engagement
 * Uses favorites as proxy, falls back to recent articles if no favorites
 */
export const getTopArticles = async (
  range: AnalyticsRange,
  customStartDate?: string,
  customEndDate?: string
): Promise<TopArticle[]> => {
  try {
    // Calculate date range
    const { start, end } = calculateDateRange(range, customStartDate, customEndDate);
    
    // Step 1: Try to get favorites count within date range
    const favoritesCount = await getArticleFavoritesCount(start, end);
    
    if (favoritesCount && favoritesCount.length > 0) {
      // Return articles sorted by favorites (as engagement proxy)
      return favoritesCount
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(item => ({ title: item.title, views: item.count }));
    }
    
    // Step 2: Fallback to articles created within date range, sorted by createdAt
    const articlesRef = collection(firestore, "articles");
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);
    
    const q = query(
      articlesRef,
      where("createdAt", ">=", startTimestamp),
      where("createdAt", "<=", endTimestamp),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return []; // Empty state - no articles
    }
    
    // Return articles with 0 views (no tracking available)
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        title: data.title || "Untitled Article",
        views: 0, // No tracking available
      };
    });
    
  } catch (error) {
    console.error("Error getting top articles:", error);
    return [];
  }
};

