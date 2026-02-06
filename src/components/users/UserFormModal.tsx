// src/components/users/UserFormModal.tsx
import React, { useEffect, useState } from "react";
import Modal from "../shared/overlay/Modal";
import TextInput from "../shared/inputs/TextInput";
import SelectFilter from "../shared/inputs/SelectFilter";
import Button from "../shared/buttons/Button";
import type { User, UserStatus, UserTier } from "./UserTable";

export type UserFormValues = {
  name: string;
  email: string;
  password?: string; // Only for create mode
  tier: UserTier;
  status: UserStatus;
  phone?: string;
  address?: string;
  dateJoined?: string;
  lastActivity?: string;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: User;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
};

const UserFormModal: React.FC<Props> = ({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const [values, setValues] = useState<UserFormValues>({
    name: "",
    email: "",
    password: "",
    tier: "Core",
    status: "active",
    phone: "",
    address: "",
    dateJoined: "",
    lastActivity: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialValues && mode === "edit") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues({
        name: initialValues.name,
        email: initialValues.email,
        tier: initialValues.tier,
        status: initialValues.status,
        phone: initialValues.phone,
        address: initialValues.address,
        dateJoined: initialValues.dateJoined,
        lastActivity: initialValues.lastActivity,
      });
    } else if (mode === "create") {
      setValues({
        name: "",
        email: "",
        password: "",
        tier: "Core",
        status: "active",
        phone: "",
        address: "",
        dateJoined: "",
        lastActivity: "",
      });
    }
    setError(null);
  }, [initialValues, mode, open]);

  const handleChange =
    (field: keyof UserFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim() || !values.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (mode === "create" && !values.password?.trim()) {
      setError("Password is required for new users.");
      return;
    }
    if (mode === "create" && values.password && values.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    onSubmit({
      ...values,
      name: values.name.trim(),
      email: values.email.trim(),
    });
    setSubmitting(false);
  };

  const title =
    mode === "create" ? "Add User" : "Edit User Details";

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      description="Update user profile, membership tier, and account status."
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            type="submit"
            form="user-form"
            disabled={submitting}
          >
            {submitting
              ? "Saving..."
              : mode === "create"
              ? "Create User"
              : "Save Changes"}
          </Button>
        </>
      }
    >
      <form
        id="user-form"
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Full Name"
            value={values.name}
            onChange={handleChange("name")}
            required
          />
          <TextInput
            label="Email Address"
            type="email"
            value={values.email}
            onChange={handleChange("email")}
            required
          />
        </div>

        {mode === "create" && (
          <TextInput
            label="Password"
            type="password"
            value={values.password}
            onChange={handleChange("password")}
            required
            hint="Password must be at least 6 characters"
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Phone Number"
            value={values.phone}
            onChange={handleChange("phone")}
          />
          <TextInput
            label="Address"
            value={values.address}
            onChange={handleChange("address")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              Tier
            </p>
            <SelectFilter
              value={values.tier}
              onChange={(val) =>
                setValues((prev) => ({
                  ...prev,
                    tier: (val as UserTier) || "Core",
                }))
              }
              options={[
                { value: "Core", label: "Core" },
                { value: "Advantage", label: "Advantage" },
                { value: "Pro", label: "Pro" },
              ]}
              placeholder="Select tier"
              className="w-full"
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              Status
            </p>
            <SelectFilter
              value={values.status}
              onChange={(val) =>
                setValues((prev) => ({
                  ...prev,
                  status: (val as UserStatus) || "active",
                }))
              }
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              placeholder="Select status"
              className="w-full"
            />
          </div>

          <div className="grid gap-2">
            <TextInput
              label="Date Joined"
              type="date"
              value={values.dateJoined}
              onChange={handleChange("dateJoined")}
            />
          </div>
        </div>

        {mode === "edit" && (
          <TextInput
            label="Last Activity"
            type="date"
            value={values.lastActivity}
            onChange={handleChange("lastActivity")}
          />
        )}

        {error && (
          <p className="pt-1 text-sm text-red-500">{error}</p>
        )}
      </form>
    </Modal>
  );
};

export default UserFormModal;
