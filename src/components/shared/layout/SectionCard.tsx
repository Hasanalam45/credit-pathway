import React from "react";
import { cn } from "../../../utils/cn";

type SectionCardProps = {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  headerRight,
  children,
  className,
}) => {
  return (
    <section
      className={cn(
        "rounded-2xl bg-white p-4 shadow-sm sm:p-5 lg:p-6 dark:bg-gray-800 dark:shadow-none",
        className
      )}
    >
      {(title || subtitle || headerRight) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-gray-900 sm:text-base dark:text-gray-100">
                {title}
              </h2>
            )}
            {subtitle && (
                <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </header>
      )}

      {children}
    </section>
  );
};

export default SectionCard;

