import { useMemo, useState } from "react";
import type { DashboardClientData } from "../dashboard-types";

// Sized to about one phone screen, so a page turn replaces the list instead of
// extending it past the fold. Exported because the loading skeleton has to draw
// exactly this many rows; a hardcoded copy there would drift the first time
// this number changes.
export const EXERCISES_PER_PAGE = 8;

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
  rangeLabel: string;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  handleExerciseSearchChange: (value: string) => void;
  handleExerciseSortChange: (mode: ExerciseSortMode) => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export function useDashboardProgress(
  exercises: DashboardClientData["exercises"],
): DashboardProgressState {
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseSortMode, setExerciseSortMode] = useState<ExerciseSortMode>("recent-desc");
  const [pageIndex, setPageIndex] = useState(0);
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
  // Pages, not progressive reveal: appending 24 rows at a time grew the page
  // without bound, so the only way back to the search field was a long scroll.
  // A page is sized to roughly one phone screen, and both directions are one
  // tap, so the list never gets taller than the thing you are reading it on.
  const pageCount = Math.max(1, Math.ceil(filteredExercises.length / EXERCISES_PER_PAGE));
  // Clamp rather than trust: a narrowing search can strand the cursor past the
  // end, and resetting on every keystroke would fight the user mid-word.
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const rangeStart = currentPage * EXERCISES_PER_PAGE;
  const visibleExercises = filteredExercises.slice(
    rangeStart,
    rangeStart + EXERCISES_PER_PAGE,
  );
  const hasPreviousPage = currentPage > 0;
  const hasNextPage = currentPage < pageCount - 1;

  function handleExerciseSearchChange(value: string) {
    setExerciseSearch(value);
    setPageIndex(0);
  }

  function handleExerciseSortChange(mode: ExerciseSortMode) {
    setExerciseSortMode(mode);
    setPageIndex(0);
  }

  function goToPreviousPage() {
    setPageIndex((current) => Math.max(0, current - 1));
  }

  function goToNextPage() {
    setPageIndex((current) => Math.min(pageCount - 1, current + 1));
  }

  return {
    exerciseSearch,
    exerciseSortMode,
    filteredExercises,
    visibleExercises,
    // 1-based and inclusive, because this reads as a sentence to a person.
    rangeLabel: filteredExercises.length
      ? `${rangeStart + 1}-${rangeStart + visibleExercises.length} of ${filteredExercises.length}`
      : "",
    hasPreviousPage,
    hasNextPage,
    handleExerciseSearchChange,
    handleExerciseSortChange,
    goToPreviousPage,
    goToNextPage,
  };
}
