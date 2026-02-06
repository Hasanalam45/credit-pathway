// src/pages/reports/ReportsPage.tsx
import React, { useMemo, useState } from "react";
import PageHeader from "../../components/shared/layout/PageHeader";
import ReportsTabs, { type ReportsTab } from "../../components/reports/ReportsTabs";
import UserJourneyTable, {
  type UserJourney,
} from "../../components/reports/UserJourneyTable";
import UserJourneyDrawer from "../../components/reports/UserJourneyDrawer";
import DisputesLettersCard from "../../components/reports/DisputesLettersCard";
import MailingLogsCard from "../../components/reports/MailingLogsCard";
import IssuesSupportCard from "../../components/reports/IssuesSupportCard";
import DateRangeFilter from "../../components/dashboard/DateRangeFilter";
import type { DateRange } from "../dashboard/DashboardPage";
import { useUserJourneys } from "../../hooks/useUserJourneys";

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportsTab>("journeys");
  const [dateRange, setDateRange] = useState<DateRange>("last_30_days");

  const [journeySearch, setJourneySearch] = useState("");
  const [selectedJourney, setSelectedJourney] =
    useState<UserJourney | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch user journeys from Firebase with date range filtering
  const { journeys, loading, error } = useUserJourneys(dateRange);

  const filteredJourneys = useMemo(() => {
    const q = journeySearch.toLowerCase().trim();
    if (!q) return journeys;
    return journeys.filter(
      (j) =>
        j.name.toLowerCase().includes(q) ||
        j.email.toLowerCase().includes(q) ||
        j.plan.toLowerCase().includes(q)
    );
  }, [journeySearch, journeys]);

  const handleJourneyClick = (journey: UserJourney) => {
    setSelectedJourney(journey);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Monitor user journeys, disputes, mailing activity, and support issues."
        rightContent={
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
          />
        }
      />

      <ReportsTabs value={activeTab} onChange={setActiveTab} />

      {activeTab === "journeys" && (
        <>
          {loading && (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
              <p className="text-sm text-gray-500">Loading user journeys...</p>
            </div>
          )}
          {error && (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
              <p className="text-sm text-red-600">Error: {error}</p>
            </div>
          )}
          {!loading && !error && (
            <>
              <UserJourneyTable
                journeys={filteredJourneys}
                search={journeySearch}
                onSearchChange={setJourneySearch}
                onRowClick={handleJourneyClick}
              />
              <UserJourneyDrawer
                open={drawerOpen}
                journey={selectedJourney}
                onClose={() => setDrawerOpen(false)}
              />
            </>
          )}
        </>
      )}

      {activeTab === "disputes" && (
        <DisputesLettersCard dateRange={dateRange} />
      )}

      {activeTab === "mail" && <MailingLogsCard dateRange={dateRange} />}

      {activeTab === "issues" && <IssuesSupportCard dateRange={dateRange} />}
    </div>
  );
};

export default ReportsPage;
