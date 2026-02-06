// src/components/users/UserTable.tsx
import React from "react";
import SearchInput from "../shared/inputs/SearchInput";
import SelectFilter from "../shared/inputs/SelectFilter";
import TableToolbar from "../shared/table/TableToolbar";
import {
  type Column,
} from "../shared/table/DataTable";
import Pagination from "../shared/table/Pagination";
import StatusBadge from "../shared/data-display/StatusBadge";
// import Pill from "../shared/data-display/Pill";
import { cn } from "../../utils/cn";

export type UserStatus = "active" | "inactive";
export type UserTier = "Core" | "Advantage" | "Pro";

export type User = {
  id: string;
  name: string;
  email: string;
  tier: UserTier;
  status: UserStatus;
  dateJoined: string;
  lastActivity: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
};

export type SortBy = "date_joined" | "last_activity";

type Props = {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;

  search: string;
  onSearchChange: (value: string) => void;

  tierFilter: UserTier | "all";
  onTierFilterChange: (value: UserTier | "all") => void;

  statusFilter: UserStatus | "all";
  onStatusFilterChange: (value: UserStatus | "all") => void;

  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;

  onRowClick: (user: User) => void;
};

const UserTable: React.FC<Props> = ({
  users,
  total,
  page,
  pageSize,
  onPageChange,
  search,
  onSearchChange,
  tierFilter,
  onTierFilterChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  onRowClick,
}) => {
  const columns: Column<User>[] = [
    {
      key: "name",
      header: "User Name",
      className: "min-w-[200px] font-medium text-gray-900",
    },
    {
      key: "email",
      header: "Email",
      className: "min-w-[220px] text-gray-600",
    },
    {
      key: "tier",
      header: "Tier",
      className: "min-w-[80px] text-gray-700",
      render: (row) => row.tier,
    },
    {
      key: "status",
      header: "Status",
      className: "min-w-[100px]",
      render: (row) =>
        row.status === "active" ? (
          <StatusBadge label="Active" variant="success" />
        ) : (
          <StatusBadge label="Inactive" variant="neutral" />
        ),
    },
    {
      key: "dateJoined",
      header: "Date Joined",
      className: "min-w-[120px] text-gray-600",
    },
    {
      key: "lastActivity",
      header: "Last Activity",
      className: "min-w-[120px] text-gray-600",
    },
    {
      key: "actions",
      header: "Actions",
      className: "min-w-[60px] text-right",
        render: () => (
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          aria-label="More actions"
        >
          ⋯
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <TableToolbar
        search={
          <SearchInput
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        }
        filters={
          <>
            <SelectFilter
              value={tierFilter === "all" ? null : tierFilter}
              onChange={(val) =>
                onTierFilterChange((val as UserTier) || "all")
              }
              options={[
                { value: "Core", label: "Core" },
                { value: "Advantage", label: "Advantage" },
                { value: "Pro", label: "Pro" },
              ]}
              placeholder="Tier"
            />
            <SelectFilter
              value={statusFilter === "all" ? null : statusFilter}
              onChange={(val) =>
                onStatusFilterChange(
                  (val as UserStatus) || "all"
                )
              }
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              placeholder="Status"
            />
            <SelectFilter
              value={sortBy}
              onChange={(val) =>
                onSortByChange(
                  (val as SortBy) || "date_joined"
                )
              }
              options={[
                { value: "date_joined", label: "Date Joined" },
                { value: "last_activity", label: "Last Activity" },
              ]}
              placeholder="Sort by"
            />
          </>
        }
        rightContent={
          search ||
          tierFilter !== "all" ||
          statusFilter !== "all" ? (
            <button
              type="button"
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
              onClick={() => {
                onSearchChange("");
                onTierFilterChange("all");
                onStatusFilterChange("all");
              }}
            >
              Clear Filters
            </button>
          ) : null
        }
      />

      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
        )}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-left whitespace-nowrap",
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-sm text-gray-700 dark:divide-gray-700 dark:bg-gray-900 dark:text-gray-200">
              {users.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className="cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-800/60"
                  onClick={() => onRowClick(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 whitespace-nowrap align-middle",
                        col.className
                      )}
                      onClick={(e) => {
                        // Allow action button click without opening drawer
                        if (
                          (e.target as HTMLElement).closest(
                            "button"
                          )
                        ) {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {col.render
                        ? col.render(row, rowIndex)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-4 py-2.5">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default UserTable;
