import React, { useState } from "react";
import SectionCard from "../shared/layout/SectionCard";
import ToggleSwitch from "../shared/inputs/ToggleSwitch";
import SettingsSection from "./SettingsSection";
import { useAuth } from "../../auth/AuthProvider";
import type { DashboardAlertsPreferences } from "../../services/authService";

const ALERT_ITEMS: { id: keyof DashboardAlertsPreferences; label: string }[] = [
  { id: "systemFailure", label: "System Failure" },
  { id: "newUserRegistration", label: "New User Registration" },
  { id: "apiError", label: "API Error" },
];

const NotificationsSection: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const dashboardAlerts: DashboardAlertsPreferences = user?.adminData?.dashboardAlerts ?? {
    systemFailure: true,
    newUserRegistration: true,
    apiError: true,
  };

  const handleToggle = async (id: keyof DashboardAlertsPreferences, checked: boolean) => {
    setSaving(true);
    try {
      await updateProfile({
        dashboardAlerts: { ...dashboardAlerts, [id]: checked },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSection title="Notifications">
      <SectionCard
        title="Email & Dashboard Alerts"
        subtitle="Choose which notifications you want to receive."
      >
        <div className="space-y-4">
          {ALERT_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {item.label}
              </span>
              <ToggleSwitch
                checked={dashboardAlerts[item.id]}
                onChange={(checked) => handleToggle(item.id, checked)}
                disabled={saving}
              />
            </div>
          ))}
        </div>
      </SectionCard>
    </SettingsSection>
  );
};

export default NotificationsSection;
