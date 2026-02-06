import React from "react";
import { cn } from "../../../utils/cn";

type TableToolbarProps = {
  search?: React.ReactNode;
  filters?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
};

const TableToolbar: React.FC<TableToolbarProps> = ({
  search,
  filters,
  rightContent,
  className,
}) => {
  return (
    <div
      className={cn(
        "mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex-1">
        {search && (
          <div className="max-w-lg">{search}</div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {filters && (
          <div className="flex flex-wrap items-center gap-2">
            {filters}
          </div>
        )}
        {rightContent && (
          <div className="flex items-center gap-2">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableToolbar;

