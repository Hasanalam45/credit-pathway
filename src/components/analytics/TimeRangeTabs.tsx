// src/components/analytics/TimeRangeTabs.tsx
import React from "react";
import SegmentedControl, {
  type SegmentedOption,
} from "../shared/buttons/SegmentedControl";
import TextInput from "../shared/inputs/TextInput";
import type { AnalyticsRange } from "../../pages/analytics/AnalyticsPage";

type Props = {
  value: AnalyticsRange;
  onChange: (value: AnalyticsRange) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomStartDateChange: (date: string) => void;
  onCustomEndDateChange: (date: string) => void;
};

const options: SegmentedOption[] = [
  { label: "Last 7 Days", value: "last_7_days" },
  { label: "Last 30 Days", value: "last_30_days" },
  { label: "This Month", value: "this_month" },
  { label: "This Quarter", value: "this_quarter" },
  { label: "Custom Range", value: "custom" },
];

const TimeRangeTabs: React.FC<Props> = ({
  value,
  onChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SegmentedControl
          options={options}
          value={value}
          onChange={(val) => onChange(val as AnalyticsRange)}
        />
      </div>
      
      {value === "custom" && (
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex-1">
            <TextInput
              type="date"
              label="Start Date"
              value={customStartDate}
              onChange={(e) => onCustomStartDateChange(e.target.value)}
              max={customEndDate}
            />
          </div>
          <div className="flex-1">
            <TextInput
              type="date"
              label="End Date"
              value={customEndDate}
              onChange={(e) => onCustomEndDateChange(e.target.value)}
              min={customStartDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeRangeTabs;
