import {
  collection,
  query,
  getDocs,
  orderBy,
  QueryDocumentSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { firestore, auth } from "../config/firebase";
import type { User, UserTier, UserStatus, SortBy } from "../components/users/UserTable";

/**
 * Map Firestore tier values to frontend UserTier
 */
const mapTier = (tier: string | null | undefined): UserTier => {
  if (!tier) return "Core";
  const normalized = tier.toLowerCase().trim();
  
  if (normalized === "pro" || normalized === "premium") return "Pro";
  if (normalized === "advantage" || normalized === "advanced") return "Advantage";
  if (normalized === "core" || normalized === "basic" || normalized === "standard") return "Core";
  
  // Default to Core if unknown
  return "Core";
};

/**
 * Determine user status based on activity
 * Active if updatedAt is within last 30 days, otherwise inactive
 */
const determineStatus = (updatedAt: Date | null, createdAt: Date | null): UserStatus => {
  const lastActivity = updatedAt || createdAt;
  if (!lastActivity) return "inactive";
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return lastActivity >= thirtyDaysAgo ? "active" : "inactive";
};

/**
 * Format date to YYYY-MM-DD string
 */
const formatDate = (date: Date | null | undefined): string => {
  if (!date) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
};

/**
 * Convert Firestore document to User type
 */
const mapFirestoreUserToUser = (
  doc: QueryDocumentSnapshot<DocumentData>
): User => {
  const data = doc.data();
  
  // Extract timestamps
  const createdAt = data.createdAt?.toDate?.() as Date | null;
  const updatedAt = data.updatedAt?.toDate?.() as Date | null;
  
  // Get tier from various possible fields
  const tier = mapTier(
    data.membershipTier || data.tier || data.membership || "Core"
  );
  
  // Get status from Firestore, or calculate from activity if not present
  // Check for explicit status field first (isActive, status, or userStatus)
  let status: UserStatus = "active";
  if (data.isActive !== undefined) {
    status = data.isActive ? "active" : "inactive";
  } else if (data.status !== undefined) {
    status = (data.status === "active" || data.status === "inactive") 
      ? data.status as UserStatus 
      : determineStatus(updatedAt, createdAt);
  } else if (data.userStatus !== undefined) {
    status = (data.userStatus === "active" || data.userStatus === "inactive")
      ? data.userStatus as UserStatus
      : determineStatus(updatedAt, createdAt);
  } else {
    // Fallback to calculating from activity dates if no explicit status
    status = determineStatus(updatedAt, createdAt);
  }
  
  // Format address if available
  const addressParts = [
    data.address,
    data.city,
    data.state,
    data.zipCode,
  ].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(", ") : undefined;
  
  return {
    id: doc.id,
    name: data.name || "Unknown User",
    email: data.email || "",
    tier,
    status,
    dateJoined: formatDate(createdAt),
    lastActivity: formatDate(updatedAt || createdAt),
    phone: data.phone || undefined,
    address,
    avatarUrl: data.photoUrl || undefined,
  };
};

export interface GetUsersParams {
  page: number;
  pageSize: number;
  search?: string;
  tierFilter?: UserTier | "all";
  statusFilter?: UserStatus | "all";
  sortBy?: SortBy;
}

export interface GetUsersResult {
  users: User[];
  total: number;
  hasMore: boolean;
}

/**
 * Get users from Firestore with pagination, filtering, and sorting
 */
export const getUsers = async ({
  page,
  pageSize,
  search,
  tierFilter,
  statusFilter,
  sortBy = "date_joined",
}: GetUsersParams): Promise<GetUsersResult> => {
  try {
    const usersRef = collection(firestore, "users");
    
    // Build base query
    let q = query(usersRef);
    
    // Apply sorting
    const sortField = sortBy === "date_joined" ? "createdAt" : "updatedAt";
    q = query(q, orderBy(sortField, "desc"));
    
    // Apply filters
    // Note: Firestore has limitations on compound queries, so we'll fetch and filter in memory
    // For production, consider using Firestore indexes or Cloud Functions for complex queries
    
    // Execute query
    const snapshot = await getDocs(q);
    
    // Map and filter results
    let allUsers = snapshot.docs.map(mapFirestoreUserToUser);
    
    // Apply search filter
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      allUsers = allUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply tier filter
    if (tierFilter && tierFilter !== "all") {
      allUsers = allUsers.filter((user) => user.tier === tierFilter);
    }
    
    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      allUsers = allUsers.filter((user) => user.status === statusFilter);
    }
    
    // Calculate pagination
    const total = allUsers.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);
    const hasMore = endIndex < total;
    
    return {
      users: paginatedUsers,
      total,
      hasMore,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    // If query fails (e.g., missing index), return empty result
    return {
      users: [],
      total: 0,
      hasMore: false,
    };
  }
};

/**
 * Get total count of users (for quick stats)
 */
export const getTotalUsersCount = async (): Promise<number> => {
  try {
    const usersRef = collection(firestore, "users");
    const snapshot = await getDocs(usersRef);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting total users count:", error);
    return 0;
  }
};

/**
 * Map frontend UserTier to Firestore tier value (lowercase)
 */
const mapTierToFirestore = (tier: UserTier): string => {
  return tier.toLowerCase();
};

/**
 * Parse address string into components (simple parsing)
 * Format: "Street, City, State, ZIP" or just "Street"
 */
const parseAddress = (address: string | undefined): {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
} => {
  if (!address) return {};
  
  const parts = address.split(",").map(s => s.trim());
  return {
    address: parts[0] || undefined,
    city: parts[1] || undefined,
    state: parts[2] || undefined,
    zipCode: parts[3] || undefined,
  };
};

/**
 * Create a new user in Firebase Auth and Firestore
 */
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  tier: UserTier;
  status: UserStatus;
  phone?: string;
  address?: string;
  dateJoined?: string;
}

export const createUser = async (userData: CreateUserData): Promise<string> => {
  try {
    // Step 1: Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const uid = userCredential.user.uid;

    // Step 2: Parse address if provided
    const addressParts = parseAddress(userData.address);

    // Step 3: Parse dateJoined if provided
    let createdAt: Timestamp | undefined;
    if (userData.dateJoined) {
      const date = new Date(userData.dateJoined);
      if (!isNaN(date.getTime())) {
        createdAt = Timestamp.fromDate(date);
      }
    }

    // Step 4: Save to Firestore collection 'users'
    const userRef = doc(firestore, "users", uid);
    const now = Timestamp.now();
    
    await setDoc(userRef, {
      uid: uid,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || null,
      address: addressParts.address || null,
      city: addressParts.city || null,
      state: addressParts.state || null,
      zipCode: addressParts.zipCode || null,
      membershipTier: mapTierToFirestore(userData.tier),
      isActive: userData.status === "active", // Store status as isActive boolean
      status: userData.status, // Also store as status string for compatibility
      createdAt: createdAt || now,
      updatedAt: now,
      documentsCompleted: false,
      // Note: Password is stored only in Firebase Auth, not in Firestore
    });

    console.log("User created successfully:", uid);
    return uid;
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.code === "auth/email-already-in-use") {
      throw new Error("An account already exists with this email address.");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address.");
    } else if (error.code === "auth/weak-password") {
      throw new Error("Password should be at least 6 characters.");
    }
    throw new Error(error.message || "Failed to create user");
  }
};

/**
 * Update user in Firestore
 */
export interface UpdateUserData {
  name?: string;
  email?: string;
  tier?: UserTier;
  status?: UserStatus;
  phone?: string;
  address?: string;
  dateJoined?: string;
  lastActivity?: string;
}

export const updateUser = async (
  userId: string,
  updates: UpdateUserData
): Promise<void> => {
  try {
    const userRef = doc(firestore, "users", userId);
    
    // Build update object
    const firestoreUpdates: Record<string, any> = {
      updatedAt: Timestamp.now(),
    };

    // Map fields from frontend to Firestore
    if (updates.name !== undefined) {
      firestoreUpdates.name = updates.name;
    }
    if (updates.email !== undefined) {
      firestoreUpdates.email = updates.email;
      // Note: Changing email in Firebase Auth requires re-authentication
      // This only updates the Firestore document
    }
    if (updates.phone !== undefined) {
      firestoreUpdates.phone = updates.phone || null;
    }
    if (updates.tier !== undefined) {
      firestoreUpdates.membershipTier = mapTierToFirestore(updates.tier);
    }
    if (updates.status !== undefined) {
      // Store status as both isActive boolean and status string
      firestoreUpdates.isActive = updates.status === "active";
      firestoreUpdates.status = updates.status;
    }
    
    // Parse address if provided
    if (updates.address !== undefined) {
      const addressParts = parseAddress(updates.address);
      firestoreUpdates.address = addressParts.address || null;
      firestoreUpdates.city = addressParts.city || null;
      firestoreUpdates.state = addressParts.state || null;
      firestoreUpdates.zipCode = addressParts.zipCode || null;
    }

    // Parse dates if provided
    if (updates.dateJoined !== undefined && updates.dateJoined) {
      const date = new Date(updates.dateJoined);
      if (!isNaN(date.getTime())) {
        firestoreUpdates.createdAt = Timestamp.fromDate(date);
      }
    }
    if (updates.lastActivity !== undefined && updates.lastActivity) {
      const date = new Date(updates.lastActivity);
      if (!isNaN(date.getTime())) {
        firestoreUpdates.updatedAt = Timestamp.fromDate(date);
      }
    }

    await updateDoc(userRef, firestoreUpdates);
    console.log("User updated successfully:", userId);
  } catch (error: any) {
    console.error("Error updating user:", error);
    throw new Error(error.message || "Failed to update user");
  }
};

/**
 * Get single user by ID with full document data
 */
export interface UserDetails extends User {
  // Additional fields from Firestore
  drivingLicenseUrl?: string;
  creditReportUrl?: string;
  documentsCompleted?: boolean;
  creditReportAnalysis?: any;
  scores?: {
    equifax?: { currentScore?: number; startingScore?: number; lastUpdated?: Date };
    experian?: { currentScore?: number; startingScore?: number; lastUpdated?: Date };
    transunion?: { currentScore?: number; startingScore?: number; lastUpdated?: Date };
  };
}

export const getUserById = async (userId: string): Promise<UserDetails | null> => {
  try {
    const userRef = doc(firestore, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }

    const data = userSnap.data();
    
    // Map to User type first
    const baseUser = mapFirestoreUserToUser(userSnap as QueryDocumentSnapshot<DocumentData>);
    
    // Add additional fields
    const userDetails: UserDetails = {
      ...baseUser,
      drivingLicenseUrl: data.drivingLicenseUrl || undefined,
      creditReportUrl: data.creditReportUrl || undefined,
      documentsCompleted: data.documentsCompleted || false,
      creditReportAnalysis: data.creditReportAnalysis || undefined,
      scores: data.scores ? {
        equifax: data.scores.equifax ? {
          currentScore: data.scores.equifax.currentScore,
          startingScore: data.scores.equifax.startingScore,
          lastUpdated: data.scores.equifax.lastUpdated?.toDate?.() || undefined,
        } : undefined,
        experian: data.scores.experian ? {
          currentScore: data.scores.experian.currentScore,
          startingScore: data.scores.experian.startingScore,
          lastUpdated: data.scores.experian.lastUpdated?.toDate?.() || undefined,
        } : undefined,
        transunion: data.scores.transunion ? {
          currentScore: data.scores.transunion.currentScore,
          startingScore: data.scores.transunion.startingScore,
          lastUpdated: data.scores.transunion.lastUpdated?.toDate?.() || undefined,
        } : undefined,
      } : undefined,
    };

    return userDetails;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
};

