import React, { useState, useEffect } from "react";
import Modal from "../shared/overlay/Modal";
import TextInput from "../shared/inputs/TextInput";
import SelectFilter from "../shared/inputs/SelectFilter";
import Button from "../shared/buttons/Button";
import { useSupportThreadMessages } from "../../hooks/useSupportThreadMessages";
import type { TicketMessage } from "../../services/supportTicketsService";

export type TicketValues = {
  id?: string; // Thread ID (ticket ID)
  subject?: string;
  user?: string;
  status?: "open" | "pending" | "closed" | null;
  priority?: "low" | "medium" | "high" | null;
  assignedTo?: string;
  message?: string;
  messages?: TicketMessage[];
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: TicketValues | null;
  onClose: () => void;
  onSubmit: (values: TicketValues) => void;
};

const EMPTY_TICKET: TicketValues = {
  subject: "",
  user: "",
  status: "open",
  priority: "medium",
  assignedTo: "",
  message: "",
  messages: [],
};

const SupportTicketModal: React.FC<Props> = ({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
}) => {
  // Initialize form values from mode + initialValues on first mount
  const [values, setValues] = useState<TicketValues>(() => {
    if (mode === "edit" && initialValues) {
      return {
        ...EMPTY_TICKET,
        ...initialValues,
      };
    }
    return { ...EMPTY_TICKET };
  });

  // Get thread ID from initialValues (it's the ticket ID)
  // We need to get it from the SupportTicket object passed as initialValues
  const threadId = mode === "edit" && initialValues && "id" in initialValues 
    ? (initialValues as any).id 
    : null;
  
  // Use hook to fetch and send messages
  const {
    messages: firebaseMessages,
    loading: messagesLoading,
    error: messagesError,
    sendReply,
  } = useSupportThreadMessages(threadId);

  const [replyText, setReplyText] = useState<string>("");

  // Update values when initialValues change
  useEffect(() => {
    if (mode === "edit" && initialValues) {
      setValues({
        ...EMPTY_TICKET,
        ...initialValues,
      });
    } else {
      setValues({ ...EMPTY_TICKET });
    }
  }, [mode, initialValues]);

  // Use Firebase messages if available, otherwise fall back to initialValues messages
  const messages = firebaseMessages.length > 0 ? firebaseMessages : (initialValues?.messages || []);

  const handleSave = async () => {
    const trimmed = replyText.trim();

    // If there's a reply text and we're in edit mode, send it via the hook
    if (trimmed.length > 0 && mode === "edit" && threadId) {
      try {
        await sendReply(trimmed);
        setReplyText("");
        // The hook will automatically refresh messages, so we don't need to update local state
        // But we still need to call onSubmit to update metadata if changed
        onSubmit({ ...values });
      } catch (err) {
        console.error("Error sending reply:", err);
        // Don't clear reply text on error so user can retry
        return;
      }
    } else {
      // For create mode or when just updating metadata, call onSubmit
      onSubmit({ ...values, messages });
    }
  };

  const handleChange =
    (field: keyof TicketValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setValues((prev) => ({ ...prev, [field]: v }));
    };

  const title = mode === "create" ? "Create Support Ticket" : "Support Chat";

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={onClose}
          >
            Close
          </Button>
          <Button size="sm" type="button" onClick={handleSave}>
            {mode === "create" ? "Save Ticket" : "Send & Save"}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        {/* Ticket meta – similar to app header (advisor info) */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Conversation with
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {values.user || "Unknown user"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {values.subject || "No subject"}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <span className="inline-flex items-center rounded-full bg-gray-900 px-3 py-1 text-xs font-medium capitalize text-white dark:text-gray-900">
                  {values.status || "open"}
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium capitalize text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  {values.priority || "medium"}
                </span>
              </div>
              {/* future: wire this to a schedule-call flow */}
              {/* <Button
                type="button"
                // size="xs"
                variant="secondary"
                className="rounded-full"
              >
                Schedule a Call
              </Button> */}
            </div>
          </div>
        </div>

        {/* Basic editable fields */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput
            label="Subject"
            value={values.subject || ""}
            onChange={handleChange("subject")}
          />
          <TextInput
            label="User (email)"
            value={values.user || ""}
            onChange={handleChange("user")}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Status
            </label>
            <SelectFilter
              value={values.status ?? null}
              onChange={(v: string | null) =>
                setValues((prev) => ({
                  ...prev,
                  status: v as TicketValues["status"],
                }))
              }
              options={[
                { value: "open", label: "Open" },
                { value: "pending", label: "Pending" },
                { value: "closed", label: "Closed" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Priority
            </label>
            <SelectFilter
              value={values.priority ?? null}
              onChange={(v: string | null) =>
                setValues((prev) => ({
                  ...prev,
                  priority: v as TicketValues["priority"],
                }))
              }
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ]}
            />
          </div>

          <TextInput
            label="Assigned To"
            value={values.assignedTo || ""}
            onChange={handleChange("assignedTo")}
          />
          <TextInput
            label="Summary / Internal Note"
            value={values.message || ""}
            onChange={handleChange("message")}
          />
        </div>

        {/* Chatroom like the app UI */}
        {mode === "edit" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Messages – Chatroom
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Replies from you will appear in the app chat.
              </div>
            </div>

            <div className="flex h-80 flex-col rounded-2xl border border-gray-100 bg-white p-3 pr-4 text-sm text-gray-800 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100">
              {/* scrollable conversation */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-transparent pr-1 dark:bg-transparent">
                {messagesLoading ? (
                  <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">
                    Loading messages...
                  </div>
                ) : messagesError ? (
                  <div className="mt-4 text-center text-xs text-red-500 dark:text-red-400">
                    Error loading messages: {messagesError}
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((m) => {
                    // Check if message is from user (not admin/support)
                    // User messages have author = user email, admin messages have author = "Support"
                    const isUser = m.author !== "Support" && m.author !== "admin" && m.author === values.user;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${
                          isUser ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div className="max-w-[75%] space-y-1">
                          <div
                            className={`inline-flex w-full flex-col rounded-2xl px-3 py-2 text-sm shadow-sm ${
                              isUser
                                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                                : "bg-gray-900 text-white dark:bg-gray-900"
                            }`}
                          >
                            <span>{m.text}</span>
                          </div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500">
                            {isUser ? "Customer" : "You"} • {m.date}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">
                    No messages yet. Start the conversation below.
                  </div>
                )}
              </div>

              {/* composer – like the app input */}
              <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                <div className="flex items-end gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[42px] max-h-24 flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none placeholder-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-gray-600 dark:focus:ring-gray-700"
                    placeholder="Type your reply here…"
                    rows={2}
                  />
                  <Button
                    size="sm"
                    type="button"
                    onClick={handleSave}
                    disabled={!replyText.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default SupportTicketModal;
