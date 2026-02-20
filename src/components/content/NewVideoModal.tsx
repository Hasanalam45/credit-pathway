import React, { useState } from "react";
import Modal from "../shared/overlay/Modal";
import TextInput from "../shared/inputs/TextInput";
import SelectFilter from "../shared/inputs/SelectFilter";
import Button from "../shared/buttons/Button";
import type { MembershipTier, Visibility } from "./ContentTable";
import { uploadVideo, formatFileSize } from "../../services/storageService";

export type NewVideoValues = {
  title: string;
  category: string;
  videoUrl?: string; // Optional for edit mode
  thumbnailUrl?: string;
  duration?: string;
  visibility: Visibility;
  tier: MembershipTier;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (values: NewVideoValues) => void;
  initialValues?: NewVideoValues | null;
  onUpdate?: (values: NewVideoValues) => void;
};

const NewVideoModal: React.FC<Props> = ({
  open,
  onClose,
  onCreate,
  initialValues = null,
  onUpdate,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("visible");
  const [tier, setTier] = useState<MembershipTier>("free");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const reset = () => {
    setTitle("");
    setCategory("");
    setVideoFile(null);
    setVideoUrl("");
    setThumbnailUrl("");
    setDuration("");
    setVisibility("visible");
    setTier("free");
    setError(null);
    setUploading(false);
    setUploadProgress(0);
  };

  React.useEffect(() => {
    if (open && initialValues) {
      setTitle(initialValues.title);
      setCategory(initialValues.category);
      setVideoUrl(initialValues.videoUrl || "");
      setThumbnailUrl(initialValues.thumbnailUrl || "");
      setDuration(initialValues.duration || "");
      setVisibility(initialValues.visibility);
      setTier(initialValues.tier);
      setError(null);
    }
    if (!open && !initialValues) {
      reset();
    }
  }, [open, initialValues]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("video/")) {
        setError("Please select a valid video file");
        return;
      }
      
      // Validate file size (500MB)
      const MAX_SIZE = 500 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setError("Video file size must be less than 500MB");
        return;
      }
      
      setVideoFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !category.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    
    // For create mode, video file is required
    // For edit mode, video file is optional (keeps existing video)
    if (!onUpdate && !videoFile) {
      setError("Please select a video file to upload.");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      let uploadedVideoUrl = videoUrl; // Use existing URL for edit mode
      
      // If a new video file is selected, upload it
      if (videoFile) {
        setUploading(true);
        uploadedVideoUrl = await uploadVideo(videoFile, (progress) => {
          setUploadProgress(progress.progress);
        });
        setUploading(false);
      }
      
      // Prepare payload
      const payload: NewVideoValues = {
        title: title.trim(),
        category: category.trim(),
        videoUrl: uploadedVideoUrl,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        duration: duration.trim() || undefined,
        visibility,
        tier,
      };
      
      if (onUpdate) {
        onUpdate(payload);
      } else {
        onCreate(payload);
      }
      
      if (!onUpdate) reset();
    } catch (error: any) {
      console.error("Error uploading video:", error);
      setError(error.message || "Failed to upload video. Please try again.");
      setUploading(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => {
        if (!onUpdate) reset();
        onClose();
      }}
      title={onUpdate ? "Edit Video" : "New Video"}
      description={
        onUpdate
          ? "Edit the video details and save changes."
          : "Add a new video to the content library."
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
            form="new-video-form"
            disabled={submitting || uploading}
          >
            {uploading 
              ? `Uploading... ${uploadProgress}%` 
              : submitting 
                ? (onUpdate ? "Saving..." : "Creating...") 
                : onUpdate 
                  ? "Save Changes" 
                  : "Create Video"
            }
          </Button>
        </>
      }
    >
      <form
        id="new-video-form"
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <TextInput
          label="Title"
          placeholder="e.g. How credit scores are calculated"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextInput
          label="Category"
          placeholder="e.g. Credit Health"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Video file {!onUpdate && <span className="text-red-500">*</span>}
            {onUpdate && <span className="text-gray-500 font-normal">(optional - leave empty to keep existing video)</span>}
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                id="video-file-input"
                disabled={uploading || submitting}
              />
              <label
                htmlFor="video-file-input"
                className={`cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${
                  uploading || submitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Choose File
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {videoFile ? `${videoFile.name} (${formatFileSize(videoFile.size)})` : "No file chosen"}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Maximum file size: 500MB. Supported formats: MP4, MOV, AVI, etc.
            </p>
            
            {uploading && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Uploading video...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full bg-[#D4A317] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

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

        <TextInput
          label="Thumbnail URL"
          placeholder="https://example.com/thumbnail.jpg"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          hint="Optional: URL of the video thumbnail image"
        />

        <TextInput
          label="Duration"
          placeholder="e.g. 8:32 or 1:15:30"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          hint="Format: MM:SS or HH:MM:SS"
        />

        {error && (
          <p className="pt-1 text-sm text-red-500">{error}</p>
        )}
      </form>
    </Modal>
  );
};

export default NewVideoModal;
