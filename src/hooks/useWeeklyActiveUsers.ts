/**
 * Custom hook for fetching weekly active users data
 */

import { useState, useEffect } from "react";
import { getWeeklyActiveUsers } from "../services/analyticsService";
import type { AnalyticsRange } from "../pages/analytics/AnalyticsPage";
import type { WeeklyActiveUsersPoint } from "../services/analyticsService";

interface UseWeeklyActiveUsersReturn {
  data: WeeklyActiveUsersPoint[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  value: string; // Last value formatted
  change: number; // Percentage change
}

/**
 * Hook to fetch and manage weekly active users data
 */
export const useWeeklyActiveUsers = (
  range: AnalyticsRange,
  customStartDate?: string,
  customEndDate?: string
): UseWeeklyActiveUsersReturn => {
  const [data, setData] = useState<WeeklyActiveUsersPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getWeeklyActiveUsers(range, customStartDate, customEndDate);
      setData(result);
    } catch (err: any) {
      console.error("Error fetching weekly active users:", err);
      setError(err.message || "Failed to load weekly active users");
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

