
import React, {
  useMemo,
  useEffect,
  useState,
} from "react";
import SectionCard from "../shared/layout/SectionCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DateRange } from "../../pages/dashboard/DashboardPage";
import { useDailyUsage } from "../../hooks/useDailyUsage";
import { formatNumber } from "../../services/dashboardService";

type Props = {
  dateRange: DateRange;
};

type UsagePoint = {
  label: string;
  value: number;
};

const UsageEngagementCard: React.FC<Props> = ({ dateRange }) => {
  const { data, total, percentageChange, loading, error } = useDailyUsage(dateRange);

  const rangeLabel = useMemo(() => {
    switch (dateRange) {
      case "last_7_days":
        return "Last 7 Days";
      case "this_month":
        return "This Month";
      case "this_quarter":
        return "This Quarter";
      case "all_time":
        return "All Time";
      case "last_30_days":
      default:
        return "Last 30 Days";
    }
  }, [dateRange]);

  // Transform data for chart (ensure we have data even if empty)
  const chartData: UsagePoint[] = useMemo(() => {
    if (data.length > 0) {
      return data.map((point) => ({
        label: point.label,
        value: point.value,
      }));
    }
    // Return default empty data structure for chart (prevents "Chart loading..." stuck state)
    // For "all_time", use monthly aggregation (last 12 months)
    let days: number;
    let labelFn: (i: number) => string;
    
    if (dateRange === "last_7_days") {
      days = 7;
      labelFn = (i) => `Day ${i + 1}`;
    } else if (dateRange === "last_30_days") {
      days = 30;
      labelFn = (i) => `Day ${i + 1}`;
    } else if (dateRange === "this_month") {
      days = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      labelFn = (i) => `${i + 1}`;
    } else if (dateRange === "all_time") {
      // For all_time, show last 12 months
      days = 12;
      labelFn = (i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        return date.toLocaleDateString("en-US", { month: "short" });
      };
    } else {
      // this_quarter
      days = 90;
      labelFn = (i) => `Day ${i + 1}`;
    }
    
    return Array.from({ length: days }, (_, i) => ({
      label: labelFn(i),
      value: 0,
    }));
  }, [data, dateRange]);

  // Initialize from current document theme (if available)
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  // Simplified: Use fixed height instead of dynamic container size detection
  // ResponsiveContainer will handle the width automatically
  const chartHeight = 220;

  useEffect(() => {
    if (
      typeof document === "undefined" ||
      typeof MutationObserver === "undefined"
    ) {
      return;
    }

    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      obs.disconnect();
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <SectionCard title="Usage & Engagement">
        <div className="mb-3 flex items-baseline gap-2">
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
        </div>
        <div className="h-56 w-full bg-gray-100 rounded animate-pulse dark:bg-gray-800"></div>
      </SectionCard>
    );
  }

  // Show error state
  if (error && chartData.length === 0) {
    return (
      <SectionCard title="Usage & Engagement">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-200">
            Error loading usage data: {error}
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Usage & Engagement">
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {formatNumber(total)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {rangeLabel}{" "}
          <span
            className={`font-medium ${
              percentageChange >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {percentageChange >= 0 ? "+" : ""}
            {percentageChange.toFixed(1)}%
          </span>
        </span>
      </div>

      <div className="h-56 w-full" style={{ minWidth: 0, minHeight: 220 }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={chartData} margin={{ left: -20, right: 0, top: 10 }}>
              <defs>
                <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4A317" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#FDF5DF" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={isDark ? "#1f2937" : "#f3f4f6"}
                vertical={false}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{
                  fontSize: 11,
                  fill: isDark ? "#94a3b8" : "#9ca3af",
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{
                  fontSize: 11,
                  fill: isDark ? "#94a3b8" : "#9ca3af",
                }}
              />
              <Tooltip
                cursor={{
                  stroke: isDark ? "#374151" : "#e5e7eb",
                  strokeWidth: 1,
                }}
                contentStyle={{
                  borderRadius: 12,
                  border: isDark
                    ? "1px solid #374151"
                    : "1px solid #e5e7eb",
                  boxShadow: isDark
                    ? "0 10px 25px rgba(2,6,23,0.6)"
                    : "0 10px 25px rgba(15,23,42,0.08)",
                  fontSize: 12,
                  background: isDark ? "#0f1724" : undefined,
                  color: isDark ? "#e6eef8" : undefined,
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#D4A317"
                strokeWidth={2.4}
                fill="url(#usageFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            {chartData.length === 0 ? "No data available" : "Chart loading..."}
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default UsageEngagementCard;
