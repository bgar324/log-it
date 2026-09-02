"use client";

import {
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import { splitStyles } from "./split-system.styles";

type SplitDayCardProps = {
  day: WorkoutSplitDayTemplate;
  isSelected: boolean;
  isToday: boolean;
  onSelect: () => void;
};

export function SplitDayCard({
  day,
  isSelected,
  isToday,
  onSelect,
}: SplitDayCardProps) {
  const isRestDay = isRestDayWorkoutTypeSlug(day.workoutTypeSlug);
  const totalSets = day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);

  const weekdayLabel = getSplitWeekdayLabel(day.weekday);
  const stats = isRestDay ? "Recovery day" : `${totalSets} planned sets`;

  return (
    <button
      type="button"
      data-split-day={day.weekday}
      aria-label={`${weekdayLabel}${isToday ? ", today" : ""}: ${
        day.workoutType
      }, ${stats}`}
      className={`${splitStyles.splitDayCard} ${
        isRestDay
          ? splitStyles.splitDayCardRest
          : isSelected
            ? splitStyles.splitDayCardActive
            : ""
      } ${isRestDay && isSelected ? splitStyles.splitDayCardRestActive : ""}`}
      onClick={onSelect}
    >
      <span className={splitStyles.splitDayIdentity}>
        <span className={splitStyles.splitDayWeekdayMobile}>
          {weekdayLabel.slice(0, 3)}
        </span>
        <span className={splitStyles.splitDayWeekdayDesktop}>
          {weekdayLabel}
        </span>
        {isToday ? (
          <span className={splitStyles.splitDayToday}>Today</span>
        ) : null}
      </span>
      <span className={splitStyles.splitDayMain}>
        <strong className={splitStyles.splitDayTitle}>{day.workoutType}</strong>
        <span className={splitStyles.splitDayStats}>{stats}</span>
      </span>
      <span className={splitStyles.splitDayMeta}>
        {day.exercises.length} {day.exercises.length === 1 ? "exercise" : "exercises"}
      </span>
    </button>
  );
}
