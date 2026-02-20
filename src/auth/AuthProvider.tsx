import React from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { auth } from "../config/firebase";
import { login as loginService, logout as logoutService, getAdminUserData, updateAdminUserProfile } from "../services/authService";
import type { AdminUserData } from "../services/authService";
import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebase";

/**
 * Combined user type with Firebase User and Admin data
 */
export type AppUser = {
  firebaseUser: FirebaseUser;
  adminData: AdminUserData;
};

/**
 * Pending 2FA state - user is authenticated but needs to verify OTP
 */
export type Pending2FA = {
  firebaseUser: FirebaseUser;
  adminData: AdminUserData;
};

type AuthContextValue = {
  user: AppUser | null;
  pending2FA: Pending2FA | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AdminUserData>;
  getUserData: (userId: string) => Promise<AdminUserData | null>;
  completeLogin: (firebaseUser: FirebaseUser, adminData: AdminUserData) => Promise<void>;
  completeTwoFactor: (code: string) => Promise<void>;
  requestTwoFactorCode: () => Promise<{ email: string }>;
  updateProfile: (patch: Partial<AdminUserData>) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = React.useState<AppUser | null>(null);
  const [pending2FA, setPending2FA] = React.useState<Pending2FA | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Listen to Firebase Auth state changes
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const adminData = await getAdminUserData(firebaseUser.uid);
          if (!adminData) {
            setUser(null);
            setPending2FA(null);
            await logoutService();
          } else if (!adminData.isActive) {
            setUser(null);
            setPending2FA(null);
            await logoutService();
          } else if (adminData.twoFactor?.enabled && adminData.twoFactor?.method === "email") {
            setPending2FA({ firebaseUser, adminData });
            setUser(null);
          } else {
            setUser({ firebaseUser, adminData });
            setPending2FA(null);
          }
        } catch (error) {
          console.error("Error fetching admin user data:", error);
          setUser(null);
          setPending2FA(null);
          await logoutService();
        }
      } else {
        setUser(null);
        setPending2FA(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { user: firebaseUser, userData } = await loginService(email, password);
    // 2FA disabled for now - always complete login (comment out to re-enable 2FA)
    // if (userData.twoFactor?.enabled && userData.twoFactor?.method === "email") {
    //   setPending2FA({ firebaseUser, adminData: userData });
    //   setUser(null);
    //   try {
    //     const requestOtp = httpsCallable(functions, "requestEmailOtp");
    //     await requestOtp();
    //   } catch (error) { console.error("Error requesting OTP:", error); }
    // } else {
    setUser({ firebaseUser, adminData: userData });
    setPending2FA(null);
    // }
    return userData;
  };

  const getUserData = async (userId: string) => {
    return await getAdminUserData(userId);
  };

  const completeLogin = async (firebaseUser: FirebaseUser, adminData: AdminUserData) => {
    setUser({ firebaseUser, adminData });
    setPending2FA(null);
  };

  const completeTwoFactor = async (code: string) => {
    if (!pending2FA) {
      throw new Error("No pending 2FA verification");
    }

    try {
      const verifyOtp = httpsCallable(functions, "verifyEmailOtp");
      await verifyOtp({ code });

      // Success - promote pending2FA to user
      setUser(pending2FA);
      setPending2FA(null);
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      throw new Error(error.message || "Failed to verify code");
    }
  };

  const requestTwoFactorCode = async () => {
    if (!pending2FA) {
      throw new Error("No pending 2FA verification");
    }

    try {
      const requestOtp = httpsCallable<void, { success: boolean; email: string }>(functions, "requestEmailOtp");
      const result = await requestOtp();
      return { email: result.data.email };
    } catch (error: any) {
      console.error("Error requesting OTP:", error);
      throw new Error(error.message || "Failed to send verification code");
    }
  };

  const updateProfile = async (patch: Partial<AdminUserData>) => {
    if (!user) {
      throw new Error("No user logged in");
    }
    const allowedPatch = {
      displayName: patch.displayName,
      notificationPreferences: patch.notificationPreferences,
      dashboardAlerts: patch.dashboardAlerts,
      twoFactor: patch.twoFactor,
    };
    if (
      allowedPatch.displayName !== undefined ||
      allowedPatch.notificationPreferences !== undefined ||
      allowedPatch.dashboardAlerts !== undefined ||
      allowedPatch.twoFactor !== undefined
    ) {
      await updateAdminUserProfile(user.firebaseUser.uid, allowedPatch);
    }
    setUser({
      ...user,
      adminData: { ...user.adminData, ...patch },
    });
  };

  const logout = async () => {
    try {
      await logoutService();
      setUser(null);
      setPending2FA(null);
    } catch (error: any) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const value = React.useMemo(
    () => ({ user, pending2FA, loading, login, getUserData, completeLogin, completeTwoFactor, requestTwoFactorCode, updateProfile, logout }),
    [user, pending2FA, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

export default AuthProvider;
