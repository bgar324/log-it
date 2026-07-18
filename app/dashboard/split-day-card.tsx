"use client";

import {
  getSplitWeekdayLabel,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import { splitStyles } from "./split-system.styles";

type SplitDayCardProps = {
  day: WorkoutSplitDayTemplate;
  isSelected: boolean;
  onSelect: () => void;
};

export function SplitDayCard({
  day,
  isSelected,
  onSelect,
}: SplitDayCardProps) {
  const totalSets = day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);

  return (
    <button
      type="button"
      className={`${splitStyles.splitDayCard} ${
        isSelected ? splitStyles.splitDayCardActive : ""
      }`}
      onClick={onSelect}
    >
      <div className={splitStyles.splitDayHeader}>
        <div>
          <span className={splitStyles.splitDayWeekday}>
            {getSplitWeekdayLabel(day.weekday)}
          </span>
        </div>
        <span className={splitStyles.splitDayMeta}>
          <span className="min-[701px]:hidden">{day.exercises.length} ex</span>
          <span className="max-[700px]:hidden">{day.exercises.length} exercises</span>
        </span>
      </div>
      <strong className={splitStyles.splitDayTitle}>{day.workoutType}</strong>
      <p className={splitStyles.splitDayStats}>{totalSets} planned sets</p>
    </button>
  );
}
