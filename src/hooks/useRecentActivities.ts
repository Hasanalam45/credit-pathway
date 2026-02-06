/**
 * Custom hook for fetching recent activities
 */

import { useState, useEffect } from "react";
import { getRecentActivities } from "../services/dashboardService";
import type { ActivityItem } from "../services/dashboardService";
import type { DateRange } from "../pages/dashboard/DashboardPage";

interface UseRecentActivitiesReturn {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage recent activities
 */
export const useRecentActivities = (
  dateRange: DateRange,
  limit: number = 10
): UseRecentActivitiesReturn => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecentActivities(dateRange, limit);
      setActivities(data);
    } catch (err: any) {
      console.error("Error fetching recent activities:", err);
      setError(err.message || "Failed to load recent activities");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, dateRange]);

  return {
    activities,
    loading,
    error,
    refresh: fetchActivities,
  };
};

