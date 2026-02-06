import React from "react";
import SectionCard from "../layout/SectionCard";

type BarPoint = {
  label: string;
  value: number;
};

type BarChartCardProps = {
  title: string;
  subtitle?: string;
  data: BarPoint[];
};

const BarChartCard: React.FC<BarChartCardProps> = ({
  title,
  subtitle,
  data,
}) => {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <SectionCard title={title} subtitle={subtitle}>
      <div className="flex h-40 items-end gap-3">
        {data.map((d) => {
          const height = (d.value / max) * 100;
          return (
            <div
              key={d.label}
              className="flex-1"
            >
              <div
                className="mx-auto w-5 rounded-full bg-[#fbeed2]"
                style={{ height: `${height}%` }}
              />
              <div className="mt-2 text-center text-[11px] text-gray-500">
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default BarChartCard;

