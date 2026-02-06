import React from "react";
import { cn } from "../../../utils/cn";

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: string[];
  rightContent?: React.ReactNode;
  className?: string;
};

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumb,
  rightContent,
  className,
}) => {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800",
        className
      )}
    >
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="mb-1 text-xs text-gray-400 dark:text-gray-400">
            {breadcrumb.join(" / ")}
          </div>
        )}
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-gray-100">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>

      {rightContent && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {rightContent}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
