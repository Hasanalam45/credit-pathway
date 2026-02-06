import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiMessageSquare,
  FiAlertTriangle,
  FiArrowRight,
} from "react-icons/fi";
import SectionCard from "../shared/layout/SectionCard";
import { cn } from "../../utils/cn";

type QuickLinkItem = {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  to: string;
};

const QUICK_LINKS: QuickLinkItem[] = [
  {
    id: "new-users",
    label: "View New Users",
    icon: FiUsers,
    to: "/users?filter=new",
  },
  {
    id: "open-disputes",
    label: "Manage Open Disputes",
    icon: FiAlertTriangle,
    to: "/reports?tab=disputes",
  },
  {
    id: "active-chats",
    label: "Join Active Chats",
    icon: FiMessageSquare,
    to: "/reports?tab=chats", // adjust to your real route
  },
];

const QuickLinksCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <SectionCard title="Quick Links">
      <div className="space-y-2 mt-3">
        {QUICK_LINKS.map((link, index) => {
          const Icon = link.icon;

          return (
            <button
              key={link.id}
              type="button"
              onClick={() => navigate(link.to)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700",
                index === 0 && "mt-1"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF2C7] text-[#C08F12] dark:bg-[#3b2c23] dark:text-[#F7E5B2]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {link.label}
                </span>
              </div>
              <FiArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-400" />
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default QuickLinksCard;
