import React, { useMemo } from "react";
import { DEFAULT_DAILY_GOAL } from "../constants";
import { progressColor } from "../lib/activity";

const SIZE = 120;
const STROKE_WIDTH = 8;

export function DailyUsageRing({ today = 0, dailyGoal = DEFAULT_DAILY_GOAL }) {
  const { circumference, offset, stroke, label } = useMemo(() => {
    const goal = dailyGoal > 0 ? dailyGoal : DEFAULT_DAILY_GOAL;
    const progress = Math.min(Math.max(today / goal, 0), 1);
    const radius = (SIZE - STROKE_WIDTH) / 2;
    const circleLength = 2 * Math.PI * radius;
    return {
      circumference: circleLength,
      offset: circleLength * (1 - progress),
      stroke: progressColor(progress),
      label: `Used ${today} of ${goal} today (${Math.round(progress * 100)}%)`,
    };
  }, [today, dailyGoal]);

  const radius = (SIZE - STROKE_WIDTH) / 2;

  return (
    <div className="usage-ring" aria-label={label}>
      <svg width={SIZE} height={SIZE} role="presentation">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          stroke="#000"
          strokeOpacity="0.1"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <circle
          className="arc"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={stroke}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <div className="today-count">{today}</div>
    </div>
  );
}
