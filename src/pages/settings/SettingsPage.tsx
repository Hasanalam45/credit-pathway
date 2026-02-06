import React from "react";
import PageHeader from "../../components/shared/layout/PageHeader";
import AdminProfileSection from "../../components/settings/AdminProfileSection";
import SecuritySection from "../../components/settings/SecuritySection";
import IntegrationsSection from "../../components/settings/IntegrationsSection";
import NotificationsSection from "../../components/settings/NotificationsSection";

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <PageHeader title="Settings" />

      <div className="space-y-8">
        <AdminProfileSection />
        <SecuritySection />
        <IntegrationsSection />
        <NotificationsSection />
      </div>
    </div>
  );
};

export default SettingsPage;
