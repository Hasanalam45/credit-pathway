/**
 * Custom hook for fetching top articles data
 */

import { useState, useEffect } from "react";
import { getTopArticles } from "../services/analyticsService";
import type { AnalyticsRange } from "../pages/analytics/AnalyticsPage";
import type { TopArticle } from "../services/analyticsService";

interface UseTopArticlesReturn {
  data: TopArticle[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage top articles data
 */
export const useTopArticles = (
  range: AnalyticsRange,
  customStartDate?: string,
  customEndDate?: string
): UseTopArticlesReturn => {
  const [data, setData] = useState<TopArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTopArticles(range, customStartDate, customEndDate);
      setData(result);
    } catch (err: any) {
      console.error("Error fetching top articles:", err);
      setError(err.message || "Failed to load top articles");
      setData([]);
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

