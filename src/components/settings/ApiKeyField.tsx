import React, { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import { cn } from "../../utils/cn";

type ApiKeyFieldProps = {
  label: string;
  description?: string;
  value: string;
};

const ApiKeyField: React.FC<ApiKeyFieldProps> = ({
  label,
  description,
  value,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy key", err);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-md">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      <div className="mt-1 flex items-center gap-2 sm:mt-0">
        <div className="flex items-center rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500 sm:text-sm dark:bg-gray-800 dark:text-gray-100">
          <span className="truncate">
            {value}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
            copied
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          )}
        >
          {copied ? (
            <>
              <FiCheck className="mr-1.5 h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <FiCopy className="mr-1.5 h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ApiKeyField;
