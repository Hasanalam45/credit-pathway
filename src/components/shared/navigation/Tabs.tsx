import React from "react";
import { cn } from "../../../utils/cn";

export type Tab = {
  label: string;
  value: string;
};

type TabsProps = {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  variant?: "underline" | "pills";
};

const Tabs: React.FC<TabsProps> = ({
  tabs,
  value,
  onChange,
  variant = "underline",
}) => {
    if (variant === "underline") {
    return (
      <div className="border-b border-gray-200">
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <nav className="-mb-px flex gap-6 text-sm flex-nowrap">
          {tabs.map((tab) => {
            const active = tab.value === value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onChange(tab.value)}
                className={cn(
                  "whitespace-nowrap border-b-2 pb-2 font-medium transition-colors",
                  active
                    ? "border-[#D4A317] text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200"
                )}
              >
                {tab.label}
              </button>
            );
          })}
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex gap-1 rounded-full bg-gray-100 p-1 text-xs">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "rounded-full px-3 py-1 font-medium",
              active
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;

