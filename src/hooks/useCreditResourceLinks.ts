/**
 * useCreditResourceLinks Hook
 * 
 * Custom React hook for fetching credit resource links from Firestore.
 * Provides loading, error states, and refetch functionality.
 */

import { useState, useEffect, useCallback } from "react";
import { getCreditResourceLinks } from "../services/creditResourceLinksService";
import type { ContentItem } from "../components/content/ContentTable";

interface UseCreditResourceLinksReturn {
  links: ContentItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage credit resource links from Firestore
 */
export const useCreditResourceLinks = (): UseCreditResourceLinksReturn => {
  const [links, setLinks] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedLinks = await getCreditResourceLinks();
      setLinks(fetchedLinks);
      
      console.log(`Fetched ${fetchedLinks.length} credit resource links from Firestore`);
    } catch (err: any) {
      console.error("Error fetching credit resource links:", err);
      setError(err.message || "Failed to fetch credit resource links");
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return {
    links,
    loading,
    error,
    refetch: fetchLinks,
  };
};
