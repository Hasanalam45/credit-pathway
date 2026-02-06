// src/components/reports/ReportsTabs.tsx
import React from "react";
import Tabs, { type Tab } from "../shared/navigation/Tabs";

export type ReportsTab = "journeys" | "disputes" | "mail" | "issues";

type Props = {
  value: ReportsTab;
  onChange: (value: ReportsTab) => void;
};

const REPORT_TABS: Tab[] = [
  { label: "User Journeys", value: "journeys" },
  { label: "Disputes & Letters", value: "disputes" },
  { label: "Mailing Logs", value: "mail" },
  { label: "Issues & Support", value: "issues" },
];

const ReportsTabs: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="border-b border-gray-200">
      <Tabs
        tabs={REPORT_TABS}
        value={value}
        onChange={(val) => onChange(val as ReportsTab)}
        variant="underline"
      />
    </div>
  );
};

export default ReportsTabs;
