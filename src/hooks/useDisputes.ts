/**
 * Custom hook for fetching and managing disputes
 */

import { useState, useEffect, useCallback } from "react";
import { getDisputes } from "../services/disputesService";
import type { DisputeRow } from "../services/disputesService";
import type { DateRange } from "../pages/dashboard/DashboardPage";

interface UseDisputesReturn {
  disputes: DisputeRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage disputes
 * @param dateRange - Optional date range to filter disputes
 */
export const useDisputes = (dateRange?: DateRange): UseDisputesReturn => {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDisputes(dateRange);
      setDisputes(data);
    } catch (err: any) {
      console.error("Error fetching disputes:", err);
      setError(err.message || "Failed to load disputes");
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  return {
    disputes,
    loading,
    error,
    refetch: fetchDisputes,
  };
};

