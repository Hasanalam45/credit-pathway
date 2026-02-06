// src/components/reports/IssuesSupportCard.tsx
import React from "react";
import SectionCard from "../shared/layout/SectionCard";
import DataTable, { type Column } from "../shared/table/DataTable";
import StatusBadge from "../shared/data-display/StatusBadge";
import type { DateRange } from "../../pages/dashboard/DashboardPage";
import { useSupportIssues } from "../../hooks/useSupportIssues";
import type { IssueRow } from "../../services/supportService";

type Props = {
  dateRange: DateRange;
};

const IssuesSupportCard: React.FC<Props> = ({ dateRange }) => {
  const { issues, loading, error } = useSupportIssues(dateRange);
  const columns: Column<IssueRow>[] = [
    { key: "user", header: "User", className: "min-w-[150px]" },
    {
      key: "subject",
      header: "Issue",
      className: "min-w-[220px]",
    },
    {
      key: "channel",
      header: "Channel",
      className: "min-w-[80px] text-gray-700",
    },
    {
      key: "advisor",
      header: "Advisor",
      className: "min-w-[110px]",
    },
    {
      key: "status",
      header: "Status",
      className: "min-w-[110px]",
      render: (row) => {
        if (row.status === "open") {
          return <StatusBadge label="Open" variant="warning" />;
        }
        if (row.status === "in_progress") {
          return (
            <StatusBadge
              label="In Progress"
              variant="info"
            />
          );
        }
        return (
          <StatusBadge label="Resolved" variant="success" />
        );
      },
    },
    {
      key: "lastContact",
      header: "Last contact",
      className: "min-w-[120px] text-gray-600",
    },
  ];

  return (
    <SectionCard
      title="User Issues & Support"
      subtitle="Track support tickets, channels, and advisor workload."
    >
      {loading && (
        <div className="p-8 text-center">
          <p className="text-sm text-gray-500">Loading support issues...</p>
        </div>
      )}
      {error && (
        <div className="p-8 text-center">
          <p className="text-sm text-red-600">Error: {error}</p>
        </div>
      )}
      {!loading && !error && (
        <DataTable
          columns={columns}
          data={issues}
          getRowId={(r) => r.id}
        />
      )}
      {!loading && !error && issues.length === 0 && (
        <div className="mt-3 text-xs text-gray-500">
          No support issues found for the selected date range.
        </div>
      )}
    </SectionCard>
  );
};

export default IssuesSupportCard;
