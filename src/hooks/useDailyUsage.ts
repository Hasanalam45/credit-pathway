/**
 * Custom hook for fetching daily usage/engagement data
 */

import { useState, useEffect } from "react";
import { getDailyActiveUsers } from "../services/dashboardService";
import type { DailyUsagePoint } from "../services/dashboardService";
import type { DateRange } from "../pages/dashboard/DashboardPage";

interface UseDailyUsageReturn {
  data: DailyUsagePoint[];
  total: number;
  percentageChange: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage daily usage data for charts
 */
export const useDailyUsage = (dateRange: DateRange): UseDailyUsageReturn => {
  const [data, setData] = useState<DailyUsagePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dailyData = await getDailyActiveUsers(dateRange);
      setData(dailyData);
    } catch (err: any) {
      console.error("Error fetching daily usage data:", err);
      setError(err.message || "Failed to load usage data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  // Calculate total and percentage change
  const total = data.reduce((sum, point) => sum + point.value, 0);
  
  // Calculate percentage change (compare first half vs second half of period)
  const midPoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midPoint).reduce((sum, point) => sum + point.value, 0);
  const secondHalf = data.slice(midPoint).reduce((sum, point) => sum + point.value, 0);
  
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Number(((current - previous) / previous) * 100);
  };
  
  const percentageChange = firstHalf > 0 
    ? calculatePercentageChange(secondHalf, firstHalf)
    : 0;

  return {
    data,
    total,
    percentageChange,
    loading,
    error,
    refresh: fetchData,
  };
};

