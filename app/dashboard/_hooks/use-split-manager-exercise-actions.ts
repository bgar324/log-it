"use client";

import { useMemo, type Dispatch, type SetStateAction } from "react";
import { normalizeExerciseDisplayName } from "@/lib/exercise-autofill";
import { normalizeWorkoutTypeSlug } from "@/lib/workout-utils";
import {
  isRestDayWorkoutTypeSlug,
  REST_DAY_WORKOUT_TYPE,
} from "@/lib/workout-splits/shared";
import type {
  SplitWeekdayValue,
  WorkoutSplitTemplate,
} from "@/lib/workout-splits/shared";
import {
  buildSelectedDayExerciseSearchResults,
  clampExerciseSets,
  createExerciseDraft,
  exerciseSuggestionKey,
} from "../split-manager.shared";

type UseSplitManagerExerciseActionsOptions = {
  split: WorkoutSplitTemplate;
  setSplit: Dispatch<SetStateAction<WorkoutSplitTemplate>>;
  selectedWeekday: SplitWeekdayValue;
  exerciseSearchResultsByKey: Record<string, string[]>;
  clearAllExerciseSuggestions: () => void;
  clearPendingSuggestionLookup: (key: string) => void;
  clearExerciseSearchResults: (key: string) => void;
  queueExerciseSuggestionLookup: (key: string, value: string) => void;
};

export function useSplitManagerExerciseActions({
  split,
  setSplit,
  selectedWeekday,
  exerciseSearchResultsByKey,
  clearAllExerciseSuggestions,
  clearPendingSuggestionLookup,
  clearExerciseSearchResults,
  queueExerciseSuggestionLookup,
}: UseSplitManagerExerciseActionsOptions) {
  const selectedDay = useMemo(
    () => split.days.find((day) => day.weekday === selectedWeekday) ?? split.days[0] ?? null,
    [selectedWeekday, split.days],
  );
  const selectedDayExerciseSearchResults = useMemo(
    () => buildSelectedDayExerciseSearchResults(selectedDay, exerciseSearchResultsByKey),
    [exerciseSearchResultsByKey, selectedDay],
  );

  function updateSplitDay(
    weekday: SplitWeekdayValue,
    updater: (
      day: WorkoutSplitTemplate["days"][number],
    ) => WorkoutSplitTemplate["days"][number],
  ) {
    setSplit((current) => ({
      ...current,
      days: current.days.map((day) => (day.weekday === weekday ? updater(day) : day)),
    }));
  }

  function updateSelectedDayExercises(
    updater: (
      day: WorkoutSplitTemplate["days"][number],
    ) => WorkoutSplitTemplate["days"][number],
  ) {
    if (!selectedDay) {
      return;
    }

    updateSplitDay(selectedDay.weekday, updater);
  }

  function handleExerciseNameChange(exerciseIndex: number, value: string) {
    if (!selectedDay) {
      return;
    }

    const key = exerciseSuggestionKey(selectedDay.weekday, exerciseIndex);

    updateSelectedDayExercises((day) => ({
      ...day,
      exercises: day.exercises.map((exercise, index) =>
        index === exerciseIndex ? { ...exercise, exerciseDisplayName: value } : exercise,
      ),
    }));
    queueExerciseSuggestionLookup(key, value);
  }

  function handleExerciseNameBlur(exerciseIndex: number, rawValue: string) {
    if (!selectedDay) {
      return;
    }

    const key = exerciseSuggestionKey(selectedDay.weekday, exerciseIndex);

    clearPendingSuggestionLookup(key);
    clearExerciseSearchResults(key);

    updateSelectedDayExercises((day) => ({
      ...day,
      exercises: day.exercises.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              exerciseDisplayName: normalizeExerciseDisplayName(rawValue),
            }
          : exercise,
      ),
    }));
  }

  function handleExerciseNameFocus(exerciseIndex: number, rawValue: string) {
    if (!selectedDay || !rawValue.trim()) {
      return;
    }

    queueExerciseSuggestionLookup(
      exerciseSuggestionKey(selectedDay.weekday, exerciseIndex),
      rawValue,
    );
  }

  function applyExerciseSearchResult(exerciseIndex: number, suggestion: string) {
    if (!selectedDay) {
      return;
    }

    const key = exerciseSuggestionKey(selectedDay.weekday, exerciseIndex);

    clearPendingSuggestionLookup(key);
    clearExerciseSearchResults(key);

    updateSelectedDayExercises((day) => ({
      ...day,
      exercises: day.exercises.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              exerciseDisplayName: normalizeExerciseDisplayName(suggestion),
            }
          : exercise,
      ),
    }));
  }

  // Renaming a day is not a delete. The save payload is what drops exercises
  // for a rest day, so local state keeps them here: clearing the field to
  // retype it, or passing through "Rest" on the way to another name, no longer
  // destroys the day's plan mid-keystroke.
  function setWorkoutType(value: string) {
    updateSelectedDayExercises((day) => ({
      ...day,
      workoutType: value,
      workoutTypeSlug: normalizeWorkoutTypeSlug(value || REST_DAY_WORKOUT_TYPE),
    }));
  }

  function setExerciseSets(exerciseIndex: number, value: number) {
    updateSelectedDayExercises((day) => ({
      ...day,
      exercises: day.exercises.map((exercise, index) =>
        index === exerciseIndex
          ? { ...exercise, sets: clampExerciseSets(value) }
          : exercise,
      ),
    }));
  }

  function addExercise() {
    if (!selectedDay || isRestDayWorkoutTypeSlug(selectedDay.workoutTypeSlug)) {
      return;
    }

    clearAllExerciseSuggestions();
    updateSelectedDayExercises((day) => ({
      ...day,
      exercises: [...day.exercises, createExerciseDraft(day.exercises.length + 1)],
    }));
  }

  function removeExercise(exerciseIndex: number) {
    clearAllExerciseSuggestions();
    updateSelectedDayExercises((day) => ({
      ...day,
      exercises: day.exercises
        .filter((_, index) => index !== exerciseIndex)
        .map((exercise, index) => ({
          ...exercise,
          order: index + 1,
        })),
    }));
  }

  function reorderExercises(orderedExerciseOrders: number[]) {
    if (!selectedDay || orderedExerciseOrders.length !== selectedDay.exercises.length) {
      return;
    }

    const exerciseByOrder = new Map(
      selectedDay.exercises.map((exercise) => [exercise.order, exercise]),
    );
    const orderedExercises = orderedExerciseOrders
      .map((order) => exerciseByOrder.get(order))
      .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise));

    if (orderedExercises.length !== selectedDay.exercises.length) {
      return;
    }

    clearAllExerciseSuggestions();
    updateSelectedDayExercises((day) => ({
      ...day,
      exercises: orderedExercises.map((exercise, index) => ({
        ...exercise,
        order: index + 1,
      })),
    }));
  }

  return {
    selectedDay,
    selectedDayExerciseSearchResults,
    handleExerciseNameChange,
    handleExerciseNameBlur,
    handleExerciseNameFocus,
    applyExerciseSearchResult,
    setWorkoutType,
    setExerciseSets,
    addExercise,
    removeExercise,
    reorderExercises,
  };
}
