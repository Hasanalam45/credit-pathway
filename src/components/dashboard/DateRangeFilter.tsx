import React from "react";
import { FiCalendar } from "react-icons/fi";
import { cn } from "../../utils/cn";
import type { DateRange } from "../../pages/dashboard/DashboardPage";

type Props = {
  value: DateRange;
  onChange: (value: DateRange) => void;
};

const LABELS: Record<DateRange, string> = {
  last_7_days: "Last 7 Days",
  last_30_days: "Last 30 Days",
  this_month: "This Month",
  this_quarter: "This Quarter",
  all_time: "All Time",
};

const DateRangeFilter: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
      <FiCalendar className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
      <select
        className={cn(
          "w-full appearance-none bg-transparent pr-6 text-xs font-medium text-gray-800 focus:outline-none sm:text-sm dark:text-white"
        )}
        value={value}
        onChange={(e) => onChange(e.target.value as DateRange)}
      >
        {Object.entries(LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 dark:text-gray-400">
        ▼
      </span>
    </div>
  );
};

export default DateRangeFilter;
