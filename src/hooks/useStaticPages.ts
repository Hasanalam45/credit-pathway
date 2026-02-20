/**
 * useStaticPages Hook
 * 
 * Custom React hook for fetching static pages from Firestore.
 * Provides loading, error states, and refetch functionality.
 */

import { useState, useEffect, useCallback } from "react";
import { getStaticPages } from "../services/staticPagesService";
import type { ContentItem } from "../components/content/ContentTable";

interface UseStaticPagesReturn {
  staticPages: ContentItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage static pages from Firestore
 */
export const useStaticPages = (): UseStaticPagesReturn => {
  const [staticPages, setStaticPages] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaticPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedPages = await getStaticPages();
      setStaticPages(fetchedPages);
      
      console.log(`Fetched ${fetchedPages.length} static pages from Firestore`);
    } catch (err: any) {
      console.error("Error fetching static pages:", err);
      setError(err.message || "Failed to fetch static pages");
      setStaticPages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaticPages();
  }, [fetchStaticPages]);

  return {
    staticPages,
    loading,
    error,
    refetch: fetchStaticPages,
  };
};
