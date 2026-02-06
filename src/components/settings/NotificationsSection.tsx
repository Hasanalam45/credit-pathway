import React, { useState } from "react";
import SectionCard from "../shared/layout/SectionCard";
import ToggleSwitch from "../shared/inputs/ToggleSwitch";
import SettingsSection from "./SettingsSection";

type NotificationToggle = {
  id: string;
  label: string;
};

const NotificationsSection: React.FC = () => {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    systemFailure: true,
    newUser: true,
    apiError: false,
  });

  const items: NotificationToggle[] = [
    { id: "systemFailure", label: "System Failure" },
    { id: "newUser", label: "New User Registration" },
    { id: "apiError", label: "API Error" },
  ];

  const handleToggle = (id: string, checked: boolean) => {
    setToggles((prev) => ({ ...prev, [id]: checked }));
  };

  return (
    <SettingsSection title="Notifications">
      <SectionCard
        title="Email & Dashboard Alerts"
        subtitle="Choose which notifications you want to receive."
      >
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm text-gray-900">
                {item.label}
              </span>
              <ToggleSwitch
                checked={toggles[item.id]}
                onChange={(checked) => handleToggle(item.id, checked)}
              />
            </div>
          ))}
        </div>
      </SectionCard>
    </SettingsSection>
  );
};

export default NotificationsSection;
