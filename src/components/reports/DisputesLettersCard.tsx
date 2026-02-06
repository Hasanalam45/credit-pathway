// src/components/reports/DisputesLettersCard.tsx
import React from "react";
import SectionCard from "../shared/layout/SectionCard";
import DataTable, { type Column } from "../shared/table/DataTable";
import StatusBadge from "../shared/data-display/StatusBadge";
import type { DateRange } from "../../pages/dashboard/DashboardPage";
import { useDisputes } from "../../hooks/useDisputes";
import type { DisputeRow } from "../../services/disputesService";

type Props = {
  dateRange: DateRange;
};

const DisputesLettersCard: React.FC<Props> = ({ dateRange }) => {
  const { disputes, loading, error } = useDisputes(dateRange);
  const columns: Column<DisputeRow>[] = [
    { key: "user", header: "User", className: "min-w-[160px]" },
    { key: "caseId", header: "Case ID", className: "min-w-[80px]" },
    { key: "type", header: "Type", className: "min-w-[200px]" },
    {
      key: "status",
      header: "Status",
      className: "min-w-[120px]",
      render: (row) => {
        if (row.status === "open") {
          return (
            <StatusBadge label="Open" variant="warning" />
          );
        }
        if (row.status === "mailed") {
          return (
            <StatusBadge label="Mailed" variant="info" />
          );
        }
        return (
          <StatusBadge label="Resolved" variant="success" />
        );
      },
    },
    {
      key: "lastUpdated",
      header: "Last updated",
      className: "min-w-[130px] text-gray-600",
    },
  ];

  return (
    <SectionCard
      title="Disputes & Letters"
      subtitle="Track dispute progress and letter mailing status."
    >
      {loading && (
        <div className="p-8 text-center">
          <p className="text-sm text-gray-500">Loading disputes...</p>
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
          data={disputes}
          getRowId={(r) => r.id}
        />
      )}
      {!loading && !error && disputes.length === 0 && (
        <div className="mt-3 text-xs text-gray-500">
          No disputes found for the selected date range.
        </div>
      )}
    </SectionCard>
  );
};

export default DisputesLettersCard;
