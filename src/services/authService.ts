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
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import type { Timestamp as TimestampType } from "firebase/firestore";
import { auth, firestore } from "../config/firebase";

/**
 * Admin user role types
 */
export type AdminRole = "superadmin" | "support";

/**
 * Notification preferences (email and in-app)
 */
export interface NotificationPreferences {
  email: {
    securityAlerts: boolean;
    systemAnnouncements: boolean;
    supportActivity: boolean;
  };
  inApp: {
    securityAlerts: boolean;
    systemAnnouncements: boolean;
    supportActivity: boolean;
  };
}

/**
 * Email & Dashboard alert preferences (System Failure, New User Registration, API Error)
 */
export interface DashboardAlertsPreferences {
  systemFailure: boolean;
  newUserRegistration: boolean;
  apiError: boolean;
}

/**
 * 2FA metadata stored in Firestore (custom email OTP implementation)
 */
export interface TwoFactorSettings {
  enabled: boolean;
  method: "sms" | "totp" | "email" | "none";
  phoneNumber?: string;
  emailAddress?: string;
  lastVerifiedAt?: TimestampType;
}

/**
 * Admin user data structure stored in Firestore
 */
export interface AdminUserData {
  email: string;
  role: AdminRole;
  displayName?: string;
  createdAt: TimestampType;
  updatedAt: TimestampType;
  isActive: boolean;
  notificationPreferences: NotificationPreferences;
  dashboardAlerts: DashboardAlertsPreferences;
  twoFactor: TwoFactorSettings;
}

const VALID_ROLES: AdminRole[] = ["superadmin", "support"];

function getDefaultNotificationPreferences(): NotificationPreferences {
  return {
    email: {
      securityAlerts: true,
      systemAnnouncements: true,
      supportActivity: true,
    },
    inApp: {
      securityAlerts: true,
      systemAnnouncements: true,
      supportActivity: true,
    },
  };
}

function getDefaultDashboardAlerts(): DashboardAlertsPreferences {
  return {
    systemFailure: true,
    newUserRegistration: true,
    apiError: true,
  };
}

function getDefaultTwoFactor(): TwoFactorSettings {
  return {
    enabled: false,
    method: "none",
  };
}

/**
 * Normalizes raw Firestore data into AdminUserData with safe defaults and valid role.
 */
export function normalizeAdminUserData(raw: Record<string, unknown>): AdminUserData {
  const role = VALID_ROLES.includes(raw.role as AdminRole) ? (raw.role as AdminRole) : "superadmin";
  const email = typeof raw.email === "string" ? raw.email : "";
  const isActive = raw.isActive === true;
  const displayName = typeof raw.displayName === "string" ? raw.displayName : undefined;
  const createdAt = (raw.createdAt as TimestampType) ?? Timestamp.now();
  const updatedAt = (raw.updatedAt as TimestampType) ?? Timestamp.now();

  const np = raw.notificationPreferences as Partial<NotificationPreferences> | undefined;
  const emailPrefs = np?.email;
  const inAppPrefs = np?.inApp;
  const defaultPrefs = getDefaultNotificationPreferences();
  const notificationPreferences: NotificationPreferences = {
    email: {
      securityAlerts: emailPrefs?.securityAlerts ?? defaultPrefs.email.securityAlerts,
      systemAnnouncements: emailPrefs?.systemAnnouncements ?? defaultPrefs.email.systemAnnouncements,
      supportActivity: emailPrefs?.supportActivity ?? defaultPrefs.email.supportActivity,
    },
    inApp: {
      securityAlerts: inAppPrefs?.securityAlerts ?? defaultPrefs.inApp.securityAlerts,
      systemAnnouncements: inAppPrefs?.systemAnnouncements ?? defaultPrefs.inApp.systemAnnouncements,
      supportActivity: inAppPrefs?.supportActivity ?? defaultPrefs.inApp.supportActivity,
    },
  };

  const da = raw.dashboardAlerts as Partial<DashboardAlertsPreferences> | undefined;
  const defaultAlerts = getDefaultDashboardAlerts();
  const dashboardAlerts: DashboardAlertsPreferences = {
    systemFailure: da?.systemFailure ?? defaultAlerts.systemFailure,
    newUserRegistration: da?.newUserRegistration ?? defaultAlerts.newUserRegistration,
    apiError: da?.apiError ?? defaultAlerts.apiError,
  };

  const tf = raw.twoFactor as Partial<TwoFactorSettings> | undefined;
  const defaultTwoFactor = getDefaultTwoFactor();
  const twoFactor: TwoFactorSettings = {
    enabled: tf?.enabled === true,
    method: tf?.method === "sms" || tf?.method === "totp" || tf?.method === "email" ? tf.method : defaultTwoFactor.method,
    phoneNumber: typeof tf?.phoneNumber === "string" ? tf.phoneNumber : undefined,
    emailAddress: typeof tf?.emailAddress === "string" ? tf.emailAddress : undefined,
    lastVerifiedAt: tf?.lastVerifiedAt as TimestampType | undefined,
  };

  return {
    email,
    role,
    displayName,
    isActive,
    createdAt,
    updatedAt,
    notificationPreferences,
    dashboardAlerts,
    twoFactor,
  };
}

// Signup functionality removed - Admin users are created manually in Firebase Console
// and added to Firestore adminUsers collection directly

/**
 * Login an existing admin user.
 * Role and profile come from the adminUsers Firestore document, not from input.
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with user and user data from Firestore
 * @throws Error if login fails or admin account is not configured/inactive
 */
export const login = async (
  email: string,
  password: string
): Promise<{ user: User; userData: AdminUserData }> => {
  try {
    if (!email || !email.includes("@")) {
      throw new Error("Please provide a valid email address");
    }
    if (!password) {
      throw new Error("Please enter your password");
    }

    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );
    const user = userCredential.user;

    const userDocRef = doc(firestore, "adminUsers", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error("Your admin account is not configured. Please contact support.");
    }

    const userData = normalizeAdminUserData(userDoc.data() as Record<string, unknown>);

    if (!userData.isActive) {
      await signOut(auth);
      throw new Error("Your account has been deactivated. Please contact support.");
    }

    console.log("✅ User logged in successfully:", user.uid);
    return { user, userData };
  } catch (error: unknown) {
    console.error("❌ Login error:", error);
    const err = error as { code?: string; message?: string };
    if (err.code === "auth/user-not-found") {
      throw new Error("No account found with this email address.");
    } else if (err.code === "auth/wrong-password") {
      throw new Error("Incorrect password. Please try again.");
    } else if (err.code === "auth/invalid-email") {
      throw new Error("Invalid email address format.");
    } else if (err.code === "auth/user-disabled") {
      throw new Error("This account has been disabled. Please contact support.");
    } else if (err.code === "auth/too-many-requests") {
      throw new Error("Too many failed login attempts. Please try again later.");
    } else if (err.message) {
      throw new Error(err.message);
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
    return normalizeAdminUserData(userDoc.data() as Record<string, unknown>);
  } catch (error) {
    console.error("❌ Error getting admin user data:", error);
    return null;
  }
};

/**
 * Update admin user profile in Firestore (e.g. notification preferences, 2FA settings).
 * Only non-sensitive fields should be updated via this method.
 *
 * @param userId - Firebase Auth user ID
 * @param patch - Partial admin data to merge
 */
export const updateAdminUserProfile = async (
  userId: string,
  patch: Partial<Pick<AdminUserData, "displayName" | "notificationPreferences" | "dashboardAlerts" | "twoFactor">>
): Promise<void> => {
  const userDocRef = doc(firestore, "adminUsers", userId);
  const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.displayName !== undefined) updateData.displayName = patch.displayName;
  if (patch.notificationPreferences !== undefined) {
    updateData.notificationPreferences = patch.notificationPreferences;
  }
  if (patch.dashboardAlerts !== undefined) {
    updateData.dashboardAlerts = patch.dashboardAlerts;
  }
  if (patch.twoFactor !== undefined) {
    updateData.twoFactor = patch.twoFactor;
  }
  await updateDoc(userDocRef, updateData as Record<string, unknown>);
};

