/**
 * Custom hook for fetching and managing support issues
 */

import { useState, useEffect, useCallback } from "react";
import { getSupportIssues } from "../services/supportService";
import type { IssueRow } from "../services/supportService";
import type { DateRange } from "../pages/dashboard/DashboardPage";

interface UseSupportIssuesReturn {
  issues: IssueRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage support issues
 * @param dateRange - Optional date range to filter issues
 */
export const useSupportIssues = (dateRange?: DateRange): UseSupportIssuesReturn => {
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupportIssues(dateRange);
      setIssues(data);
    } catch (err: any) {
      console.error("Error fetching support issues:", err);
      setError(err.message || "Failed to load support issues");
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  return {
    issues,
    loading,
    error,
    refetch: fetchIssues,
  };
};

