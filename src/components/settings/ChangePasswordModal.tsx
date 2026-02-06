import React, { useState } from "react";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { useAuth } from "../../auth/AuthProvider";
import { validatePassword } from "../../utils/validation";
import Modal from "../shared/overlay/Modal";
import TextInput from "../shared/inputs/TextInput";
import Button from "../shared/buttons/Button";

type Props = {
  open: boolean;
  onClose: () => void;
};

const ChangePasswordModal: React.FC<Props> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    // Reset form when closing
    setCurrentPassword("");
    setNextPassword("");
    setConfirmPassword("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all fields are filled
    if (!currentPassword || !nextPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    // Validate new password matches confirm password
    if (nextPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(nextPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Check if user is logged in
    if (!user?.firebaseUser || !user.firebaseUser.email) {
      setError("No logged in user found.");
      return;
    }

    try {
      setSubmitting(true);

      const firebaseUser = user.firebaseUser;

      // Reauthenticate user with current password
      const credential = EmailAuthProvider.credential(
        firebaseUser.email ?? "",
        currentPassword
      );
      await reauthenticateWithCredential(firebaseUser, credential);

      // Update password
      await updatePassword(firebaseUser, nextPassword);

      // Success - close modal and reset form
      setSubmitting(false);
      handleClose();
    } catch (err: any) {
      setSubmitting(false);

      // Handle Firebase Auth errors
      if (err.code === "auth/wrong-password") {
        setError("Current password is incorrect.");
      } else if (err.code === "auth/weak-password") {
        setError("The new password is too weak.");
      } else if (err.code === "auth/requires-recent-login") {
        setError("Please log in again and then change your password.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your connection.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.");
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Failed to update password. Please try again.");
      }
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="Change Password"
      description="Update your account password. Make sure it's at least 8 characters long."
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            type="submit"
            form="change-password-form"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save Password"}
          </Button>
        </>
      }
    >
      <form
        id="change-password-form"
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <TextInput
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <TextInput
          label="New Password"
          type="password"
          value={nextPassword}
          onChange={(e) => setNextPassword(e.target.value)}
          hint="Minimum 8 characters, with a mix of letters and numbers."
        />
        <TextInput
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && (
          <p className="pt-1 text-sm text-red-500">{error}</p>
        )}
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
