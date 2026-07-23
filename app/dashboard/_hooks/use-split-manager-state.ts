"use client";

import { useEffect, useMemo, useState, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useExerciseSuggestions } from "@/app/hooks/use-exercise-suggestions";
import {
  createUnsavedWorkoutSplitDraft,
  sortSplitDays,
  SPLIT_WEEKDAYS,
  type SplitWeekdayValue,
  type WorkoutSplitTemplate,
} from "@/lib/workout-splits/shared";
import {
  activateWorkoutSplit,
  createWorkoutSplit,
  deleteWorkoutSplit,
  EXERCISE_SUGGESTION_DEBOUNCE_MS,
  getInitialSelectedWeekday,
  type SplitManagerSaveState,
} from "../split-manager.shared";
import { useSplitManagerExerciseActions } from "./use-split-manager-exercise-actions";
import { useSplitManagerPersistence } from "./use-split-manager-persistence";

export type SplitManagerState = {
  split: WorkoutSplitTemplate;
  splits: WorkoutSplitTemplate[];
  selectedSplitId: string | null;
  selectedDay: WorkoutSplitTemplate["days"][number] | null;
  selectedWeekday: SplitWeekdayValue;
  saveState: SplitManagerSaveState;
  selectedDayExerciseSearchResults: Record<string, string[]>;
  setSplitName: (value: string) => void;
  selectSplit: (splitId: string | null) => void;
  createSplit: () => Promise<void>;
  deleteSplit: (splitId: string) => Promise<void>;
  activateSplit: (splitId: string) => Promise<void>;
  selectWeekday: (weekday: SplitWeekdayValue) => void;
  setWorkoutType: (value: string) => void;
  handleExerciseNameChange: (exerciseIndex: number, value: string) => void;
  handleExerciseNameFocus: (exerciseIndex: number, value: string) => void;
  handleExerciseNameBlur: (exerciseIndex: number, value: string) => void;
  applyExerciseSearchResult: (exerciseIndex: number, suggestion: string) => void;
  setExerciseSets: (exerciseIndex: number, value: number) => void;
  addExercise: () => void;
  removeExercise: (exerciseIndex: number) => void;
  reorderExercises: (orderedExerciseOrders: number[]) => void;
  reorderDays: (orderedWeekdays: SplitWeekdayValue[]) => void;
  handleSave: () => Promise<void>;
  handleCopySplit: () => Promise<void>;
};

export function useSplitManagerState(
  initialSplit: WorkoutSplitTemplate,
  initialSplits: WorkoutSplitTemplate[],
): SplitManagerState {
  const router = useRouter();
  const [mutationState, setMutationState] = useState<SplitManagerSaveState>({
    kind: "idle",
  });
  const initialLibrary = useMemo(
    () => (initialSplits.length > 0 ? initialSplits : [initialSplit]),
    [initialSplit, initialSplits],
  );
  const [splits, setSplits] = useState(initialLibrary);
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(
    initialSplit.id ?? initialLibrary[0]?.id ?? null,
  );
  const split = useMemo(
    () =>
      splits.find((item) => item.id === selectedSplitId) ??
      splits.find((item) => item.isActive) ??
      splits[0] ??
      initialSplit,
    [initialSplit, selectedSplitId, splits],
  );
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
  function setSplit(action: SetStateAction<WorkoutSplitTemplate>) {
    const nextSplit =
      typeof action === "function"
        ? (action as (current: WorkoutSplitTemplate) => WorkoutSplitTemplate)(split)
        : action;

    setSplits((current) => {
      const index = current.findIndex((item) => item.id === split.id);

      if (index === -1) {
        return [nextSplit, ...current];
      }

      return current.map((item, itemIndex) => (itemIndex === index ? nextSplit : item));
    });
  }

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
  const persistence = useSplitManagerPersistence({
    split,
    setSplit,
    setSplits,
    clearAllExerciseSuggestions,
  });

  useEffect(() => {
    clearAllExerciseSuggestions();
  }, [clearAllExerciseSuggestions, selectedWeekday]);

  function selectSplit(splitId: string | null) {
    clearAllExerciseSuggestions();
    setSelectedSplitId(splitId);
  }

  async function createSplit() {
    if (mutationState.kind === "saving" || persistence.saveState.kind === "saving") {
      return;
    }

    const toastId = toast.loading("Creating split...");
    setMutationState({ kind: "saving" });

    try {
      const created = await createWorkoutSplit();
      setSplits((current) => [created, ...current]);
      setSelectedSplitId(created.id);
      toast.success("Split created.", { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create split.", {
        id: toastId,
      });
    } finally {
      setMutationState({ kind: "idle" });
    }
  }

  async function deleteSplit(splitId: string) {
    if (mutationState.kind === "saving" || persistence.saveState.kind === "saving") {
      return;
    }

    const toastId = toast.loading("Deleting split...");
    setMutationState({ kind: "saving" });
    try {
      const deleted = await deleteWorkoutSplit(splitId);
      setSplits((current) => {
        const rawRemaining = current.filter((item) => item.id !== splitId);
        const remaining = rawRemaining.map((item) => ({
          ...item,
          isActive: item.id === deleted.activeSplitId,
        }));
        const nextSelected =
          selectedSplitId === splitId
            ? remaining.find((item) => item.isActive)?.id ?? remaining[0]?.id ?? null
            : selectedSplitId;

        setSelectedSplitId(nextSelected);
        return remaining.length > 0
          ? remaining
          : [createUnsavedWorkoutSplitDraft(initialSplit)];
      });
      toast.success("Split deleted.", { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete split.", {
        id: toastId,
      });
    } finally {
      setMutationState({ kind: "idle" });
    }
  }

  async function activateSplit(splitId: string) {
    if (mutationState.kind === "saving" || persistence.saveState.kind === "saving") {
      return;
    }

    const toastId = toast.loading("Setting active split...");
    setMutationState({ kind: "saving" });

    try {
      const activated = await activateWorkoutSplit(splitId);
      setSplits((current) =>
        current.map((item) =>
          item.id === activated.id
            ? activated
            : {
                ...item,
                isActive: false,
              },
        ),
      );
      setSelectedSplitId(activated.id);
      toast.success("Active split updated.", {
        id: toastId,
        description: "The logger will use this split.",
      });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to activate split.", {
        id: toastId,
      });
    } finally {
      setMutationState({ kind: "idle" });
    }
  }

  function selectWeekday(weekday: SplitWeekdayValue) {
    setSelectedWeekday(weekday);
  }

  function reorderDays(orderedWeekdays: SplitWeekdayValue[]) {
    if (orderedWeekdays.length !== split.days.length) {
      return;
    }

    const dayByWeekday = new Map(split.days.map((day) => [day.weekday, day]));
    const orderedDays = orderedWeekdays
      .map((weekday) => dayByWeekday.get(weekday))
      .filter((day): day is NonNullable<typeof day> => Boolean(day));

    if (orderedDays.length !== split.days.length) {
      return;
    }

    clearAllExerciseSuggestions();
    setSplit((current) => ({
      ...current,
      days: sortSplitDays(
        orderedDays.map((day, index) => ({
          ...day,
          weekday: SPLIT_WEEKDAYS[index] ?? day.weekday,
        })),
      ),
    }));
  }

  return {
    split,
    splits,
    selectedSplitId,
    selectedDay: exerciseActions.selectedDay,
    selectedWeekday,
    saveState:
      mutationState.kind === "saving" ? mutationState : persistence.saveState,
    selectedDayExerciseSearchResults: exerciseActions.selectedDayExerciseSearchResults,
    setSplitName: exerciseActions.setSplitName,
    selectSplit,
    createSplit,
    deleteSplit,
    activateSplit,
    selectWeekday,
    setWorkoutType: exerciseActions.setWorkoutType,
    handleExerciseNameChange: exerciseActions.handleExerciseNameChange,
    handleExerciseNameFocus: exerciseActions.handleExerciseNameFocus,
    handleExerciseNameBlur: exerciseActions.handleExerciseNameBlur,
    applyExerciseSearchResult: exerciseActions.applyExerciseSearchResult,
    setExerciseSets: exerciseActions.setExerciseSets,
    addExercise: exerciseActions.addExercise,
    removeExercise: exerciseActions.removeExercise,
    reorderExercises: exerciseActions.reorderExercises,
    reorderDays,
    handleSave: persistence.handleSave,
    handleCopySplit: persistence.handleCopySplit,
  };
}
