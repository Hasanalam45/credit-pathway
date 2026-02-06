import React, { useState } from "react";
import SectionCard from "../shared/layout/SectionCard";
import Button from "../shared/buttons/Button";
import ToggleSwitch from "../shared/inputs/ToggleSwitch";
import SettingsSection from "./SettingsSection";
import ChangePasswordModal from "./ChangePasswordModal";

const SecuritySection: React.FC = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  return (
    <SettingsSection title="Security">
      <SectionCard>
        <div className="space-y-6">
          {/* Password row */}
          <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Password
              </p>
              <p className="text-xs text-gray-500">
                It’s a good idea to update your password regularly.
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
              <p className="text-sm font-medium text-gray-900">
                Two-Factor Authentication
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Enhance your account security by requiring a code on
                login.
              </p>
            </div>
            <ToggleSwitch
              checked={twoFactorEnabled}
              onChange={setTwoFactorEnabled}
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
