import React from "react";
import SectionCard from "../layout/SectionCard";

type Point = { label: string; value: number };

type LineChartCardProps = {
  title: string;
  subtitle?: string;
  primaryValue?: string | number;
  caption?: string;
  data: Point[];
};

const LineChartCard: React.FC<LineChartCardProps> = ({
  title,
  subtitle,
  primaryValue,
  caption,
  data,
}) => {
  // Placeholder simple SVG line (stylish enough for now)
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x =
        (i / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - ((d.value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <SectionCard title={title} subtitle={subtitle}>
      {primaryValue !== undefined && (
        <div className="mb-3 text-2xl font-semibold text-gray-900">
          {primaryValue}
          {caption && (
            <span className="ml-2 text-xs font-normal text-gray-500">
              {caption}
            </span>
          )}
        </div>
      )}
      <div className="h-40 w-full rounded-2xl bg-gradient-to-t from-[#fdf4d8] via-white to-white px-2 py-3">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <defs>
            <linearGradient
              id="gold-line"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#D4A317" />
              <stop offset="100%" stopColor="#f9e7b3" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="url(#gold-line)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    </SectionCard>
  );
};

export default LineChartCard;

