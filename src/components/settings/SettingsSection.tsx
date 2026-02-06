import React from "react";
import { cn } from "../../utils/cn";

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
        {title}
      </h2>
      {children}
    </section>
  );
};

export default SettingsSection;
