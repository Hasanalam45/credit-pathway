import React from "react";
import { cn } from "../../../utils/cn";

export type PillTone = "default" | "gold" | "gray";

type PillProps = {
  children: React.ReactNode;
  tone?: PillTone;
  className?: string;
};

const toneClasses: Record<PillTone, string> = {
  default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
  gold: "bg-[#FFF6D4] text-[#8F6B00] dark:bg-amber-700 dark:text-amber-100",
  gray: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
};

const Pill: React.FC<PillProps> = ({ children, tone = "default", className }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Pill;

