/**
 * useLessons Hook
 * 
 * Custom React hook for fetching lessons from Firestore.
 * Provides loading, error states, and refetch functionality.
 */

import { useState, useEffect, useCallback } from "react";
import { getLessons } from "../services/lessonsService";
import type { ContentItem } from "../components/content/ContentTable";

interface UseLessonsReturn {
  lessons: ContentItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage lessons from Firestore
 */
export const useLessons = (): UseLessonsReturn => {
  const [lessons, setLessons] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedLessons = await getLessons();
      setLessons(fetchedLessons);
      
      console.log(`Fetched ${fetchedLessons.length} lessons from Firestore`);
    } catch (err: any) {
      console.error("Error fetching lessons:", err);
      setError(err.message || "Failed to fetch lessons");
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  return {
    lessons,
    loading,
    error,
    refetch: fetchLessons,
  };
};
