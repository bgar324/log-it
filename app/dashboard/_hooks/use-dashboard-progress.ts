import { useMemo, useState } from "react";
import type { DashboardClientData } from "../dashboard-types";
import { PROGRESS_EXERCISES_PER_PAGE } from "../dashboard-client.shared";

type DashboardExercise = DashboardClientData["exercises"][number];
type ExerciseSortMode = "recent-desc" | "recent-asc" | "sessions-desc" | "sessions-asc";

export type DashboardProgressState = {
  exerciseSearch: string;
  exerciseSortMode: ExerciseSortMode;
  filteredExercises: DashboardExercise[];
  paginatedExercises: DashboardExercise[];
  currentPage: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  handleExerciseSearchChange: (value: string) => void;
  toggleRecentSort: () => void;
  toggleSessionSort: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export function useDashboardProgress(
  exercises: DashboardClientData["exercises"],
): DashboardProgressState {
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseSortMode, setExerciseSortMode] = useState<ExerciseSortMode>("recent-desc");
  const [progressExercisePage, setProgressExercisePage] = useState(1);
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
  const totalPages = Math.max(
    1,
    Math.ceil(filteredExercises.length / PROGRESS_EXERCISES_PER_PAGE),
  );
  const currentPage = Math.min(progressExercisePage, totalPages);
  const rangeStart =
    filteredExercises.length === 0 ? 0 : (currentPage - 1) * PROGRESS_EXERCISES_PER_PAGE;
  const paginatedExercises = filteredExercises.slice(
    rangeStart,
    rangeStart + PROGRESS_EXERCISES_PER_PAGE,
  );
  const rangeEnd = Math.min(rangeStart + paginatedExercises.length, filteredExercises.length);

  function handleExerciseSearchChange(value: string) {
    setExerciseSearch(value);
    setProgressExercisePage(1);
  }

  function toggleRecentSort() {
    setExerciseSortMode((current) =>
      current === "recent-desc" ? "recent-asc" : "recent-desc",
    );
    setProgressExercisePage(1);
  }

  function toggleSessionSort() {
    setExerciseSortMode((current) =>
      current === "sessions-desc" ? "sessions-asc" : "sessions-desc",
    );
    setProgressExercisePage(1);
  }

  function goToPreviousPage() {
    setProgressExercisePage((current) => Math.max(current - 1, 1));
  }

  function goToNextPage() {
    setProgressExercisePage((current) => Math.min(current + 1, totalPages));
  }

  return {
    exerciseSearch,
    exerciseSortMode,
    filteredExercises,
    paginatedExercises,
    currentPage,
    totalPages,
    rangeStart,
    rangeEnd,
    handleExerciseSearchChange,
    toggleRecentSort,
    toggleSessionSort,
    goToPreviousPage,
    goToNextPage,
  };
}
