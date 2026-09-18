"use client";

import { useSyncExternalStore } from "react";
import { countLabel } from "@/app/dashboard/dashboard-client.shared";
import {
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  SPLIT_WEEKDAYS,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
  type WorkoutSplitTemplate,
} from "@/lib/workout-splits/shared";

/** Radix Select rejects an empty value, and a never-saved plan has no id. */
export const UNSAVED_SPLIT_VALUE = "unsaved-split";

/** Below this the day editor is a sheet over the week, not a column beside it. */
const NARROW_VIEWPORT_QUERY = "(max-width: 1023px)";

let narrowViewport: MediaQueryList | null = null;

function narrowViewportQuery() {
  // Test renderers and older embedded webviews ship without matchMedia; the
  // wide layout is the safe answer there because it needs no sheet.
  if (typeof window.matchMedia !== "function") {
    return null;
  }

  narrowViewport ??= window.matchMedia(NARROW_VIEWPORT_QUERY);
  return narrowViewport;
}

function subscribeToViewport(onChange: () => void) {
  const query = narrowViewportQuery();
  query?.addEventListener("change", onChange);

  return () => query?.removeEventListener("change", onChange);
}

function readNarrowViewport() {
  return narrowViewportQuery()?.matches ?? false;
}

function readWideViewportOnServer() {
  return false;
}

/**
 * One editor, two placements. The week and the day editor share state, so the
 * layout decision has to be a value React can branch on, not a CSS visibility
 * trick that would mount the same form twice.
 */
export function useIsNarrowViewport() {
  return useSyncExternalStore(
    subscribeToViewport,
    readNarrowViewport,
    readWideViewportOnServer,
  );
}

function countPlannedSets(day: WorkoutSplitDayTemplate) {
  return day.exercises.reduce((total, exercise) => total + exercise.sets, 0);
}

/** The right-hand summary of a week row: what this day actually asks for. */
export function describeDayLoad(day: WorkoutSplitDayTemplate) {
  if (isRestDayWorkoutTypeSlug(day.workoutTypeSlug)) {
    return "Rest";
  }

  if (day.exercises.length === 0) {
    return "No exercises yet";
  }

  return `${countLabel(day.exercises.length, "exercise")} · ${countLabel(
    countPlannedSets(day),
    "set",
  )}`;
}

export function describeSplitWeek(split: WorkoutSplitTemplate) {
  const trainingDays = split.days.filter(
    (day) => !isRestDayWorkoutTypeSlug(day.workoutTypeSlug),
  ).length;

  if (trainingDays === 0) {
    return "Every day is a rest day so far. Name a workout on any day to start planning.";
  }

  const exercises = split.days.reduce(
    (total, day) => total + day.exercises.length,
    0,
  );
  const sets = split.days.reduce((total, day) => total + countPlannedSets(day), 0);

  return `${countLabel(trainingDays, "training day")} this week, ${countLabel(
    exercises,
    "exercise",
  )}, ${countLabel(sets, "planned set")}.`;
}

export function describeTodayInWeek(
  days: WorkoutSplitDayTemplate[],
  todayWeekday: SplitWeekdayValue,
) {
  const today = days.find((day) => day.weekday === todayWeekday);
  const label = getSplitWeekdayLabel(todayWeekday);

  if (!today || isRestDayWorkoutTypeSlug(today.workoutTypeSlug)) {
    return `Today is ${label}, a rest day in this plan.`;
  }

  const workout = today.workoutType.trim();

  return today.exercises.length === 0
    ? `Today is ${label}. ${workout || "This workout"} has no exercises planned yet.`
    : `Today is ${label}: ${workout || "unnamed workout"}, ${countLabel(
        countPlannedSets(today),
        "planned set",
      )}.`;
}

export function describeDayPlan(
  day: WorkoutSplitDayTemplate,
  isToday: boolean,
) {
  const when = isToday ? "Today" : getSplitWeekdayLabel(day.weekday);

  if (isRestDayWorkoutTypeSlug(day.workoutTypeSlug)) {
    return `${when} is a rest day. Name a workout to plan exercises for it.`;
  }

  if (day.exercises.length === 0) {
    return `${when} has no exercises yet. Add the first movement you want to do.`;
  }

  return `${when} plans ${countLabel(
    day.exercises.length,
    "exercise",
  )} and ${countLabel(countPlannedSets(day), "set")}.`;
}

/**
 * The week's shape is fixed: seven weekdays in order. Reordering moves the
 * workouts between those slots, so the sheet has to say which slot is which.
 */
export function describeWeekReorder() {
  return `Drag a workout to a new position. Top to bottom the positions are ${SPLIT_WEEKDAYS.map(
    (weekday) => getSplitWeekdayLabel(weekday),
  ).join(", ")}, so a workout takes the weekday it lands on. The weekdays themselves stay where they are.`;
}
