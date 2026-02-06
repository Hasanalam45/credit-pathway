/**
 * Custom hook for fetching and managing user journeys
 */

import { useState, useEffect, useCallback } from "react";
import { getUserJourneys } from "../services/userJourneyService";
import type { UserJourney } from "../components/reports/UserJourneyTable";
import type { DateRange } from "../pages/dashboard/DashboardPage";

interface UseUserJourneysReturn {
  journeys: UserJourney[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage user journeys
 * @param dateRange - Optional date range to filter users by their activity
 */
export const useUserJourneys = (dateRange?: DateRange): UseUserJourneysReturn => {
  const [journeys, setJourneys] = useState<UserJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJourneys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserJourneys(dateRange);
      setJourneys(data);
    } catch (err: any) {
      console.error("Error fetching user journeys:", err);
      setError(err.message || "Failed to load user journeys");
      setJourneys([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

  return {
    journeys,
    loading,
    error,
    refetch: fetchJourneys,
  };
};

