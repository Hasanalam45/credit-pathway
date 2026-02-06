/**
 * Custom hook for fetching system engagement data
 */

import { useState, useEffect } from "react";
import { getSystemEngagement } from "../services/analyticsService";
import type { AnalyticsRange } from "../pages/analytics/AnalyticsPage";
import type { SystemEngagement } from "../services/analyticsService";

interface UseSystemEngagementReturn {
  data: SystemEngagement | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage system engagement data
 */
export const useSystemEngagement = (
  range: AnalyticsRange,
  customStartDate?: string,
  customEndDate?: string
): UseSystemEngagementReturn => {
  const [data, setData] = useState<SystemEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getSystemEngagement(range, customStartDate, customEndDate);
      setData(result);
    } catch (err: any) {
      console.error("Error fetching system engagement:", err);
      setError(err.message || "Failed to load system engagement");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, customStartDate, customEndDate]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
};

