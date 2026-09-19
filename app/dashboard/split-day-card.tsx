"use client";

import {
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import { countLabel, getSplitDayTitle } from "./split-library.shared";
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
  const weekdayLabel = getSplitWeekdayLabel(day.weekday);
  const title = getSplitDayTitle(day);
  const stats = isRestDay
    ? "Rest day"
    : countLabel(
        day.exercises.reduce((total, exercise) => total + exercise.sets, 0),
        "planned set",
      );

  return (
    <button
      type="button"
      data-split-day={day.weekday}
      data-rest={isRestDay}
      data-selected={isSelected}
      aria-label={`${weekdayLabel}${
        isToday ? ", today" : ""
      }: ${title}, ${stats}`}
      className={splitStyles.splitDayCard}
      onClick={onSelect}
    >
      <span className={splitStyles.splitDayIdentity}>
        <span className={splitStyles.splitDayWeekdayMobile}>
          {weekdayLabel.slice(0, 3)}
        </span>
        <span className={splitStyles.splitDayWeekdayDesktop}>{weekdayLabel}</span>
        {isToday ? (
          <span className={splitStyles.splitDayToday}>Today</span>
        ) : null}
      </span>
      <span className={splitStyles.splitDayMain}>
        <strong className={splitStyles.splitDayTitle}>{title}</strong>
        <span className={splitStyles.splitDayStats}>{stats}</span>
      </span>
      <span className={splitStyles.splitDayMeta}>
        {isRestDay ? "" : countLabel(day.exercises.length, "exercise")}
      </span>
    </button>
  );
}
