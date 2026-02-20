import React, { useState } from "react";
import SectionCard from "../shared/layout/SectionCard";
import Button from "../shared/buttons/Button";
import ToggleSwitch from "../shared/inputs/ToggleSwitch";
import SettingsSection from "./SettingsSection";
import ChangePasswordModal from "./ChangePasswordModal";
import { useAuth } from "../../auth/AuthProvider";

const SecuritySection: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [updating2FA, setUpdating2FA] = useState(false);

  const twoFactorEnabled = user?.adminData.twoFactor?.enabled || false;

  const handleToggle2FA = async (enabled: boolean) => {
    setUpdating2FA(true);
    try {
      await updateProfile({
        twoFactor: {
          enabled,
          method: enabled ? "email" : "none",
          emailAddress: user?.adminData.email,
        },
      });
    } catch (error: any) {
      console.error("Error updating 2FA:", error);
      alert(error.message || "Failed to update 2FA settings");
    } finally {
      setUpdating2FA(false);
    }
  };

  return (
    <SettingsSection title="Security">
      <SectionCard>
        <div className="space-y-6">
          {/* Password row */}
          <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-gray-700 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Password
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                It's a good idea to update your password regularly.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPasswordModalOpen(true)}
            >
              Change Password
            </Button>
          </div>

          {/* 2FA row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Two-Factor Authentication
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enhance your account security by requiring an email verification code on login.
              </p>
              {twoFactorEnabled && (
                <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                  ✓ Verification codes will be sent to: {user?.adminData.email}
                </p>
              )}
            </div>
            <ToggleSwitch
              checked={twoFactorEnabled}
              onChange={handleToggle2FA}
              disabled={updating2FA}
            />
          </div>
        </div>
      </SectionCard>

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </SettingsSection>
  );
};

export default SecuritySection;
