/**
 * Firebase Authentication Service
 * 
 * Handles all authentication operations including:
 * - User login
 * - User logout
 * - Password reset
 * - Role management
 * 
 * Note: Admin users are created manually in Firebase Console and Firestore.
 * Signup functionality is not available in the admin panel.
 */

import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import type { User, UserCredential } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "../config/firebase";

/**
 * Admin user role types
 */
export type AdminRole = "superadmin" | "support";

/**
 * Admin user data structure stored in Firestore
 */
export interface AdminUserData {
  email: string;
  role: AdminRole;
  displayName?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  isActive: boolean;
}

// Signup functionality removed - Admin users are created manually in Firebase Console
// and added to Firestore adminUsers collection directly

/**
 * Login an existing admin user
 * 
 * @param email - User's email address
 * @param password - User's password
 * @param role - User's role (superadmin or support) - TEMPORARY: hardcoded for testing
 * @returns Promise with user and user data from Firestore
 * @throws Error if login fails
 */
export const login = async (
  email: string,
  password: string,
  role: AdminRole = "superadmin"
): Promise<{ user: User; userData: AdminUserData }> => {
  try {
    // Validate inputs
    if (!email || !email.includes("@")) {
      throw new Error("Please provide a valid email address");
    }

    if (!password) {
      throw new Error("Please enter your password");
    }

    // Sign in with Firebase Auth
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );

    const user = userCredential.user;

    // TEMPORARY: Hardcoded role for testing - will be removed later
    // TODO: Replace with actual Firestore lookup
    const userData: AdminUserData = {
      email: user.email || email.trim().toLowerCase(),
      role: role, // Use role from dropdown selection
      displayName: user.displayName || undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("⚠️ Using hardcoded role for testing. User:", user.email, "Role:", role);

    // TODO: Uncomment below code when Firestore adminUsers collection is set up
    /*
    // Get user data from Firestore
    const userDocRef = doc(firestore, "adminUsers", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // User exists in Auth but not in Firestore
      console.error("❌ User exists in Auth but not in Firestore adminUsers collection");
      console.error("User UID:", user.uid);
      console.error("User Email:", user.email);
      console.error("Please create a document in Firestore:");
      console.error(`Collection: adminUsers`);
      console.error(`Document ID: ${user.uid}`);
      console.error(`Required fields: email, role, isActive, createdAt, updatedAt`);
      throw new Error(
        `User account not found in database. Please add user to Firestore adminUsers collection with UID: ${user.uid}`
      );
    }

    const userData = userDoc.data() as AdminUserData;

    // Check if user is active
    if (!userData.isActive) {
      await signOut(auth);
      throw new Error("Your account has been deactivated. Please contact support.");
    }
    */

    console.log("✅ User logged in successfully:", user.uid);

    return {
      user,
      userData,
    };
  } catch (error: any) {
    console.error("❌ Login error:", error);

    // Handle specific Firebase errors
    if (error.code === "auth/user-not-found") {
      throw new Error("No account found with this email address.");
    } else if (error.code === "auth/wrong-password") {
      throw new Error("Incorrect password. Please try again.");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address format.");
    } else if (error.code === "auth/user-disabled") {
      throw new Error("This account has been disabled. Please contact support.");
    } else if (error.code === "auth/too-many-requests") {
      throw new Error("Too many failed login attempts. Please try again later.");
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error("Login failed. Please check your credentials and try again.");
    }
  }
};

/**
 * Logout the current user
 * 
 * @returns Promise that resolves when logout is complete
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log("✅ User logged out successfully");
  } catch (error: any) {
    console.error("❌ Logout error:", error);
    throw new Error("Logout failed. Please try again.");
  }
};

/**
 * Send password reset email
 * 
 * @param email - User's email address
 * @returns Promise that resolves when email is sent
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    if (!email || !email.includes("@")) {
      throw new Error("Please provide a valid email address");
    }

    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    console.log("✅ Password reset email sent");
  } catch (error: any) {
    console.error("❌ Password reset error:", error);

    if (error.code === "auth/user-not-found") {
      throw new Error("No account found with this email address.");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address format.");
    } else {
      throw new Error("Failed to send password reset email. Please try again.");
    }
  }
};

/**
 * Get current user's admin data from Firestore
 * 
 * @param userId - Firebase Auth user ID
 * @returns Promise with user data or null if not found
 */
export const getAdminUserData = async (
  userId: string
): Promise<AdminUserData | null> => {
  try {
    const userDocRef = doc(firestore, "adminUsers", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data() as AdminUserData;
  } catch (error) {
    console.error("❌ Error getting admin user data:", error);
    return null;
  }
};

