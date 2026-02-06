/**
 * Custom hook for fetching and managing education content (videos)
 */

import { useState, useEffect, useCallback } from "react";
import { getEducationContent } from "../services/educationContentService";
import type { ContentItem } from "../components/content/ContentTable";

interface UseEducationContentReturn {
  videos: ContentItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage education content (videos)
 */
export const useEducationContent = (): UseEducationContentReturn => {
  const [videos, setVideos] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEducationContent();
      setVideos(data);
    } catch (err: any) {
      console.error("Error fetching education content:", err);
      setError(err.message || "Failed to load videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos,
  };
};

