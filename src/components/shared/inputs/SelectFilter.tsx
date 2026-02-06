import React from "react";
import { cn } from "../../../utils/cn";
import { FiChevronDown } from "react-icons/fi";

export type SelectOption = { label: string; value: string };

type SelectFilterProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
};

const SelectFilter: React.FC<SelectFilterProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select",
  className,
}) => {
  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 overflow-hidden",
        className
      )}
    >
      <select
        className="peer w-full h-full rounded-xl appearance-none bg-inherit pr-8 text-xs font-medium text-gray-800 focus:outline-none sm:text-sm dark:text-gray-200"
        style={{ WebkitAppearance: "none", MozAppearance: "none", backgroundClip: "padding-box" }}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : e.target.value)
        }
      >
        <option value="" className="dark:bg-gray-800 dark:text-gray-200">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="dark:bg-gray-800 dark:text-gray-200">
            {opt.label}
          </option>
        ))}
      </select>
      <FiChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-gray-400 dark:text-gray-400" />
    </div>
  );
};

export default SelectFilter;

