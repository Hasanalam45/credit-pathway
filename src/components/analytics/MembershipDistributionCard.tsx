// src/components/analytics/MembershipDistributionCard.tsx
import React from "react";
import DonutChartCard from "../shared/charts/DonutChartCard";
import { useMembershipDistribution } from "../../hooks/useMembershipDistribution";

const MembershipDistributionCard: React.FC = () => {
  const { data, loading, error } = useMembershipDistribution();

  if (error) {
    return (
      <DonutChartCard
        title="Membership Distribution"
        subtitle="Breakdown of user tiers"
        data={[]}
      />
    );
  }

  if (loading) {
    return (
      <DonutChartCard
        title="Membership Distribution"
        subtitle="Breakdown of user tiers"
        data={[]}
      />
    );
  }

  return (
    <DonutChartCard
      title="Membership Distribution"
      subtitle="Breakdown of user tiers"
      data={data}
    />
  );
};

export default MembershipDistributionCard;
