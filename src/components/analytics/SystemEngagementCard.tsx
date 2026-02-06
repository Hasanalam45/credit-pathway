// src/components/analytics/SystemEngagementCard.tsx
import React from "react";
import SectionCard from "../shared/layout/SectionCard";
import { useSystemEngagement } from "../../hooks/useSystemEngagement";
import type { AnalyticsRange } from "../../pages/analytics/AnalyticsPage";

type Props = {
  range: AnalyticsRange;
  customStartDate?: string;
  customEndDate?: string;
};

const SystemEngagementCard: React.FC<Props> = ({ range, customStartDate, customEndDate }) => {
  const { data, loading, error } = useSystemEngagement(range, customStartDate, customEndDate);

  const subtitle =
    range === "last_7_days"
      ? "Usage in the last 7 days"
      : range === "last_30_days"
      ? "Usage in the last 30 days"
      : range === "this_month"
      ? "Usage this month"
      : range === "this_quarter"
      ? "Usage this quarter"
      : "Usage in custom range";

  if (error) {
    return (
      <SectionCard title="System Engagement" subtitle={subtitle}>
        <div className="py-8 text-center text-sm text-red-500">{error}</div>
      </SectionCard>
    );
  }

  if (loading || !data) {
    return (
      <SectionCard title="System Engagement" subtitle={subtitle}>
        <div className="py-8 text-center text-sm text-gray-500">
          Loading engagement data...
        </div>
      </SectionCard>
    );
  }

  const bars = [
    { label: "Imports", value: data.imports },
    { label: "Letters", value: data.letters },
    { label: "Disputes", value: data.disputes },
  ];
  const max = Math.max(...bars.map((b) => b.value), 1); // Avoid division by zero

  return (
    <SectionCard title="System Engagement" subtitle={subtitle}>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {data.total.toLocaleString()} Actions
        </span>
        <span className={`text-xs ${data.change >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
          {data.change >= 0 ? `+${data.change}%` : `${data.change}%`}
        </span>
      </div>

      <div className="mt-2 space-y-3">
        {bars.map((bar) => {
          const percent = (bar.value / max) * 100;
          return (
            <div key={bar.label}>
              <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{bar.label}</span>
                <span>{bar.value.toLocaleString()}</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-3 rounded-full bg-[#D4A317]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default SystemEngagementCard;
