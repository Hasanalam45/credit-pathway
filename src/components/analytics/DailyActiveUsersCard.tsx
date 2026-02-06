// src/components/analytics/DailyActiveUsersCard.tsx
import React, { useState, useEffect } from "react";
import SectionCard from "../shared/layout/SectionCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AnalyticsRange } from "../../pages/analytics/AnalyticsPage";
import { useDailyActiveUsers } from "../../hooks/useDailyActiveUsers";

type Props = {
  range: AnalyticsRange;
  customStartDate?: string;
  customEndDate?: string;
};

const DailyActiveUsersCard: React.FC<Props> = ({ range, customStartDate, customEndDate }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const { data, loading, error, value, change } = useDailyActiveUsers(range, customStartDate, customEndDate);

  const subtitle =
    range === "last_7_days"
      ? "Last 7 days"
      : range === "last_30_days"
      ? "Last 30 days"
      : range === "this_month"
      ? "This month"
      : range === "this_quarter"
      ? "This quarter"
      : "Custom range";

  if (error) {
    return (
      <SectionCard title="Daily Active Users (DAU)" subtitle={`vs. ${subtitle}`}>
        <div className="py-8 text-center text-sm text-red-500">
          {error}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Daily Active Users (DAU)" subtitle={`vs. ${subtitle}`}>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</span>
        <span className={`text-xs ${change >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{change >= 0 ? `+${change}%` : `${change}%`}</span>
      </div>
      <div className="h-44 w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Loading chart data...
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: -20, right: 5, top: 5 }}>
              <defs>
                <linearGradient id="analyticsLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4A317" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#FDE7A7" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#f3f4f6"
                vertical={false}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
              />
              <Tooltip
                cursor={{ stroke: isDark ? "#374151" : "#e5e7eb", strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 12,
                  border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                  boxShadow: isDark
                    ? "0 10px 25px rgba(2,6,23,0.6)"
                    : "0 10px 25px rgba(15,23,42,0.08)",
                  fontSize: 12,
                  background: isDark ? "#0f1724" : undefined,
                  color: isDark ? "#e6eef8" : undefined,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#D4A317"
                strokeWidth={2.4}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </SectionCard>
  );
};

export default DailyActiveUsersCard;
