// src/components/reports/UserJourneyTable.tsx
import React from "react";
import SectionCard from "../shared/layout/SectionCard";
import TableToolbar from "../shared/table/TableToolbar";
import SearchInput from "../shared/inputs/SearchInput";
import DataTable, { type Column } from "../shared/table/DataTable";
// import StatusBadge from "../shared/data-display/StatusBadge";

export type UserJourney = {
  id: string;
  name: string;
  email: string;
  plan: string;
  stage: string;
  progress: number; // 0-100
  lastUpdated: string;
};

type Props = {
  journeys: UserJourney[];
  search: string;
  onSearchChange: (value: string) => void;
  onRowClick: (journey: UserJourney) => void;
};

const UserJourneyTable: React.FC<Props> = ({
  journeys,
  search,
  onSearchChange,
  onRowClick,
}) => {
  const columns: Column<UserJourney>[] = [
    {
      key: "name",
      header: "User",
      className: "min-w-[200px] font-medium text-gray-900",
    },
    {
      key: "email",
      header: "Email",
      className: "min-w-[220px] text-gray-600",
    },
    {
      key: "plan",
      header: "Plan",
      className: "min-w-[160px] text-gray-700",
    },
    {
      key: "stage",
      header: "Current Stage",
      className: "min-w-[200px]",
    },
    {
      key: "progress",
      header: "Progress",
      className: "min-w-[130px]",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-[#D4A317]"
              style={{ width: `${row.progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">
            {row.progress}%
          </span>
        </div>
      ),
    },
    {
      key: "lastUpdated",
      header: "Last updated",
      className: "min-w-[130px] text-gray-600",
    },
  ];

  return (
    <SectionCard title="Per-user Credit Journeys" subtitle="Track where each user is in their plan timeline.">
      <TableToolbar
        search={
          <SearchInput
            placeholder="Search by name, email, or plan..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        }
      />
      <DataTable
        columns={columns}
        data={journeys}
        getRowId={(row) => row.id}
        onRowClick={onRowClick}
        hover
      />
      {journeys.length === 0 && (
        <div className="mt-3 text-xs text-gray-500">
          No journeys match your filters.
        </div>
      )}
    </SectionCard>
  );
};

export default UserJourneyTable;
