import React from "react";
import { cn } from "../../../utils/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  hint,
  error,
  wrapperClassName,
  className,
  id,
  ...props
}) => {
  const textareaId = id || props.name || undefined;
  const hasError = Boolean(error);

  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm dark:text-gray-300"
        >
          {label}
        </label>
      )}

      <textarea
        id={textareaId}
        className={cn(
          "w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4A317] focus:ring-offset-1 focus:ring-offset-[#F7F5F1] dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 dark:focus:ring-offset-gray-900 resize-y min-h-[120px]",
          hasError ? "border-red-300" : "border-gray-200",
          className
        )}
        {...props}
      />

      {hint && !error && (
        <p className="mt-1 text-xs text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Textarea;

