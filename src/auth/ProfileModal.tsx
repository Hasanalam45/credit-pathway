import React, { useState } from "react";
import Modal from "../components/shared/overlay/Modal";
import { useAuth } from "./AuthProvider";
import TextInput from "../components/shared/inputs/TextInput";
import Button from "../components/shared/buttons/Button";

type Props = {
  open: boolean;
  onClose: () => void;
};

const ProfileModal: React.FC<Props> = ({ open, onClose }) => {
  const { user, updateProfile } = useAuth();

  const [email, setEmail] = useState<string>(() => user?.email ?? "");

  const handleCancel = () => {
    // Reset back to the latest user email when closing
    setEmail(user?.email ?? "");
    onClose();
  };

  const handleSave = () => {
    updateProfile({ email });
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleCancel}
      title="Profile Settings"
      size="sm"
    >
      <div className="space-y-3">
        <TextInput
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button size="sm" type="button" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileModal;
