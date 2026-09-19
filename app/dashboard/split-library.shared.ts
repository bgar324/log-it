import {
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
  type WorkoutSplitTemplate,
} from "@/lib/workout-splits/shared";

/** The key the library store uses for a split that has never been saved. */
export const DRAFT_SPLIT_LIBRARY_KEY = "unsaved-draft";

/**
 * A day with no typed name is a rest day everywhere else — the save payload and
 * the server both fall back to Rest — so it says Rest here too instead of
 * rendering an empty title.
 */
export function getSplitDayTitle(day: WorkoutSplitDayTemplate) {
  return day.workoutType.trim() || "Rest";
}

/** One pluralisation rule for every split count, so the words never disagree. */
export function countLabel(value: number, singular: string) {
  return `${value} ${value === 1 ? singular : `${singular}s`}`;
}

export type SplitFolderDay = {
  weekday: SplitWeekdayValue;
  letter: string;
  label: string;
  title: string;
  isRestDay: boolean;
  sets: number;
  /** This day's planned sets against the heaviest day in the same split. */
  load: number;
};

export type SplitFolderSummary = {
  days: SplitFolderDay[];
  trainingDayCount: number;
  exerciseCount: number;
  setCount: number;
  /** Training day names in week order, for the folder's word-first line. */
  trainingDayTitles: string[];
};

/**
 * Everything a folder shows is derived from the split's own weekdays: which
 * days train, what they are called, and how many sets each one plans. No
 * synthetic series, no invented scores.
 */
export function summarizeSplitFolder(
  split: WorkoutSplitTemplate,
): SplitFolderSummary {
  const setsByDay = split.days.map((day) =>
    isRestDayWorkoutTypeSlug(day.workoutTypeSlug)
      ? 0
      : day.exercises.reduce((total, exercise) => total + exercise.sets, 0),
  );
  const heaviestDay = setsByDay.reduce((max, sets) => Math.max(max, sets), 0);
  const days = split.days.map((day, index) => {
    const label = getSplitWeekdayLabel(day.weekday);
    const sets = setsByDay[index] ?? 0;

    return {
      weekday: day.weekday,
      letter: label.slice(0, 1),
      label,
      title: getSplitDayTitle(day),
      isRestDay: isRestDayWorkoutTypeSlug(day.workoutTypeSlug),
      sets,
      load: heaviestDay > 0 ? sets / heaviestDay : 0,
    } satisfies SplitFolderDay;
  });

  return {
    days,
    trainingDayCount: days.filter((day) => !day.isRestDay).length,
    exerciseCount: split.days.reduce(
      (total, day) =>
        total +
        (isRestDayWorkoutTypeSlug(day.workoutTypeSlug) ? 0 : day.exercises.length),
      0,
    ),
    setCount: setsByDay.reduce((total, sets) => total + sets, 0),
    trainingDayTitles: days
      .filter((day) => !day.isRestDay)
      .map((day) => day.title),
  };
}

export function describeSplitFolder(summary: SplitFolderSummary) {
  if (summary.trainingDayCount === 0) {
    return "Rest every day";
  }

  return `${countLabel(summary.trainingDayCount, "training day")} · ${countLabel(
    summary.setCount,
    "planned set",
  )}`;
}
