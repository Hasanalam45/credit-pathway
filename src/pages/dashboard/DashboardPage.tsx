import React, { useState } from "react";
import PageHeader from "../../components/shared/layout/PageHeader";
import Button from "../../components/shared/buttons/Button";
import DateRangeFilter from "../../components/dashboard/DateRangeFilter";
import StatsOverview from "../../components/dashboard/StatsOverview";
import UsageEngagementCard from "../../components/dashboard/UsageEngagementCard";
import RecentActivityCard from "../../components/dashboard/RecentActivityCard";
import QuickLinksCard from "../../components/dashboard/QuickLinksCard"; // 👈 NEW
import { getDashboardStats } from "../../services/dashboardService";
import { formatNumber, getDeltaPercentage } from "../../hooks/useDashboardStats";

export type DateRange =
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "this_quarter"
  | "all_time";

const DashboardPage: React.FC = () => {
  const [range, setRange] = useState<DateRange>("last_7_days");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);

      // Fetch real data from Firebase
      const stats = await getDashboardStats(range);

      // Calculate deltas from previous period (same logic as StatsOverview)
      const totalUsersDelta = stats.previousPeriodStats
        ? getDeltaPercentage(stats.totalUsers, stats.previousPeriodStats.totalUsers)
        : 0;

      const activeUsersDelta = stats.previousPeriodStats
        ? getDeltaPercentage(stats.activeUsers, stats.previousPeriodStats.activeUsers)
        : 0;

      const membersByTierDelta = stats.previousPeriodStats
        ? getDeltaPercentage(
            stats.membersByTier.percentage,
            stats.previousPeriodStats.membersByTier
          )
        : 0;

      const openDisputesDelta = stats.previousPeriodStats
        ? getDeltaPercentage(stats.openDisputes, stats.previousPeriodStats.openDisputes)
        : 0;

      const lettersGeneratedDelta = stats.previousPeriodStats
        ? getDeltaPercentage(
            stats.lettersGenerated,
            stats.previousPeriodStats.lettersGenerated
          )
        : 0;

      // Build stats array with real data
      const statsData = [
        {
          id: "total_users",
          label: "Total Users",
          value: formatNumber(stats.totalUsers),
          delta: totalUsersDelta,
        },
        {
          id: "active_users",
          label: "Active Users",
          value: formatNumber(stats.activeUsers),
          delta: activeUsersDelta,
        },
        {
          id: "members_by_tier",
          label: "Members by Tier",
          value: String(stats.membersByTier.percentage),
          suffix: "%",
          delta: membersByTierDelta,
        },
        {
          id: "open_disputes",
          label: "Open Disputes",
          value: formatNumber(stats.openDisputes),
          delta: openDisputesDelta,
        },
        {
          id: "letters_generated",
          label: "Letters Generated",
          value: formatNumber(stats.lettersGenerated),
          delta: lettersGeneratedDelta,
        },
      ];

      // Build CSV
      const header = ["id", "label", "value", "delta", "range"];
      const rows = [header.join(",")];
      for (const s of statsData) {
        const row = [
          s.id,
          `"${String(s.label).replace(/"/g, '""')}"`,
          String(s.value + (s.suffix || "")),
          String(s.delta.toFixed(1)),
          range,
        ];
        rows.push(row.join(","));
      }

      const csv = rows.join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `report-${range}-${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate report:", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="High-level overview of system health & activity."
        rightContent={
          <>
            <DateRangeFilter value={range} onChange={setRange} />
            <Button onClick={handleGenerateReport} disabled={isGenerating}>
              {isGenerating ? "Generating…" : "Generate Report"}
            </Button>
          </>
        }
      />

      {/* KPI cards row */}
      <StatsOverview dateRange={range} />

      {/* Usage chart + side column */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 gap-3">
          <UsageEngagementCard dateRange={range} />
          <QuickLinksCard />
        </div>
        
        {/* Right column: Recent Activity + Quick Links */}
        <div className="space-y-4">
          <RecentActivityCard dateRange={range} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
