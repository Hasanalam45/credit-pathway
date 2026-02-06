import React from "react";

type ProgressBarRowProps = {
  label: string;
  value: string;
  percent: number; // 0-100
};

const ProgressBarRow: React.FC<ProgressBarRowProps> = ({
  label,
  value,
  percent,
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-700">
        <span>{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-[#D4A317]"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBarRow;

