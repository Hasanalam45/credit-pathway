import React, { useMemo, useState } from "react";
import PageHeader from "../../components/shared/layout/PageHeader";
import SupportTicketsTable, {
  type SupportTicket,
} from "../../components/support/SupportTicketsTable";
import SupportTicketModal, {
  type TicketValues,
} from "../../components/support/SupportTicketModal";
import DateRangeFilter from "../../components/dashboard/DateRangeFilter";
import Button from "../../components/shared/buttons/Button";
import type { DateRange } from "../dashboard/DashboardPage";
import { useSupportTickets } from "../../hooks/useSupportTickets";
import {
  createSupportTicket,
  updateTicketMetadata,
} from "../../services/supportTicketsService";

const SupportPage: React.FC = () => {
  const [range, setRange] = useState<DateRange>("all_time");
  const { tickets, loading, error, refetch } = useSupportTickets(range);
  const [search, setSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<SupportTicket | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.user.toLowerCase().includes(q)
    );
  }, [tickets, search]);

  const handleCreate = async (vals: TicketValues) => {
    try {
      // Extract userId from user email (we'll need to find user by email)
      // For now, we'll use the user field as userId if it's a valid format
      // In a real scenario, you'd want to look up the user by email first
      const userId = vals.user || "";
      
      if (!userId) {
        alert("User email is required to create a ticket");
        return;
      }

      await createSupportTicket(
        userId,
        vals.subject || "New ticket",
        vals.message || undefined
      );
      
      // Refresh tickets list
      await refetch();
      setCreateOpen(false);
    } catch (err: any) {
      console.error("Error creating ticket:", err);
      alert(err.message || "Failed to create ticket");
    }
  };

  // 🔁 Edit keeps modal open so admin can chat multiple times
  const handleEdit = async (vals: TicketValues) => {
    if (!editing) return;
    
    try {
      const threadId = editing.id;
      
      // Update metadata if changed
      const metadataUpdates: {
        status?: "open" | "pending" | "closed";
        priority?: "low" | "medium" | "high";
        assignedTo?: string;
        subject?: string;
        adminNote?: string;
      } = {};
      
      if (vals.status !== undefined && vals.status !== null && vals.status !== editing.status) {
        metadataUpdates.status = vals.status;
      }
      if (vals.priority !== undefined && vals.priority !== null && vals.priority !== editing.priority) {
        metadataUpdates.priority = vals.priority;
      }
      if (vals.assignedTo !== undefined && vals.assignedTo !== editing.assignedTo) {
        metadataUpdates.assignedTo = vals.assignedTo;
      }
      if (vals.subject !== undefined && vals.subject !== editing.subject) {
        metadataUpdates.subject = vals.subject;
      }
      if (vals.message !== undefined && vals.message !== editing.message) {
        metadataUpdates.adminNote = vals.message;
      }
      
      // Update metadata if there are changes
      if (Object.keys(metadataUpdates).length > 0) {
        await updateTicketMetadata(threadId, metadataUpdates);
      }
      
      // Check if there's a new message to send
      // The modal will handle sending messages separately via useSupportThreadMessages
      // But we can also check if messages array has new items
      const newMessages = vals.messages || [];
      const oldMessages = editing.messages || [];
      
      // Find the last message that wasn't in the old messages
      if (newMessages.length > oldMessages.length) {
        const lastNewMessage = newMessages[newMessages.length - 1];
        // Only send if it's from admin/support and not already sent
        if (lastNewMessage.author === "Support" || lastNewMessage.author !== editing.user) {
          // This message should already be sent via the hook, but we'll refresh anyway
        }
      }
      
      // Refresh tickets list
      await refetch();
      // do NOT close the modal here; user can keep chatting
    } catch (err: any) {
      console.error("Error updating ticket:", err);
      alert(err.message || "Failed to update ticket");
    }
  };

  const onEditClick = (t: SupportTicket) => {
    setEditing(t);
    setEditOpen(true);
  };


  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      <PageHeader
        title="Support"
        description="Customer support tickets and workflows."
        rightContent={
          <div className="flex items-center gap-2">
            <DateRangeFilter value={range} onChange={setRange} />
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                setIsExporting(true);
                try {
                  const header = [
                    "id",
                    "subject",
                    "user",
                    "status",
                    "priority",
                    "assignedTo",
                    "message",
                    "lastUpdated",
                  ];
                  const rows: string[] = [header.join(",")];

                  for (const t of filtered) {
                    const row = [
                      t.id,
                      `"${String(t.subject).replace(/"/g, '""')}"`,
                      t.user,
                      t.status,
                      t.priority,
                      t.assignedTo || "",
                      `"${String(t.message).replace(/"/g, '""')}"`,
                      t.lastUpdated,
                    ];
                    rows.push(row.join(","));
                  }

                  const csv = rows.join("\n");
                  const blob = new Blob([csv], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  const ts = new Date().toISOString().replace(/[:.]/g, "-");
                  a.href = url;
                  a.download = `support-tickets-${range}-${ts}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  console.error("Failed to export tickets:", err);
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={isExporting}
            >
              {isExporting ? "Exporting…" : "Export"}
            </Button>

         
          </div>
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && tickets.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading support tickets...
          </div>
        </div>
      ) : (
        <SupportTicketsTable
          tickets={filtered}
          search={search}
          onSearchChange={setSearch}
          onRowClick={(t: SupportTicket) => {
            setEditing(t);
            setEditOpen(true);
          }}
          onEdit={onEditClick}
        />
      )}

      <SupportTicketModal
        key="create"
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
      <SupportTicketModal
        key={editing?.id ?? "edit"}
        open={editOpen}
        mode="edit"
        initialValues={editing ? {
          id: editing.id,
          subject: editing.subject,
          user: editing.user,
          status: editing.status,
          priority: editing.priority,
          assignedTo: editing.assignedTo,
          message: editing.message,
          messages: editing.messages,
        } : undefined}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        onSubmit={handleEdit}
      />
    </div>
  );
};

export default SupportPage;
