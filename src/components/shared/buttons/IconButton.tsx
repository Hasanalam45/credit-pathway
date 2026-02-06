import React from "react";
import { cn } from "../../../utils/cn";

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  "aria-label": string;
  variant?: "default" | "soft" | "outline";
  size?: "sm" | "md";
};

const IconButton: React.FC<IconButtonProps> = ({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D4A317]";

  const variantClass =
    variant === "default"
      ? "bg-white text-gray-800 shadow-sm border border-gray-200 hover:bg-gray-50 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-700 dark:hover:bg-gray-200"
      : variant === "soft"
      ? "bg-[#E6D3BF] text-white hover:bg-[#d8c0a3]"
      : "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700";

  const sizeClass =
    size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base";

  return (
    <button
      className={cn(base, variantClass, sizeClass, className)}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;

