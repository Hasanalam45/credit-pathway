import React from "react";
import { cn } from "../../../utils/cn";
import { FiX } from "react-icons/fi";

export type ModalSize = "sm" | "md" | "lg";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  className?: string;
};

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* panel */}
      <div
        className={cn(
          "relative z-50 w-full translate-y-0 rounded-2xl bg-white p-4 shadow-2xl sm:p-5 dark:bg-gray-900 dark:shadow-none",
          sizeClasses[size],
          className
        )}
      >
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-gray-900 sm:text-base dark:text-gray-100">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            aria-label="Close modal"
          >
            <FiX className="h-4 w-4" />
          </button>
        </header>

        {children && (
          <div className="mb-4 max-h-[60vh] overflow-y-auto text-sm text-gray-700 dark:text-gray-200">
            {children}
          </div>
        )}

        {footer && (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;

