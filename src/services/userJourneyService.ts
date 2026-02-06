/**
 * User Journey Service
 * 
 * Fetches user data from Firestore and calculates journey stages and progress
 * based on user's onboarding status, credit reports, disputes, and letters.
 */

import {
  collection,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { firestore } from "../config/firebase";
import type { UserJourney } from "../components/reports/UserJourneyTable";
import type { DateRange } from "../pages/dashboard/DashboardPage";

/**
 * Map tier values to display names
 */
const mapTierToPlanName = (tier: string | null | undefined): string => {
  if (!tier) return "Core";
  const normalized = tier.toLowerCase().trim();
  
  if (normalized === "pro" || normalized === "premium") return "Pro";
  if (normalized === "advantage" || normalized === "advanced") return "Advantage";
  if (normalized === "core" || normalized === "basic" || normalized === "standard") return "Core";
  
  // Default to Core if unknown
  return "Core";
};

/**
 * Check if user has letters (either in letters collection or user document)
 * For performance, we'll check user document fields only
 */
const hasLetters = (userData: DocumentData): boolean => {
  // Check for letters in user document
  const letters = userData.letters || userData.generatedLetters || [];
  if (Array.isArray(letters) && letters.length > 0) {
    return true;
  }
  
  // Could also check letters collection, but for performance we'll skip that
  // and assume if disputes exist and user is active, letters might exist
  return false;
};

/**
 * Calculate journey stage based on user data
 */
const calculateJourneyStage = (userData: DocumentData): string => {
  const documentsCompleted = userData.documentsCompleted === true;
  const creditReportUrl = userData.creditReportUrl;
  const tier = userData.membershipTier || userData.tier || userData.membership;
  const analysis = userData.creditReportAnalysis || {};
  const disputes = analysis.disputeCandidates || [];
  const hasDisputes = Array.isArray(disputes) && disputes.length > 0;
  const userHasLetters = hasLetters(userData);
  
  // Stage 1: Onboarding & profile complete
  if (!documentsCompleted) {
    return "Onboarding & profile complete";
  }
  
  // Stage 2: Credit pull & analysis
  if (!creditReportUrl) {
    return "Credit pull & analysis";
  }
  
  // Stage 3: Plan assigned
  if (!tier) {
    return "Plan assigned";
  }
  
  // Stage 4: Disputes created & letters queued
  if (!hasDisputes) {
    return "Disputes created & letters queued";
  }
  
  // Stage 5: Mailing & bureau responses
  if (userHasLetters) {
    return "Mailing & bureau responses";
  }
  
  // Stage 6: Monitoring & follow-up
  // Check if user has been active for extended period
  const updatedAt = userData.updatedAt?.toDate?.();
  const createdAt = userData.createdAt?.toDate?.();
  const lastActivity = updatedAt || createdAt;
  
  if (lastActivity) {
    const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    // If user has disputes and has been active for more than 30 days, consider them in monitoring
    if (daysSinceActivity > 30 && hasDisputes) {
      return "Monitoring & follow-up";
    }
  }
  
  // Default to mailing stage if disputes exist but no letters detected
  return "Mailing & bureau responses";
};

/**
 * Calculate progress percentage based on journey stage
 */
const calculateProgress = (userData: DocumentData): number => {
  const stage = calculateJourneyStage(userData);
  
  // Map stage to progress range
  if (stage === "Onboarding & profile complete") {
    return 12; // 10-15% range, use middle
  }
  if (stage === "Credit pull & analysis") {
    return 25; // 20-30% range, use middle
  }
  if (stage === "Plan assigned") {
    return 45; // 40-50% range, use middle
  }
  if (stage === "Disputes created & letters queued") {
    return 65; // 60-70% range, use middle
  }
  if (stage === "Mailing & bureau responses") {
    return 85; // 80-90% range, use middle
  }
  if (stage === "Monitoring & follow-up") {
    return 95; // 90-100% range, use middle
  }
  
  // Default fallback
  return 0;
};

/**
 * Format last updated date to YYYY-MM-DD string
 */
const formatLastUpdated = (userData: DocumentData): string => {
  const updatedAt = userData.updatedAt?.toDate?.();
  const createdAt = userData.createdAt?.toDate?.();
  const lastActivity = updatedAt || createdAt;
  
  if (!lastActivity) {
    return new Date().toISOString().slice(0, 10);
  }
  
  return lastActivity.toISOString().slice(0, 10);
};

/**
 * Convert Firestore user document to UserJourney type
 */
const mapFirestoreUserToJourney = (
  doc: QueryDocumentSnapshot<DocumentData>
): UserJourney => {
  const data = doc.data();
  
  const tier = data.membershipTier || data.tier || data.membership;
  const plan = mapTierToPlanName(tier);
  const stage = calculateJourneyStage(data);
  const progress = calculateProgress(data);
  const lastUpdated = formatLastUpdated(data);
  
  return {
    id: doc.id,
    name: data.name || "Unknown User",
    email: data.email || "No email",
    plan,
    stage,
    progress,
    lastUpdated,
  };
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
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
};

/**
 * Get all user journeys from Firestore
 * @param dateRange - Optional date range to filter users by their activity
 */
export const getUserJourneys = async (dateRange?: DateRange): Promise<UserJourney[]> => {
  try {
    const usersRef = collection(firestore, "users");
    const snapshot = await getDocs(usersRef);
    
    const journeys: UserJourney[] = [];
    const dateFilter = dateRange ? getDateRange(dateRange) : null;
    
    snapshot.forEach((doc) => {
      try {
        const data = doc.data();
        
        // Filter by date range if provided (and not "all_time")
        if (dateFilter) {
          const updatedAt = data.updatedAt?.toDate?.();
          const createdAt = data.createdAt?.toDate?.();
          const lastActivity = updatedAt || createdAt;
          
          if (!lastActivity) {
            return; // Skip users with no activity date
          }
          
          // Include user if their last activity falls within the date range
          if (lastActivity < dateFilter.start || lastActivity > dateFilter.end) {
            return; // Skip this user
          }
        }
        
        const journey = mapFirestoreUserToJourney(doc);
        journeys.push(journey);
      } catch (error) {
        console.error(`Error mapping user ${doc.id} to journey:`, error);
        // Skip this user but continue processing others
      }
    });
    
    // Sort by last updated (most recent first)
    journeys.sort((a, b) => {
      return b.lastUpdated.localeCompare(a.lastUpdated);
    });
    
    return journeys;
  } catch (error) {
    console.error("Error getting user journeys:", error);
    throw error;
  }
};

