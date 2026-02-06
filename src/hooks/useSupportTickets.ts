/**
 * Custom hook for fetching and managing support tickets
 */

import { useState, useEffect, useCallback } from "react";
import { getSupportTickets } from "../services/supportTicketsService";
import type { SupportTicket } from "../components/support/SupportTicketsTable";
import type { DateRange } from "../pages/dashboard/DashboardPage";

interface UseSupportTicketsReturn {
  tickets: SupportTicket[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch support tickets with date range filtering
 */
export const useSupportTickets = (
  dateRange: DateRange
): UseSupportTicketsReturn => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupportTickets(dateRange);
      setTickets(data);
    } catch (err: any) {
      console.error("Error fetching support tickets:", err);
      setError(err.message || "Failed to load support tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets,
  };
};

