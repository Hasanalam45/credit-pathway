/**
 * Custom hook for fetching and managing articles
 */

import { useState, useEffect, useCallback } from "react";
import { getArticles } from "../services/articlesService";
import type { ContentItem } from "../components/content/ContentTable";

interface UseArticlesReturn {
  articles: ContentItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage articles
 */
export const useArticles = (): UseArticlesReturn => {
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getArticles();
      setArticles(data);
    } catch (err: any) {
      console.error("Error fetching articles:", err);
      setError(err.message || "Failed to load articles");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return {
    articles,
    loading,
    error,
    refetch: fetchArticles,
  };
};

