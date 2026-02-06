/**
 * Custom hook for fetching membership distribution data
 */

import { useState, useEffect } from "react";
import { getMembershipDistribution } from "../services/analyticsService";
import type { MembershipDistributionPoint } from "../services/analyticsService";

interface UseMembershipDistributionReturn {
  data: MembershipDistributionPoint[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage membership distribution data
 */
export const useMembershipDistribution = (): UseMembershipDistributionReturn => {
  const [data, setData] = useState<MembershipDistributionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getMembershipDistribution();
      setData(result);
    } catch (err: any) {
      console.error("Error fetching membership distribution:", err);
      setError(err.message || "Failed to load membership distribution");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
};

