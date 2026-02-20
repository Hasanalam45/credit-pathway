import React, { useState } from "react";
import Modal from "../shared/overlay/Modal";
import TextInput from "../shared/inputs/TextInput";
import Textarea from "../shared/inputs/Textarea";
import SelectFilter from "../shared/inputs/SelectFilter";
import Button from "../shared/buttons/Button";
import type { MembershipTier, Visibility } from "./ContentTable";

export type NewLinkValues = {
  title: string;
  category: string;
  url: string;
  description?: string;
  visibility: Visibility;
  tier: MembershipTier;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (values: NewLinkValues) => void;
  initialValues?: NewLinkValues | null;
  onUpdate?: (values: NewLinkValues) => void;
};

const NewLinkModal: React.FC<Props> = ({
  open,
  onClose,
  onCreate,
  initialValues = null,
  onUpdate,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("visible");
  const [tier, setTier] = useState<MembershipTier>("free");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setCategory("");
    setUrl("");
    setDescription("");
    setVisibility("visible");
    setTier("free");
    setError(null);
  };

  React.useEffect(() => {
    if (open && initialValues) {
      setTitle(initialValues.title);
      setCategory(initialValues.category);
      setUrl(initialValues.url);
      setDescription(initialValues.description || "");
      setVisibility(initialValues.visibility);
      setTier(initialValues.tier);
      setError(null);
    }
    if (!open && !initialValues) {
      reset();
    }
  }, [open, initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim() || !url.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setSubmitting(true);
    const payload: NewLinkValues = {
      title: title.trim(),
      category: category.trim(),
      url: url.trim(),
      description: description.trim() || undefined,
      visibility,
      tier,
    };
    if (onUpdate) {
      onUpdate(payload);
    } else {
      onCreate(payload);
    }
    setSubmitting(false);
    if (!onUpdate) reset();
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => {
        if (!onUpdate) reset();
        onClose();
      }}
      title={onUpdate ? "Edit Resource Link" : "New Resource Link"}
      description={
        onUpdate
          ? "Edit the resource link details and save changes."
          : "Add a credit resource link."
      }
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => {
              if (!onUpdate) reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            type="submit"
            form="new-link-form"
            disabled={submitting}
          >
            {submitting ? (onUpdate ? "Saving..." : "Creating...") : onUpdate ? "Save Changes" : "Create Link"}
          </Button>
        </>
      }
    >
      <form
        id="new-link-form"
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <TextInput
          label="Title"
          placeholder="e.g. Federal Student Aid"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextInput
          label="Category"
          placeholder="e.g. Student Loans"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <TextInput
          label="URL"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              Visibility
            </p>
            <SelectFilter
              value={visibility}
              onChange={(val) =>
                setVisibility((val as Visibility) || "visible")
              }
              options={[
                { value: "visible", label: "Visible" },
                { value: "hidden", label: "Hidden" },
              ]}
              placeholder="Select visibility"
              className="w-full"
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              Membership Tier
            </p>
            <SelectFilter
              value={tier}
              onChange={(val) =>
                setTier((val as MembershipTier) || "free")
              }
              options={[
                { value: "free", label: "Free" },
                { value: "paid", label: "Paid" },
                { value: "vip", label: "VIP" },
              ]}
              placeholder="Select tier"
              className="w-full"
            />
          </div>
        </div>

        <Textarea
          label="Short description (optional)"
          placeholder="A short summary of the resource"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="min-h-[80px]"
        />

        {error && (
          <p className="pt-1 text-sm text-red-500">{error}</p>
        )}
      </form>
    </Modal>
  );
};

export default NewLinkModal;
