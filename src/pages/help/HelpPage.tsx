// src/pages/help/HelpPage.tsx
import React from "react";
import PageHeader from "../../components/shared/layout/PageHeader";
import FAQSection from "../../components/help/FAQSection";
import HelpContactCard from "../../components/help/HelpContactCard";
import HelpQuickLinksCard from "../../components/help/HelpQuickLinksCard";

const HelpPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Support"
        description="Find quick answers, learn how the admin works, and contact support if you get stuck."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Main FAQs */}
        <FAQSection />

        {/* Right rail: contact + quick links */}
        <div className="space-y-4">
          <HelpContactCard />
          <HelpQuickLinksCard />
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
