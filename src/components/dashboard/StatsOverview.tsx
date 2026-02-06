import React from "react";
import StatCard from "../shared/data-display/StatCard";
import type { DateRange } from "../../pages/dashboard/DashboardPage";
import { useDashboardStats, formatNumber, getDeltaPercentage } from "../../hooks/useDashboardStats";

type Props = {
  dateRange: DateRange;
};

const StatsOverview: React.FC<Props> = ({ dateRange }) => {
  const { stats, loading, error } = useDashboardStats(dateRange);

  // Show loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 animate-pulse"
          >
            <div className="h-4 w-24 bg-gray-200 rounded dark:bg-gray-700 mb-2"></div>
            <div className="h-8 w-16 bg-gray-200 rounded dark:bg-gray-700 mb-2"></div>
            <div className="h-3 w-20 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
        ))}
      </div>
    );
  }

  // Show error state (with fallback values)
  if (error && !stats) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
        <p className="text-sm text-red-600 dark:text-red-200">
          Error loading statistics: {error}
        </p>
      </div>
    );
  }

  // Calculate deltas from previous period
  const totalUsersDelta = stats?.previousPeriodStats
    ? getDeltaPercentage(stats.totalUsers, stats.previousPeriodStats.totalUsers)
    : 0;

  const activeUsersDelta = stats?.previousPeriodStats
    ? getDeltaPercentage(stats.activeUsers, stats.previousPeriodStats.activeUsers)
    : 0;

  const membersByTierDelta = stats?.previousPeriodStats
    ? getDeltaPercentage(
        stats.membersByTier.percentage,
        stats.previousPeriodStats.membersByTier
      )
    : 0;

  const openDisputesDelta = stats?.previousPeriodStats
    ? getDeltaPercentage(stats.openDisputes, stats.previousPeriodStats.openDisputes)
    : 0;

  const lettersGeneratedDelta = stats?.previousPeriodStats
    ? getDeltaPercentage(
        stats.lettersGenerated,
        stats.previousPeriodStats.lettersGenerated
      )
    : 0;

  const statsData = [
    {
      id: "total_users",
      label: "Total Users",
      value: formatNumber(stats?.totalUsers || 0),
      delta: totalUsersDelta,
    },
    {
      id: "active_users",
      label: "Active Users",
      value: formatNumber(stats?.activeUsers || 0),
      delta: activeUsersDelta,
    },
    {
      id: "members_by_tier",
      label: "Members by Tier",
      value: String(stats?.membersByTier.percentage || 0),
      suffix: "%",
      delta: membersByTierDelta,
    },
    {
      id: "open_disputes",
      label: "Open Disputes",
      value: formatNumber(stats?.openDisputes || 0),
      delta: openDisputesDelta,
    },
    {
      id: "letters_generated",
      label: "Letters Generated",
      value: formatNumber(stats?.lettersGenerated || 0),
      delta: lettersGeneratedDelta,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {statsData.map((stat) => (
        <StatCard
          key={stat.id}
          label={stat.label}
          value={stat.value}
          suffix={stat.suffix}
          delta={stat.delta}
          deltaLabel="+ vs. last period"
        />
      ))}
    </div>
  );
};

export default StatsOverview;
