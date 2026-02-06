import React, { useState } from "react";
import Modal from "../shared/overlay/Modal";
import TextInput from "../shared/inputs/TextInput";
import SelectFilter from "../shared/inputs/SelectFilter";
import Button from "../shared/buttons/Button";
import type { MembershipTier, Visibility } from "./ContentTable";

export type NewArticleValues = {
  title: string;
  category: string;
  visibility: Visibility;
  tier: MembershipTier;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (values: NewArticleValues) => void;
  /** Optional initial values for editing an existing article */
  initialValues?: NewArticleValues | null;
  /** Called when editing an existing article */
  onUpdate?: (values: NewArticleValues) => void;
};

const NewArticleModal: React.FC<Props> = ({
  open,
  onClose,
  onCreate,
  initialValues = null,
  onUpdate,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("visible");
  const [tier, setTier] = useState<MembershipTier>("free");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setCategory("");
    setVisibility("visible");
    setTier("free");
    setError(null);
  };

  React.useEffect(() => {
    if (open && initialValues) {
      setTitle(initialValues.title);
      setCategory(initialValues.category);
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
    if (!title.trim() || !category.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    const payload = {
      title: title.trim(),
      category: category.trim(),
      visibility,
      tier,
    };
    if (onUpdate) {
      onUpdate(payload);
    } else {
      onCreate(payload);
    }
    setSubmitting(false);
    // only reset when creating new
    if (!onUpdate) reset();
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => {
        // reset only when creating
        if (!onUpdate) reset();
        onClose();
      }}
      title={onUpdate ? "Edit Article" : "New Article"}
      description={
        onUpdate
          ? "Edit the article details and save changes."
          : "Create a new educational article for your content library."
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
            form="new-article-form"
            disabled={submitting}
          >
            {submitting ? (onUpdate ? "Saving..." : "Creating...") : onUpdate ? "Save Changes" : "Create Article"}
          </Button>
        </>
      }
    >
      <form
        id="new-article-form"
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <TextInput
          label="Title"
          placeholder="e.g. Understanding Your Credit Score"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextInput
          label="Category"
          placeholder="e.g. Credit Health"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-700">
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
            <p className="mb-1 text-xs font-medium text-gray-700">
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

        {error && (
          <p className="pt-1 text-sm text-red-500">{error}</p>
        )}
      </form>
    </Modal>
  );
};

export default NewArticleModal;
