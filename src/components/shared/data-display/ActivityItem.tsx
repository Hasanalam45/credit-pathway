import React from "react";
import { cn } from "../../../utils/cn";

type ActivityItemProps = {
  colorClass?: string; // e.g. "bg-blue-500"
  title: string;
  description?: string;
  timeAgo: string;
};

const ActivityItem: React.FC<ActivityItemProps> = ({
  colorClass = "bg-blue-500",
  title,
  description,
  timeAgo,
}) => {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "mt-1 inline-flex h-2.5 w-2.5 rounded-full",
          colorClass
        )}
      />
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-900 sm:text-sm dark:text-gray-100">
          {title}
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-400">
          {timeAgo}
        </p>
      </div>
    </div>
  );
};

export default ActivityItem;

