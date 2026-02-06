import React from "react";
import SectionCard from "../shared/layout/SectionCard";
import DataTable, {
  type Column,
} from "../shared/table/DataTable";
import StatusBadge from "../shared/data-display/StatusBadge";
import Pill from "../shared/data-display/Pill";
import EmptyState from "../shared/table/EmptyState";

export type ContentKind = "article" | "lesson" | "video" | "link" | "page";
export type Visibility = "visible" | "hidden";
export type MembershipTier = "free" | "paid" | "vip";

export type ContentItem = {
  id: string;
  kind: ContentKind;
  title: string;
  typeLabel: string;
  category: string;
  visibility: Visibility;
  tier: MembershipTier;
  lastUpdated: string; // YYYY-MM-DD
};

type Props = {
  items: ContentItem[];
  onEdit?: (item: ContentItem) => void;
  onDelete?: (id: string) => void;
};

const ContentTable: React.FC<Props> = ({ items, onEdit, onDelete }) => {
  const columns: Column<ContentItem>[] = [
    {
      key: "title",
      header: "Title",
      className: "min-w-[220px] font-medium text-gray-900",
    },
    {
      key: "typeLabel",
      header: "Type",
      className: "min-w-[120px] text-gray-600",
    },
    {
      key: "category",
      header: "Category",
      className: "min-w-[160px] text-gray-700",
    },
    {
      key: "visibility",
      header: "Visibility",
      className: "min-w-[130px]",
      render: (row) =>
        row.visibility === "visible" ? (
          <StatusBadge label="Visible" variant="success" />
        ) : (
          <StatusBadge label="Hidden" variant="danger" />
        ),
    },
    {
      key: "tier",
      header: "Membership Tier",
      className: "min-w-[140px]",
      render: (row) => {
        if (row.tier === "free") {
          return <Pill>Free</Pill>;
        }
        if (row.tier === "paid") {
          return <Pill tone="gold">Paid</Pill>;
        }
        return (
          <Pill tone="gold" className="uppercase">
            VIP
          </Pill>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "min-w-[160px] text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(row);
            }}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(row.id);
            }}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-800 dark:text-rose-100 dark:hover:bg-rose-700"
          >
            Delete
          </button>
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
    <SectionCard>
      {items.length === 0 ? (
        <EmptyState
          title="No content yet"
          description="Create a new article or lesson to get started."
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          getRowId={(row) => row.id}
        />
      )}
    </SectionCard>
  );
};

export default ContentTable;
