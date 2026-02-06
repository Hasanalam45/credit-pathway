
import React from "react";
import { cn } from "../../../utils/cn";

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "info";

export type StatusBadgeProps = {
  label: string;
  variant?: StatusVariant;
  className?: string;
};

const VARIANT_STYLES: Record<StatusVariant, string> = {
  success:
    "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-800 dark:text-emerald-100 dark:border-emerald-700",
  warning:
    "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-700 dark:text-amber-100 dark:border-amber-600",
  danger:
    "bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-700 dark:text-rose-100 dark:border-rose-600",
  neutral:
    "bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
  info:
    "bg-sky-50 text-sky-700 border border-sky-100 dark:bg-sky-800 dark:text-sky-100 dark:border-sky-700",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = "neutral",
  className,
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
