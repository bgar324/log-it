import { useMemo, useState } from "react";
import type { DashboardClientData } from "../dashboard-types";

const INITIAL_EXERCISES = 6;
const EXERCISES_PER_REVEAL = 24;

type DashboardExercise = DashboardClientData["exercises"][number];

export type ExerciseSortMode =
  | "recent-desc"
  | "recent-asc"
  | "sessions-desc"
  | "sessions-asc";

export type DashboardProgressState = {
  exerciseSearch: string;
  exerciseSortMode: ExerciseSortMode;
  filteredExercises: DashboardExercise[];
  visibleExercises: DashboardExercise[];
  hiddenCount: number;
  revealCount: number;
  handleExerciseSearchChange: (value: string) => void;
  handleExerciseSortChange: (mode: ExerciseSortMode) => void;
  revealMoreExercises: () => void;
};

export function useDashboardProgress(
  exercises: DashboardClientData["exercises"],
): DashboardProgressState {
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseSortMode, setExerciseSortMode] = useState<ExerciseSortMode>("recent-desc");
  const [visibleCount, setVisibleCount] = useState(INITIAL_EXERCISES);
  const filteredExercises = useMemo(() => {
    const query = exerciseSearch.trim().toLowerCase();
    const matchingExercises = query
      ? exercises.filter((exercise) => exercise.name.toLowerCase().includes(query))
      : exercises;

    return [...matchingExercises].sort((left, right) => {
      if (exerciseSortMode === "sessions-desc") {
        return (
          right.sessionCount - left.sessionCount ||
          left.daysSinceLastHit - right.daysSinceLastHit ||
          left.name.localeCompare(right.name)
        );
      }

      if (exerciseSortMode === "sessions-asc") {
        return (
          left.sessionCount - right.sessionCount ||
          left.daysSinceLastHit - right.daysSinceLastHit ||
          left.name.localeCompare(right.name)
        );
      }

      if (exerciseSortMode === "recent-asc") {
        return (
          right.daysSinceLastHit - left.daysSinceLastHit ||
          right.sessionCount - left.sessionCount ||
          left.name.localeCompare(right.name)
        );
      }

      return (
        left.daysSinceLastHit - right.daysSinceLastHit ||
        right.sessionCount - left.sessionCount ||
        left.name.localeCompare(right.name)
      );
    });
  }, [exercises, exerciseSearch, exerciseSortMode]);
  // Progressive reveal instead of pages: 83 exercises across 17 pages of five
  // made "Next" the only way through the list, and left a dead "Prev" on the
  // first page. Search narrows, "show more" extends, neither needs a cursor.
  const visibleExercises = filteredExercises.slice(0, visibleCount);
  const hiddenCount = filteredExercises.length - visibleExercises.length;
  // What the next tap actually appends, so the button can promise that number
  // rather than the whole remainder.
  const revealCount = Math.min(EXERCISES_PER_REVEAL, hiddenCount);

  function handleExerciseSearchChange(value: string) {
    setExerciseSearch(value);
    setVisibleCount(INITIAL_EXERCISES);
  }

  function handleExerciseSortChange(mode: ExerciseSortMode) {
    setExerciseSortMode(mode);
    setVisibleCount(INITIAL_EXERCISES);
  }

  function revealMoreExercises() {
    setVisibleCount((current) => current + EXERCISES_PER_REVEAL);
  }

  return {
    exerciseSearch,
    exerciseSortMode,
    filteredExercises,
    visibleExercises,
    hiddenCount,
    revealCount,
    handleExerciseSearchChange,
    handleExerciseSortChange,
    revealMoreExercises,
  };
}
