// src/components/help/FAQSection.tsx
import React, { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import SectionCard from "../shared/layout/SectionCard";
import { cn } from "../../utils/cn";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQS: FAQItem[] = [
  {
    id: "kpi-calculation",
    question: "How are dashboard KPIs like Total Users and Active Users calculated?",
    answer:
      "Total Users is the count of all registered users in the system. Active Users are users who have logged in or had activity (disputes, letters, or content views) within the selected date range on the dashboard filters."
  },
  {
    id: "inactive-users",
    question: "When does a user become ‘Inactive’ in User Management?",
    answer:
      "A user is marked Inactive when their account has been deactivated by an admin or their subscription has expired. Inactive users cannot log in or receive new disputes/letters until you reactivate them from the User Details drawer."
  },
  {
    id: "add-user",
    question: "How do I add a new user to the platform?",
    answer:
      "Go to the Users page and click the “+ Add User” button in the top-right corner. Fill in the user’s name, email, tier, and status. After saving, the user will appear in the User Management table and counts toward dashboard metrics."
  },
  {
    id: "change-tier",
    question: "Can I change a user’s membership tier (Free, Paid, VIP)?",
    answer:
      "Yes. From the Users page, open the User Details drawer, click “Edit Details”, and update the Tier field. Changes are reflected immediately in the dashboard, analytics, and Content Management visibility rules."
  },
  {
    id: "analytics-refresh",
    question: "How often are analytics and reports updated?",
    answer:
      "Analytics cards and the Analytics Dashboard aggregate data for the selected range. In a real deployment this would be updated on a schedule (e.g., every 15 minutes or hourly). In the current prototype, data is refreshed whenever new activity is recorded or you reload the page."
  },
  {
    id: "disputes-vs-letters",
    question: "What’s the difference between a dispute and a letter in Reports?",
    answer:
      "A dispute represents a case created against a credit item (e.g., a late payment or collection). Letters are individual communications generated for that dispute and mailed to bureaus or creditors. A single dispute can have multiple letters associated with it."
  },
  {
    id: "create-content",
    question: "How do I create new articles, lessons, or videos for users?",
    answer:
      "Open Content Management from the sidebar. Use the “New Article” or “New Lesson” buttons to add content. You can set category, visibility, and membership tier so only the correct users can view the content in the client app."
  },
  {
    id: "support-contact",
    question: "How do I report a bug or contact the support team?",
    answer:
      "Use the Help page’s Contact Support card to email us or submit a ticket. Include screenshots, error messages, and a short description of what you were doing so the team can quickly reproduce and fix the issue."
  }
];

const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(FAQS[0]?.id ?? null);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <SectionCard title="Frequently Asked Questions">
      <div className="space-y-2">
        {FAQS.map((item) => {
          const isOpen = item.id === openId;
          return (
            <div
                key={item.id}
                className="rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-700"
              >
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.question}
                </span>
                <FiChevronDown
                  className={cn(
                      "h-4 w-4 flex-shrink-0 text-gray-400 transition-transform dark:text-gray-300",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen && (
                  <div className="px-4 pb-3 text-xs text-gray-600 sm:text-sm dark:text-gray-300">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default FAQSection;
