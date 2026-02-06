/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import SectionCard from "../layout/SectionCard";

type DonutSlice = {
  label: string;
  value: number;
  color: string; // tailwind hex like "#D4A317"
};

type DonutChartCardProps = {
  title: string;
  subtitle?: string;
  data: DonutSlice[];
};

const DonutChartCard: React.FC<DonutChartCardProps> = ({
  title,
  subtitle,
  data,
}) => {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  let cumulative = 0;

  const circles = data.map((slice, _index) => {
    const fraction = slice.value / total;
    const dashArray = `${fraction * 100} ${100 - fraction * 100}`;
    const dashOffset = cumulative * -100;
    cumulative += fraction;

    return (
      <circle
        key={slice.label}
        cx="50"
        cy="50"
        r="30"
        fill="transparent"
        stroke={slice.color}
        strokeWidth="10"
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    );
  });

  return (
    <SectionCard title={title} subtitle={subtitle}>
      <div className="flex items-center gap-4">
        <svg
          viewBox="0 0 100 100"
          className="h-28 w-28"
        >
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="transparent"
            stroke="#f3f4f6"
            strokeWidth="10"
          />
          {circles}
        </svg>
        <div className="space-y-1 text-xs text-gray-600">
          {data.map((slice) => (
            <div
              key={slice.label}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span>{slice.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
};

export default DonutChartCard;

