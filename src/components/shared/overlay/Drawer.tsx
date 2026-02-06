import React from "react";
import { cn } from "../../../utils/cn";
import { FiX } from "react-icons/fi";

type DrawerProps = {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName?: string; // e.g. "w-full sm:w-[420px]"
};

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  title,
  onClose,
  children,
  widthClassName = "w-full max-w-md",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-50 flex h-full flex-col bg-white shadow-2xl dark:bg-gray-900 dark:shadow-none",
          widthClassName
        )}
      >
        <header className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-gray-900 sm:text-base dark:text-gray-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <FiX className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 text-sm text-gray-700 dark:text-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Drawer;

