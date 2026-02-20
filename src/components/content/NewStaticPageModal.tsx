import React, { useState } from "react";
import Modal from "../shared/overlay/Modal";
import TextInput from "../shared/inputs/TextInput";
import Textarea from "../shared/inputs/Textarea";
import SelectFilter from "../shared/inputs/SelectFilter";
import Button from "../shared/buttons/Button";
import type { MembershipTier, Visibility } from "./ContentTable";

export type NewStaticPageValues = {
  title: string;
  slug: string;
  category: string;
  content: string;
  previewContent?: string;
  metaTitle?: string;
  metaDescription?: string;
  visibility: Visibility;
  tier: MembershipTier;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (values: NewStaticPageValues) => void;
  initialValues?: NewStaticPageValues | null;
  onUpdate?: (values: NewStaticPageValues) => void;
};

const NewStaticPageModal: React.FC<Props> = ({
  open,
  onClose,
  onCreate,
  initialValues = null,
  onUpdate,
}) => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("visible");
  const [tier, setTier] = useState<MembershipTier>("free");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setSlug("");
    setCategory("");
    setContent("");
    setPreviewContent("");
    setMetaTitle("");
    setMetaDescription("");
    setVisibility("visible");
    setTier("free");
    setError(null);
  };

  React.useEffect(() => {
    if (open && initialValues) {
      setTitle(initialValues.title);
      setSlug(initialValues.slug);
      setCategory(initialValues.category);
      setContent(initialValues.content);
      setPreviewContent(initialValues.previewContent || "");
      setMetaTitle(initialValues.metaTitle || "");
      setMetaDescription(initialValues.metaDescription || "");
      setVisibility(initialValues.visibility);
      setTier(initialValues.tier);
      setError(null);
    }
    if (!open && !initialValues) {
      reset();
    }
  }, [open, initialValues]);

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Only auto-generate slug if it hasn't been manually edited
    if (!initialValues) {
      const generatedSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !category.trim() || !content.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError("Slug can only contain lowercase letters, numbers, and hyphens.");
      return;
    }

    setSubmitting(true);
    const payload: NewStaticPageValues = {
      title: title.trim(),
      slug: slug.trim(),
      category: category.trim(),
      content: content.trim(),
      previewContent: previewContent.trim() || undefined,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
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
      title={onUpdate ? "Edit Static Page" : "New Static Page"}
      description={
        onUpdate
          ? "Edit the static page details and save changes."
          : "Create a new static page for the site."
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
            form="new-static-page-form"
            disabled={submitting}
          >
            {submitting ? (onUpdate ? "Saving..." : "Creating...") : onUpdate ? "Save Changes" : "Create Page"}
          </Button>
        </>
      }
    >
      <form
        id="new-static-page-form"
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <TextInput
          label="Title"
          placeholder="Page title"
          value={title}
          onChange={handleTitleChange}
        />
        
        <TextInput
          label="Slug"
          placeholder="about-us"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          hint="URL-friendly identifier (lowercase, hyphens only)"
        />

        <TextInput
          label="Category"
          placeholder="General"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <Textarea
          label="Content"
          placeholder="Full page content (HTML or Markdown supported)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="min-h-[200px]"
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
          label="Preview content"
          placeholder="Short preview or excerpt"
          value={previewContent}
          onChange={(e) => setPreviewContent(e.target.value)}
          rows={3}
          className="min-h-[80px]"
        />

        <TextInput
          label="Meta title (optional)"
          placeholder="SEO meta title"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
        />

        <Textarea
          label="Meta description (optional)"
          placeholder="SEO meta description"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          rows={2}
          className="min-h-[60px]"
        />

        {error && (
          <p className="pt-1 text-sm text-red-500">{error}</p>
        )}
      </form>
    </Modal>
  );
};

export default NewStaticPageModal;
