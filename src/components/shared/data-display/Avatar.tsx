import React from "react";
import { cn } from "../../../utils/cn";

type AvatarProps = {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
};

const Avatar: React.FC<AvatarProps> = ({ src, name, size = "md" }) => {
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-xs"
      : size === "lg"
      ? "h-14 w-14 text-lg"
      : "h-10 w-10 text-sm";

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover",
          sizeClass
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-[#1C7F7A] text-white font-semibold",
        sizeClass
      )}
    >
      {initials}
    </div>
  );
};

export default Avatar;

