// src/components/reports/MailingLogsCard.tsx
import React from "react";
import SectionCard from "../shared/layout/SectionCard";
import DataTable, { type Column } from "../shared/table/DataTable";
import StatusBadge from "../shared/data-display/StatusBadge";
import type { DateRange } from "../../pages/dashboard/DashboardPage";
import { useMailingLogs } from "../../hooks/useMailingLogs";
import type { MailLog } from "../../services/mailingService";

type Props = {
  dateRange: DateRange;
};

const MailingLogsCard: React.FC<Props> = ({ dateRange }) => {
  const { logs, loading, error } = useMailingLogs(dateRange);
  const columns: Column<MailLog>[] = [
    { key: "user", header: "User", className: "min-w-[150px]" },
    { key: "item", header: "Item", className: "min-w-[160px]" },
    {
      key: "channel",
      header: "Channel",
      className: "min-w-[80px] text-gray-700",
    },
    {
      key: "status",
      header: "Status",
      className: "min-w-[110px]",
      render: (row) => {
        if (row.status === "queued") {
          return (
            <StatusBadge label="Queued" variant="warning" />
          );
        }
        if (row.status === "sent") {
          return <StatusBadge label="Sent" variant="success" />;
        }
        return <StatusBadge label="Failed" variant="danger" />;
      },
    },
    {
      key: "createdAt",
      header: "Created",
      className: "min-w-[140px] text-gray-600",
    },
    {
      key: "error",
      header: "Error",
      className: "min-w-[160px] text-xs text-red-500",
    },
  ];

  return (
    <SectionCard
      title="Mailing Logs"
      subtitle="Monitor outgoing letters & emails and catch failures quickly."
    >
      {loading && (
        <div className="p-8 text-center">
          <p className="text-sm text-gray-500">Loading mailing logs...</p>
        </div>
      )}
      {error && (
        <div className="p-8 text-center">
          <p className="text-sm text-red-600">Error: {error}</p>
        </div>
      )}
      {!loading && !error && (
        <DataTable columns={columns} data={logs} getRowId={(r) => r.id} />
      )}
      {!loading && !error && logs.length === 0 && (
        <div className="mt-3 text-xs text-gray-500">
          No mailing logs found for the selected date range.
        </div>
      )}
    </SectionCard>
  );
};

export default MailingLogsCard;
