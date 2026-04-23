"use client";

import { useEffect, useState } from "react";
import { useExerciseSuggestions } from "@/app/hooks/use-exercise-suggestions";
import type { SplitWeekdayValue, WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import {
  EXERCISE_SUGGESTION_DEBOUNCE_MS,
  getInitialSelectedWeekday,
  type SplitManagerCopyState,
  type SplitManagerSaveState,
} from "../split-manager.shared";
import { useSplitManagerDayDrag } from "./use-split-manager-day-drag";
import { useSplitManagerExerciseActions } from "./use-split-manager-exercise-actions";
import { useSplitManagerPersistence } from "./use-split-manager-persistence";

export type SplitManagerState = {
  split: WorkoutSplitTemplate;
  selectedDay: WorkoutSplitTemplate["days"][number] | null;
  selectedWeekday: SplitWeekdayValue;
  saveState: SplitManagerSaveState;
  copyState: SplitManagerCopyState;
  draggingIndex: number | null;
  dropTargetIndex: number | null;
  draggingExerciseIndex: number | null;
  exerciseDropTargetIndex: number | null;
  selectedDayExerciseSearchResults: Record<string, string[]>;
  setSplitName: (value: string) => void;
  selectWeekday: (weekday: SplitWeekdayValue) => void;
  startDraggingDay: (index: number) => void;
  dragOverDay: (index: number) => void;
  dropDayAt: (index: number) => void;
  endDayDrag: () => void;
  setWorkoutType: (value: string) => void;
  handleExerciseNameChange: (exerciseIndex: number, value: string) => void;
  handleExerciseNameFocus: (exerciseIndex: number, value: string) => void;
  handleExerciseNameBlur: (exerciseIndex: number, value: string) => void;
  applyExerciseSearchResult: (exerciseIndex: number, suggestion: string) => void;
  setExerciseSets: (exerciseIndex: number, value: number) => void;
  addExercise: () => void;
  removeExercise: (exerciseIndex: number) => void;
  startDraggingExercise: (exerciseIndex: number) => void;
  dragOverExercise: (exerciseIndex: number) => void;
  dropExerciseAt: (exerciseIndex: number) => void;
  endExerciseDrag: () => void;
  handleSave: () => Promise<void>;
  handleCopySplit: () => Promise<void>;
};

export function useSplitManagerState(
  initialSplit: WorkoutSplitTemplate,
): SplitManagerState {
  const [split, setSplit] = useState(initialSplit);
  const [selectedWeekday, setSelectedWeekday] = useState<SplitWeekdayValue>(
    getInitialSelectedWeekday(),
  );
  const {
    clearAll: clearAllExerciseSuggestions,
    clearPendingLookup: clearPendingSuggestionLookup,
    clearResults: clearExerciseSearchResults,
    queueLookup: queueExerciseSuggestionLookup,
    resultsByKey: exerciseSearchResultsByKey,
  } = useExerciseSuggestions({
    debounceMs: EXERCISE_SUGGESTION_DEBOUNCE_MS,
  });
  const exerciseActions = useSplitManagerExerciseActions({
    split,
    setSplit,
    selectedWeekday,
    exerciseSearchResultsByKey,
    clearAllExerciseSuggestions,
    clearPendingSuggestionLookup,
    clearExerciseSearchResults,
    queueExerciseSuggestionLookup,
  });
  const dragState = useSplitManagerDayDrag({
    selectedWeekday,
    setSelectedWeekday,
    setSplit,
    clearAllExerciseSuggestions,
  });
  const persistence = useSplitManagerPersistence({
    split,
    setSplit,
    clearAllExerciseSuggestions,
  });

  useEffect(() => {
    clearAllExerciseSuggestions();
    exerciseActions.endExerciseDrag();
  }, [clearAllExerciseSuggestions, exerciseActions, selectedWeekday]);

  return {
    split,
    selectedDay: exerciseActions.selectedDay,
    selectedWeekday,
    saveState: persistence.saveState,
    copyState: persistence.copyState,
    draggingIndex: dragState.draggingIndex,
    dropTargetIndex: dragState.dropTargetIndex,
    draggingExerciseIndex: exerciseActions.draggingExerciseIndex,
    exerciseDropTargetIndex: exerciseActions.exerciseDropTargetIndex,
    selectedDayExerciseSearchResults: exerciseActions.selectedDayExerciseSearchResults,
    setSplitName: exerciseActions.setSplitName,
    selectWeekday: setSelectedWeekday,
    startDraggingDay: dragState.startDraggingDay,
    dragOverDay: dragState.dragOverDay,
    dropDayAt: dragState.dropDayAt,
    endDayDrag: dragState.endDayDrag,
    setWorkoutType: exerciseActions.setWorkoutType,
    handleExerciseNameChange: exerciseActions.handleExerciseNameChange,
    handleExerciseNameFocus: exerciseActions.handleExerciseNameFocus,
    handleExerciseNameBlur: exerciseActions.handleExerciseNameBlur,
    applyExerciseSearchResult: exerciseActions.applyExerciseSearchResult,
    setExerciseSets: exerciseActions.setExerciseSets,
    addExercise: exerciseActions.addExercise,
    removeExercise: exerciseActions.removeExercise,
    startDraggingExercise: exerciseActions.startDraggingExercise,
    dragOverExercise: exerciseActions.dragOverExercise,
    dropExerciseAt: exerciseActions.dropExerciseAt,
    endExerciseDrag: exerciseActions.endExerciseDrag,
    handleSave: persistence.handleSave,
    handleCopySplit: persistence.handleCopySplit,
  };
}
