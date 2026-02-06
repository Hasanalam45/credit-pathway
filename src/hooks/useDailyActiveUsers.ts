/**
 * Custom hook for fetching daily active users data
 */

import { useState, useEffect } from "react";
import { getDailyActiveUsers } from "../services/analyticsService";
import type { AnalyticsRange } from "../pages/analytics/AnalyticsPage";
import type { DailyActiveUsersPoint } from "../services/analyticsService";

interface UseDailyActiveUsersReturn {
  data: DailyActiveUsersPoint[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  value: string; // Last value formatted
  change: number; // Percentage change
}

/**
 * Hook to fetch and manage daily active users data
 */
export const useDailyActiveUsers = (
  range: AnalyticsRange,
  customStartDate?: string,
  customEndDate?: string
): UseDailyActiveUsersReturn => {
  const [data, setData] = useState<DailyActiveUsersPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getDailyActiveUsers(range, customStartDate, customEndDate);
      setData(result);
    } catch (err: any) {
      console.error("Error fetching daily active users:", err);
      setError(err.message || "Failed to load daily active users");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, customStartDate, customEndDate]);

  // Calculate total active users in the period and change
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const value = total.toLocaleString(); // Show total active users in the period
  
  // Calculate change: compare total of last half vs first half of period
  const midPoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midPoint).reduce((sum, point) => sum + point.value, 0);
  const secondHalf = data.slice(midPoint).reduce((sum, point) => sum + point.value, 0);
  const change = firstHalf > 0 
    ? Math.round(((secondHalf - firstHalf) / firstHalf) * 1000) / 10 
    : (secondHalf > 0 ? 100 : 0);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    value,
    change,
  };
};

