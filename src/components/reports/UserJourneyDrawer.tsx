// src/components/reports/UserJourneyDrawer.tsx
import React from "react";
import Drawer from "../shared/overlay/Drawer";
import Avatar from "../shared/data-display/Avatar";
import StatusBadge from "../shared/data-display/StatusBadge";
import type { UserJourney } from "./UserJourneyTable";

type Props = {
  open: boolean;
  journey: UserJourney | null;
  onClose: () => void;
};

const STEPS = [
  "Onboarding & profile complete",
  "Credit pull & analysis",
  "Plan assigned",
  "Disputes created & letters queued",
  "Mailing & bureau responses",
  "Monitoring & follow-up",
];

const UserJourneyDrawer: React.FC<Props> = ({
  open,
  journey,
  onClose,
}) => {
  if (!journey) return null;

  // compute active step from progress
  const activeIndex =
    journey.progress >= 90
      ? 5
      : journey.progress >= 70
      ? 4
      : journey.progress >= 50
      ? 3
      : journey.progress >= 30
      ? 2
      : journey.progress >= 10
      ? 1
      : 0;

  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      title="User Details"
      widthClassName="w-full max-w-md"
    >
      <div className="flex items-center gap-3 pb-4">
        <Avatar name={journey.name} size="lg" />
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {journey.name}
          </p>
          <p className="text-xs text-gray-500">{journey.email}</p>
          <p className="mt-1 text-xs text-gray-600">
            Plan:{" "}
            <span className="font-medium text-gray-900">
              {journey.plan}
            </span>
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">
            Progress
          </span>
          <StatusBadge
            label={`${journey.progress}%`}
            variant="neutral"
          />
        </div>
        <p className="text-xs text-gray-500">
          Last updated {journey.lastUpdated}
        </p>
      </div>

      {/* Timeline */}
      <div className="mt-2 space-y-4">
        {STEPS.map((step, index) => {
          const isDone = index < activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <div key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={[
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    isDone || isCurrent
                      ? "border-[#D4A317] bg-[#D4A317]"
                      : "border-gray-300 bg-white",
                  ].join(" ")}
                />
                {index < STEPS.length - 1 && (
                  <span className="mt-1 h-8 w-px bg-gray-200" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900">
                  {step}
                </p>
                {isCurrent && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    Current stage: {journey.stage}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Drawer>
  );
};

export default UserJourneyDrawer;
