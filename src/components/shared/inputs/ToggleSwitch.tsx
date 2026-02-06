import React from "react";
import { cn } from "../../../utils/cn";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled,
}) => {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors",
        checked
          ? "border-[#D4A317] bg-[#D4A317]"
          : "border-gray-300 bg-gray-200 dark:border-gray-700 dark:bg-gray-700",
        disabled && "opacity-60 cursor-not-allowed"
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform dark:bg-gray-200",
          checked ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  );
};

export default ToggleSwitch;

