import { useMemo, useState } from "react";
import type { DashboardClientData } from "../dashboard-types";
import { PROGRESS_EXERCISES_PER_PAGE } from "../dashboard-client.shared";

type DashboardExercise = DashboardClientData["exercises"][number];

export type DashboardProgressState = {
  exerciseSearch: string;
  filteredExercises: DashboardExercise[];
  paginatedExercises: DashboardExercise[];
  currentPage: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  handleExerciseSearchChange: (value: string) => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export function useDashboardProgress(
  exercises: DashboardClientData["exercises"],
): DashboardProgressState {
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [progressExercisePage, setProgressExercisePage] = useState(1);
  const filteredExercises = useMemo(() => {
    const query = exerciseSearch.trim().toLowerCase();

    if (!query) {
      return exercises;
    }

    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(query));
  }, [exercises, exerciseSearch]);
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

  function goToPreviousPage() {
    setProgressExercisePage((current) => Math.max(current - 1, 1));
  }

  function goToNextPage() {
    setProgressExercisePage((current) => Math.min(current + 1, totalPages));
  }

  return {
    exerciseSearch,
    filteredExercises,
    paginatedExercises,
    currentPage,
    totalPages,
    rangeStart,
    rangeEnd,
    handleExerciseSearchChange,
    goToPreviousPage,
    goToNextPage,
  };
}
