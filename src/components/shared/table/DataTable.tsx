
import React from "react";
import { cn } from "../../../utils/cn";

export type Column<T> = {
  /** Property key OR arbitrary key if using `render` */
  key: keyof T | string;
  header: React.ReactNode;
  className?: string;
  /** Custom cell render; falls back to `row[key]` */
  render?: (row: T, index: number) => React.ReactNode;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  /** How to get a stable row key */
  getRowId?: (row: T, index: number) => React.Key;
  /** Optional click handler for entire row */
  onRowClick?: (row: T) => void;
  /** Add hover style when true */
  hover?: boolean;
  /** Optional extra class on outer wrapper */
  className?: string;
};

function DataTableInner<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  hover,
  className,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
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
            {data.map((row, rowIndex) => {
              const rowKey = getRowId
                ? getRowId(row, rowIndex)
                : rowIndex;

              const clickable = typeof onRowClick === "function";

              return (
                <tr
                  key={rowKey}
                  className={cn(
                    clickable && "cursor-pointer",
                    hover && "hover:bg-gray-50/70 dark:hover:bg-gray-800/60"
                  )}
                  onClick={
                    clickable ? () => onRowClick(row) : undefined
                  }
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        "px-4 py-3 whitespace-nowrap align-middle",
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(row, rowIndex)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        : (row as any)[col.key as keyof T]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Generic wrapper for inference
function DataTable<T>(props: DataTableProps<T>) {
  return <DataTableInner {...props} />;
}

export default DataTable;
