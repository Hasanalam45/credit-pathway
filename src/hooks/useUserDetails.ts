/**
 * Custom hook for fetching single user details with full data
 */

import { useState, useEffect } from "react";
import { getUserById, type UserDetails } from "../services/userService";

interface UseUserDetailsReturn {
  user: UserDetails | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage single user details with credit data
 */
export const useUserDetails = (userId: string | null): UseUserDetailsReturn => {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userData = await getUserById(userId);
      setUser(userData);
    } catch (err: any) {
      console.error("Error fetching user details:", err);
      setError(err.message || "Failed to load user details");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    user,
    loading,
    error,
    refresh: fetchUser,
  };
};

