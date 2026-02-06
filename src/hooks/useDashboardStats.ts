/**
 * Custom hook for fetching dashboard statistics
 */

import { useState, useEffect } from "react";
import { getDashboardStats } from "../services/dashboardService";
import type { DashboardStats } from "../services/dashboardService";
import type { DateRange } from "../pages/dashboard/DashboardPage";

interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage dashboard statistics
 */
export const useDashboardStats = (dateRange: DateRange): UseDashboardStatsReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats(dateRange);
      setStats(data);
    } catch (err: any) {
      console.error("Error fetching dashboard stats:", err);
      setError(err.message || "Failed to load dashboard statistics");
      // Set default values on error to prevent UI breaking
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        membersByTier: { total: 0, byTier: {}, percentage: 0 },
        openDisputes: 0,
        lettersGenerated: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
};

/**
 * Format number with commas (e.g., 1420 -> "1,420")
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US");
};

/**
 * Calculate delta percentage for display
 */
export const getDeltaPercentage = (
  current: number,
  previous: number | undefined
): number => {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number(((current - previous) / previous) * 100);
};

