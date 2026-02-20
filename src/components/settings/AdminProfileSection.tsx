import React from "react";
import SectionCard from "../shared/layout/SectionCard";
import TextInput from "../shared/inputs/TextInput";
import SettingsSection from "./SettingsSection";
import { useAuth } from "../../auth/AuthProvider";

const AdminProfileSection: React.FC = () => {
  const { user } = useAuth();

  const displayName =
    user?.firebaseUser.displayName ||
    user?.adminData?.displayName ||
    "Paramount Credit Admin";
  const email = user?.firebaseUser.email || "";

  return (
    <SettingsSection title="Admin Profile">
      <SectionCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Display Name" value={displayName} disabled />
          <TextInput label="Email Address" type="email" value={email} disabled />
        </div>
      </SectionCard>
    </SettingsSection>
  );
};

export default AdminProfileSection;
