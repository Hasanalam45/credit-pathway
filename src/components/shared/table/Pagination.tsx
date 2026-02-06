import React from "react";
import { cn } from "../../../utils/cn";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}) => {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div
      className={cn(
        "mt-3 flex flex-col items-center justify-between gap-3 text-xs text-gray-500 sm:flex-row sm:text-sm",
        className
      )}
    >
      <div>
        Showing{" "}
        <span className="font-medium text-gray-700">
          {total === 0 ? 0 : start}
        </span>{" "}
        to{" "}
        <span className="font-medium text-gray-700">
          {end}
        </span>{" "}
        of{" "}
        <span className="font-medium text-gray-700">
          {total}
        </span>{" "}
        results
      </div>

      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => canPrev && onPageChange(page - 1)}
          disabled={!canPrev}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full border text-gray-600",
            canPrev
              ? "bg-white hover:bg-gray-50 border-gray-200 dark:bg-gray-100 dark:hover:bg-gray-200 dark:border-gray-700 dark:text-gray-900"
              : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
          )}
          aria-label="Previous page"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => canNext && onPageChange(page + 1)}
          disabled={!canNext}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full border text-gray-600",
            canNext
              ? "bg-white hover:bg-gray-50 border-gray-200 dark:bg-gray-100 dark:hover:bg-gray-200 dark:border-gray-700 dark:text-gray-900"
              : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
          )}
          aria-label="Next page"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

