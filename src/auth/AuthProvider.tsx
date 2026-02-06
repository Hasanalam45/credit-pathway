import React from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { auth } from "../config/firebase";
import { login as loginService, logout as logoutService, getAdminUserData } from "../services/authService";
import type { AdminUserData, AdminRole } from "../services/authService";

/**
 * Combined user type with Firebase User and Admin data
 */
export type AppUser = {
  firebaseUser: FirebaseUser;
  adminData: AdminUserData;
};

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string, role?: AdminRole) => Promise<void>;
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
  const [loading, setLoading] = React.useState(true);

  // Listen to Firebase Auth state changes
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, get their admin data
        try {
          const adminData = await getAdminUserData(firebaseUser.uid);
          
          // TEMPORARY: If no admin data found, use hardcoded role for testing
          if (!adminData) {
            console.warn("⚠️ No admin data in Firestore, using hardcoded role for testing");
            const hardcodedAdminData: AdminUserData = {
              email: firebaseUser.email || "",
              role: "superadmin",
              displayName: firebaseUser.displayName || undefined,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setUser({
              firebaseUser,
              adminData: hardcodedAdminData,
            });
          } else if (adminData.isActive) {
            setUser({
              firebaseUser,
              adminData,
            });
          } else {
            // User exists in Auth but inactive
            console.warn("User account is inactive:", firebaseUser.uid);
            setUser(null);
            await logoutService();
          }
        } catch (error) {
          console.error("Error fetching admin user data:", error);
          // TEMPORARY: On error, use hardcoded role for testing
          const hardcodedAdminData: AdminUserData = {
            email: firebaseUser.email || "",
            role: "superadmin",
            displayName: firebaseUser.displayName || undefined,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setUser({
            firebaseUser,
            adminData: hardcodedAdminData,
          });
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, role: AdminRole = "superadmin") => {
    try {
      const { user: firebaseUser, userData } = await loginService(email, password, role);
      setUser({
        firebaseUser,
        adminData: userData,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const updateProfile = async (patch: Partial<AdminUserData>) => {
    if (!user) {
      throw new Error("No user logged in");
    }
    // TODO: Implement profile update in Firestore
    // For now, just update local state
    setUser({
      ...user,
      adminData: { ...user.adminData, ...patch },
    });
  };

  const logout = async () => {
    try {
      await logoutService();
      setUser(null);
    } catch (error: any) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const value = React.useMemo(
    () => ({ user, loading, login, updateProfile, logout }),
    [user, loading]
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
