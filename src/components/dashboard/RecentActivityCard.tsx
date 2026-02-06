import React from "react";
import SectionCard from "../shared/layout/SectionCard";
import ActivityItem from "../shared/data-display/ActivityItem";
import { useRecentActivities } from "../../hooks/useRecentActivities";
import type { DateRange } from "../../pages/dashboard/DashboardPage";

type Props = {
  dateRange: DateRange;
};

const RecentActivityCard: React.FC<Props> = ({ dateRange }) => {
  const { activities, loading, error } = useRecentActivities(dateRange, 10);

  // Show loading state
  if (loading) {
    return (
      <SectionCard title="Recent Activity" className="h-full">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-gray-200 animate-pulse dark:bg-gray-700"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  // Show error state
  if (error && activities.length === 0) {
    return (
      <SectionCard title="Recent Activity" className="h-full">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-200">
            Error loading activities: {error}
          </p>
        </div>
      </SectionCard>
    );
  }

  // Show empty state
  if (activities.length === 0) {
    return (
      <SectionCard title="Recent Activity" className="h-full">
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No recent activity
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Recent Activity" className="h-full">
      <div className="space-y-4">
        {activities.map((item) => (
          <ActivityItem
            key={item.id}
            title={item.title}
            timeAgo={item.timeAgo}
            colorClass={item.colorClass}
          />
        ))}
      </div>
    </SectionCard>
  );
};

export default RecentActivityCard;
