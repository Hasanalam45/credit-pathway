// src/components/help/HelpQuickLinksCard.tsx
import React from "react";
import { FiUsers, FiBarChart2, FiBookOpen, FiAlertTriangle } from "react-icons/fi";
import SectionCard from "../shared/layout/SectionCard";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";

type HelpLink = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  to: string;
};

const LINKS: HelpLink[] = [
  {
    id: "users",
    label: "Managing Users",
    description: "Add, deactivate, or change tiers.",
    icon: FiUsers,
    to: "/users"
  },
  {
    id: "analytics",
    label: "Analytics Dashboard",
    description: "Understand DAU, WAU, and actions.",
    icon: FiBarChart2,
    to: "/analytics"
  },
  {
    id: "content",
    label: "Content Management",
    description: "Create articles, lessons, and videos.",
    icon: FiBookOpen,
    to: "/content"
  },
  {
    id: "reports",
    label: "Reports & Disputes",
    description: "Track journeys, disputes, and mail.",
    icon: FiAlertTriangle,
    to: "/reports"
  }
];

const HelpQuickLinksCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <SectionCard title="Quick Links">
      <div className="space-y-2">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.id}
              type="button"
              onClick={() => navigate(link.to)}
              className={cn(
                "group flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-left",
                "bg-gray-50/90 hover:bg-white",
                "border border-transparent hover:border-gray-200",
                "shadow-[0_1px_0_rgba(15,23,42,0.02)] transition-all",
                "dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-transparent dark:hover:border-gray-600"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF4D1] text-[#B3870E] dark:bg-amber-700 dark:text-amber-100">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {link.label}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-300">
                    {link.description}
                  </span>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                →
              </span>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default HelpQuickLinksCard;
