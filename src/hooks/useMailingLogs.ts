/**
 * Custom hook for fetching and managing mailing logs
 */

import { useState, useEffect, useCallback } from "react";
import { getMailingLogs } from "../services/mailingService";
import type { MailLog } from "../services/mailingService";
import type { DateRange } from "../pages/dashboard/DashboardPage";

interface UseMailingLogsReturn {
  logs: MailLog[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage mailing logs
 * @param dateRange - Optional date range to filter logs
 */
export const useMailingLogs = (dateRange?: DateRange): UseMailingLogsReturn => {
  const [logs, setLogs] = useState<MailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMailingLogs(dateRange);
      setLogs(data);
    } catch (err: any) {
      console.error("Error fetching mailing logs:", err);
      setError(err.message || "Failed to load mailing logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
  };
};

