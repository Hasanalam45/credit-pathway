// src/components/analytics/TopArticlesCard.tsx
import React from "react";
import SectionCard from "../shared/layout/SectionCard";
import ProgressBarRow from "../shared/data-display/ProgressBarRow";
import { useTopArticles } from "../../hooks/useTopArticles";
import type { AnalyticsRange } from "../../pages/analytics/AnalyticsPage";

type Props = {
  range: AnalyticsRange;
  customStartDate?: string;
  customEndDate?: string;
};

const TopArticlesCard: React.FC<Props> = ({ range, customStartDate, customEndDate }) => {
  const { data: articles, loading, error } = useTopArticles(range, customStartDate, customEndDate);

  const subtitle =
    range === "last_7_days"
      ? "Top 5 Articles · Engagement in the last 7 days"
      : range === "last_30_days"
      ? "Top 5 Articles · Engagement in the last 30 days"
      : range === "this_month"
      ? "Top 5 Articles · Engagement this month"
      : range === "this_quarter"
      ? "Top 5 Articles · Engagement this quarter"
      : "Top 5 Articles · Engagement in custom range";

  if (error) {
    return (
      <SectionCard title="Content Performance" subtitle={subtitle}>
        <div className="py-8 text-center text-sm text-red-500">{error}</div>
      </SectionCard>
    );
  }

  if (loading) {
    return (
      <SectionCard title="Content Performance" subtitle={subtitle}>
        <div className="py-8 text-center text-sm text-gray-500">
          Loading articles...
        </div>
      </SectionCard>
    );
  }

  if (articles.length === 0) {
    return (
      <SectionCard title="Content Performance" subtitle={subtitle}>
        <div className="py-8 text-center text-sm text-gray-500">
          No articles available.
        </div>
      </SectionCard>
    );
  }

  const max = Math.max(...articles.map((a) => a.views), 1); // Avoid division by zero

  return (
    <SectionCard title="Content Performance" subtitle={subtitle}>
      <div className="mt-2 space-y-3">
        {articles.map((article) => {
          const displayValue = article.views > 0 
            ? article.views >= 1000 
              ? `${(article.views / 1000).toFixed(1)}k` 
              : article.views.toString()
            : "No tracking";
          
          return (
            <ProgressBarRow
              key={article.title}
              label={article.title}
              value={displayValue}
              percent={article.views > 0 ? (article.views / max) * 100 : 0}
            />
          );
        })}
      </div>
    </SectionCard>
  );
};

export default TopArticlesCard;
