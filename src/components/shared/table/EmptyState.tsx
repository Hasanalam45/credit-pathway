import React from "react";
import { cn } from "../../../utils/cn";

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode; // e.g. a button
  className?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No data yet",
  description = "There is nothing to show here right now.",
  icon,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-3 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-800 sm:text-base">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-md text-xs text-gray-500 sm:text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;

