import React from "react";
import { cn } from "../../../utils/cn";
import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

type StatCardProps = {
  label: string;
  value: string | number;
  suffix?: string;
  delta?: number; // positive/negative
  deltaLabel?: string; // e.g. "vs. last 30 days"
  className?: string;
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  suffix,
  delta,
  deltaLabel,
  className,
}) => {
  const isPositive = delta !== undefined && delta >= 0;

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-2xl bg-white px-4 py-3 text-sm shadow-sm sm:px-5 sm:py-4 dark:bg-gray-800 dark:text-gray-100",
        className
      )}
    >
      <div className="mb-2 text-xs font-medium text-gray-500 sm:text-xs dark:text-gray-400">
        {label}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-2xl font-semibold text-gray-900 sm:text-3xl dark:text-gray-100">
          {value}
          {suffix && (
            <span className="ml-1 text-lg font-normal text-gray-600">
              {suffix}
            </span>
          )}
        </div>
        {delta !== undefined && (
          <div className="flex items-center gap-1 text-xs sm:text-xs">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-1.5 py-0.5 font-medium",
                isPositive
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300"
                  : "bg-red-50 text-red-500 dark:bg-red-900 dark:text-red-300"
              )}
            >
              {isPositive ? (
                <FiArrowUpRight className="mr-0.5 h-3 w-3" />
              ) : (
                <FiArrowDownRight className="mr-0.5 h-3 w-3" />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
            {deltaLabel && (
              <span className="text-[11px] text-gray-500">
                {deltaLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

