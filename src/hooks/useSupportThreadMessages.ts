/**
 * Custom hook for fetching and sending messages for a support thread
 */

import { useState, useEffect, useCallback } from "react";
import {
  getSupportThreadMessages,
  sendAdminReply,
} from "../services/supportTicketsService";
import type { TicketMessage } from "../services/supportTicketsService";

interface UseSupportThreadMessagesReturn {
  messages: TicketMessage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  sendReply: (text: string) => Promise<void>;
}

/**
 * Hook to fetch and send messages for a specific support thread
 */
export const useSupportThreadMessages = (
  threadId: string | null
): UseSupportThreadMessagesReturn => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!threadId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getSupportThreadMessages(threadId);
      setMessages(data);
    } catch (err: any) {
      console.error("Error fetching thread messages:", err);
      setError(err.message || "Failed to load messages");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSendReply = useCallback(
    async (text: string) => {
      if (!threadId || !text.trim()) {
        return;
      }

      try {
        setError(null);
        await sendAdminReply(threadId, text);
        // Refresh messages after sending
        await fetchMessages();
      } catch (err: any) {
        console.error("Error sending reply:", err);
        setError(err.message || "Failed to send reply");
        throw err;
      }
    },
    [threadId, fetchMessages]
  );

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
    sendReply: handleSendReply,
  };
};

