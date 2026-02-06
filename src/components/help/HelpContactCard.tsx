// src/components/help/HelpContactCard.tsx
import React from "react";
import { FiMail, FiMessageCircle } from "react-icons/fi";
import SectionCard from "../shared/layout/SectionCard";
import Button from "../shared/buttons/Button";

const HelpContactCard: React.FC = () => {
  const handleEmail = () => {
    window.location.href = "mailto:support@paramount-credit.com?subject=Admin%20Help%20Request";
  };

  return (
    <SectionCard title="Contact Support">
      <p className="mb-3 text-xs text-gray-600 sm:text-sm dark:text-gray-300">
        Can’t find what you’re looking for? Reach out to our support team and
        we’ll help you with users, disputes, or technical issues.
      </p>
      <div className="space-y-2">
        <Button
          type="button"
          size="sm"
          className="w-full justify-center"
          onClick={handleEmail}
        >
          <FiMail className="mr-2 h-4 w-4" />
          Email Support
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="w-full justify-center"
        >
          <FiMessageCircle className="mr-2 h-4 w-4" />
          Open Support Ticket
        </Button>
      </div>
      <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-400">
        Typical response time: <span className="font-medium">within 1 business day</span>.
      </p>
    </SectionCard>
  );
};

export default HelpContactCard;
