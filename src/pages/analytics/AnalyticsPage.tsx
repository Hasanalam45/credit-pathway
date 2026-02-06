// src/pages/analytics/AnalyticsPage.tsx
import React, { useState } from "react";
import PageHeader from "../../components/shared/layout/PageHeader";
import Button from "../../components/shared/buttons/Button";
import TimeRangeTabs from "../../components/analytics/TimeRangeTabs";
import DailyActiveUsersCard from "../../components/analytics/DailyActiveUsersCard";
import WeeklyActiveUsersCard from "../../components/analytics/WeeklyActiveUsersCard";
import MembershipDistributionCard from "../../components/analytics/MembershipDistributionCard";
import SystemEngagementCard from "../../components/analytics/SystemEngagementCard";
import TopArticlesCard from "../../components/analytics/TopArticlesCard";
import ExportDataModal from "../../components/analytics/ExportDataModal";

export type AnalyticsRange =
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "this_quarter"
  | "custom";

const AnalyticsPage: React.FC = () => {
  const [range, setRange] = useState<AnalyticsRange>("last_7_days");
  const [exportOpen, setExportOpen] = useState(false);
  
  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Dashboard"
        description="Key performance indicators for Paramount Credit Pathway."
        rightContent={
          <Button
            variant="secondary"
            onClick={() => setExportOpen(true)}
          >
            Export Data
          </Button>
        }
      />

      {/* Range tabs directly under the header */}
      <TimeRangeTabs
        value={range}
        onChange={setRange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomStartDateChange={setCustomStartDate}
        onCustomEndDateChange={setCustomEndDate}
      />

      {/* First row: DAU + WAU */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DailyActiveUsersCard
          range={range}
          customStartDate={range === "custom" ? customStartDate : undefined}
          customEndDate={range === "custom" ? customEndDate : undefined}
        />
        <WeeklyActiveUsersCard
          range={range}
          customStartDate={range === "custom" ? customStartDate : undefined}
          customEndDate={range === "custom" ? customEndDate : undefined}
        />
      </div>

      {/* Second row: Membership donut + system engagement */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MembershipDistributionCard />
        <SystemEngagementCard
          range={range}
          customStartDate={range === "custom" ? customStartDate : undefined}
          customEndDate={range === "custom" ? customEndDate : undefined}
        />
      </div>

      {/* Third row: Top 5 articles */}
      <TopArticlesCard
        range={range}
        customStartDate={range === "custom" ? customStartDate : undefined}
        customEndDate={range === "custom" ? customEndDate : undefined}
      />

      <ExportDataModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        defaultRange={range}
      />
    </div>
  );
};

export default AnalyticsPage;
