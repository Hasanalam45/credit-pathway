import React from "react";
import SectionCard from "../shared/layout/SectionCard";
import SettingsSection from "./SettingsSection";
import ApiKeyField from "./ApiKeyField";

const IntegrationsSection: React.FC = () => {
  const apiKeys = [
    {
      id: "credit",
      label: "Credit Monitoring Service",
      description: "Used for credit data access.",
      value: "cred_live_************************",
    },
    {
      id: "mail",
      label: "Mailing Service",
      description: "Used for sending transactional emails.",
      value: "mail_live_************************",
    },
    {
      id: "analytics",
      label: "Analytics Service",
      description: "Used for tracking application usage.",
      value: "analyt_live_************************",
    },
  ];

  return (
    <SettingsSection title="Integrations">
      <SectionCard title="API Keys">
        <div className="space-y-5">
          {apiKeys.map((key) => (
            <ApiKeyField
              key={key.id}
              label={key.label}
              description={key.description}
              value={key.value}
            />
          ))}
        </div>
      </SectionCard>
    </SettingsSection>
  );
};

export default IntegrationsSection;
