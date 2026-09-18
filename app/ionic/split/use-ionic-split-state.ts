"use client";

import { useEffect, useMemo, useRef, useState, type SetStateAction } from "react";
import posthog from "posthog-js";
import { useSplitManagerExerciseActions } from "@/app/dashboard/_hooks/use-split-manager-exercise-actions";
import {
  activateWorkoutSplit,
  copyWorkoutSplit,
  createWorkoutSplit,
  deleteWorkoutSplit,
  EXERCISE_SUGGESTION_DEBOUNCE_MS,
  getInitialSelectedWeekday,
  saveWorkoutSplit,
} from "@/app/dashboard/split-manager.shared";
import { useExerciseSuggestions } from "@/app/hooks/use-exercise-suggestions";
import {
  createUnsavedWorkoutSplitDraft,
  sortSplitDays,
  SPLIT_WEEKDAYS,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
  type WorkoutSplitTemplate,
} from "@/lib/workout-splits/shared";

const DRAFT_SPLIT_KEY = "unsaved-draft";

export type IonicSplitState = {
  split: WorkoutSplitTemplate;
  splits: WorkoutSplitTemplate[];
  activeSplitId: string | null;
  selectedDay: WorkoutSplitDayTemplate | null;
  selectedWeekday: SplitWeekdayValue;
  todayWeekday: SplitWeekdayValue;
  isSaving: boolean;
  /** True while the selected split holds day edits the server has not stored. */
  hasUnsavedChanges: boolean;
  exerciseSearchResults: Record<string, string[]>;
  selectSplit: (splitId: string | null) => void;
  selectWeekday: (weekday: SplitWeekdayValue) => void;
  renameSplit: (name: string) => Promise<void>;
  createSplit: () => Promise<void>;
  deleteSplit: (splitId: string) => Promise<void>;
  activateSplit: (splitId: string) => Promise<void>;
  copySplit: () => Promise<void>;
  saveSplit: (nextSplit?: WorkoutSplitTemplate) => Promise<void>;
  saveDayOrder: (orderedWeekdays: SplitWeekdayValue[]) => Promise<void>;
  setWorkoutType: (value: string) => void;
  handleExerciseNameChange: (exerciseIndex: number, value: string) => void;
  handleExerciseNameFocus: (exerciseIndex: number, value: string) => void;
  handleExerciseNameBlur: (exerciseIndex: number, value: string) => void;
  applyExerciseSearchResult: (exerciseIndex: number, suggestion: string) => void;
  setExerciseSets: (exerciseIndex: number, value: number) => void;
  addExercise: () => void;
  removeExercise: (exerciseIndex: number) => void;
  reorderExercises: (orderedExerciseOrders: number[]) => void;
};

type UseIonicSplitStateOptions = {
  initialSplit: WorkoutSplitTemplate;
  initialSplits: WorkoutSplitTemplate[];
  onRefresh: () => void;
  notify: (message: string, tone: "success" | "error") => void;
};

/**
 * Split state for the Ionic app. Editing, suggestion lookups, and the request
 * payloads are the dashboard's. Two things differ: feedback runs through
 * IonToast, and a successful write calls `onRefresh` (the shell's data
 * invalidation) instead of Next's router.refresh, which would not touch the
 * shell's fetched data. Unsaved day edits are tracked per split so switching
 * day or split cannot quietly drop typed work.
 */
export function useIonicSplitState({
  initialSplit,
  initialSplits,
  onRefresh,
  notify,
}: UseIonicSplitStateOptions): IonicSplitState {
  const initialLibrary = useMemo(
    () => (initialSplits.length > 0 ? initialSplits : [initialSplit]),
    [initialSplit, initialSplits],
  );
  const [splits, setSplits] = useState(initialLibrary);
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(
    initialSplit.id ?? initialLibrary[0]?.id ?? null,
  );
  const [selectedWeekday, setSelectedWeekday] = useState<SplitWeekdayValue>(
    getInitialSelectedWeekday(),
  );
  const [todayWeekday] = useState<SplitWeekdayValue>(getInitialSelectedWeekday);
  const [isSaving, setIsSaving] = useState(false);
  const [dirtySplitKeys, setDirtySplitKeys] = useState<string[]>([]);
  const dirtyKeysRef = useRef<string[]>([]);
  const seededLibraryRef = useRef(initialLibrary);

  const split = useMemo(
    () =>
      splits.find((item) => item.id === selectedSplitId) ??
      splits.find((item) => item.isActive) ??
      splits[0] ??
      initialSplit,
    [initialSplit, selectedSplitId, splits],
  );
  const selectedSplitKey = split.id ?? DRAFT_SPLIT_KEY;

  const {
    clearAll: clearAllExerciseSuggestions,
    clearPendingLookup: clearPendingSuggestionLookup,
    clearResults: clearExerciseSearchResults,
    queueLookup: queueExerciseSuggestionLookup,
    resultsByKey: exerciseSearchResultsByKey,
  } = useExerciseSuggestions({ debounceMs: EXERCISE_SUGGESTION_DEBOUNCE_MS });

  // Fresh server data replaces local state only when nothing is unsaved: a
  // refresh triggered by some other write must not wipe typed day edits.
  useEffect(() => {
    if (seededLibraryRef.current === initialLibrary) {
      return;
    }

    seededLibraryRef.current = initialLibrary;

    if (dirtyKeysRef.current.length > 0) {
      return;
    }

    setSplits(initialLibrary);
  }, [initialLibrary]);

  function markDirty(key: string, isDirty: boolean) {
    const wasDirty = dirtyKeysRef.current.includes(key);

    if (wasDirty === isDirty) {
      return;
    }

    const next = isDirty
      ? [...dirtyKeysRef.current, key]
      : dirtyKeysRef.current.filter((item) => item !== key);

    dirtyKeysRef.current = next;
    setDirtySplitKeys(next);
  }

  function setSplit(action: SetStateAction<WorkoutSplitTemplate>) {
    if (isSaving) return;
    const nextSplit =
      typeof action === "function"
        ? (action as (current: WorkoutSplitTemplate) => WorkoutSplitTemplate)(split)
        : action;

    markDirty(nextSplit.id ?? DRAFT_SPLIT_KEY, true);
    setSplits((current) => {
      const index = current.findIndex((item) => item.id === split.id);

      if (index === -1) {
        return [nextSplit, ...current];
      }

      return current.map((item, itemIndex) =>
        itemIndex === index ? nextSplit : item,
      );
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

  useEffect(() => {
    clearAllExerciseSuggestions();
  }, [clearAllExerciseSuggestions, selectedWeekday]);

  async function saveSplit(nextSplit?: WorkoutSplitTemplate) {
    if (isSaving) {
      return;
    }

    const splitToSave = nextSplit ?? split;
    setIsSaving(true);

    try {
      const savedSplit = await saveWorkoutSplit(splitToSave);
      setSplits((current) =>
        current.map((item) => (item.id === splitToSave.id ? savedSplit : item)),
      );
      setSelectedSplitId(savedSplit.id);
      markDirty(splitToSave.id ?? DRAFT_SPLIT_KEY, false);
      markDirty(savedSplit.id ?? DRAFT_SPLIT_KEY, false);
      clearAllExerciseSuggestions();
      posthog.capture("workout_split_updated", {
        training_day_count: savedSplit.days.filter(
          (day) => day.exercises.length > 0,
        ).length,
        exercise_count: savedSplit.days.reduce(
          (total, day) => total + day.exercises.length,
          0,
        ),
      });
      notify("Split saved. The logger and calendar use it now.", "success");
      onRefresh();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to save split.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function renameSplit(name: string) {
    const nextSplit = { ...split, name };
    setSplit(nextSplit);
    await saveSplit(nextSplit);
  }

  async function createSplit() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const created = await createWorkoutSplit();
      setSplits((current) => [created, ...current]);
      setSelectedSplitId(created.id);
      posthog.capture("workout_split_created");
      notify("Split created.", "success");
      onRefresh();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to create split.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSplit(splitId: string) {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const deleted = await deleteWorkoutSplit(splitId);
      setSplits((current) => {
        const remaining = current
          .filter((item) => item.id !== splitId)
          .map((item) => ({
            ...item,
            isActive: item.id === deleted.activeSplitId,
          }));
        const nextSelected =
          selectedSplitId === splitId
            ? remaining.find((item) => item.isActive)?.id ??
              remaining[0]?.id ??
              null
            : selectedSplitId;

        setSelectedSplitId(nextSelected);
        return remaining.length > 0
          ? remaining
          : [createUnsavedWorkoutSplitDraft(initialSplit)];
      });
      markDirty(splitId, false);
      posthog.capture("workout_split_deleted");
      notify("Split deleted.", "success");
      onRefresh();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to delete split.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function activateSplit(splitId: string) {
    if (isSaving || !splitId) {
      return;
    }

    setIsSaving(true);

    try {
      const activated = await activateWorkoutSplit(splitId);
      setSplits((current) =>
        current.map((item) =>
          item.id === activated.id ? activated : { ...item, isActive: false },
        ),
      );
      setSelectedSplitId(activated.id);
      markDirty(activated.id ?? DRAFT_SPLIT_KEY, false);
      posthog.capture("workout_split_activated");
      notify("Active split updated. The logger will use it.", "success");
      onRefresh();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to activate split.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function copySplit() {
    try {
      const message = await copyWorkoutSplit(split);
      posthog.capture("workout_split_copied");
      notify(message, "success");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to copy split.",
        "error",
      );
    }
  }

  // The reorder gesture is the commit: weekday assignments move and persist in
  // one action, exactly as the dashboard's reorder sheet does on save.
  async function saveDayOrder(orderedWeekdays: SplitWeekdayValue[]) {
    if (isSaving || orderedWeekdays.length !== split.days.length) {
      return;
    }

    const dayByWeekday = new Map(split.days.map((day) => [day.weekday, day]));
    const orderedDays = orderedWeekdays
      .map((weekday) => dayByWeekday.get(weekday))
      .filter((day): day is WorkoutSplitDayTemplate => Boolean(day));

    if (orderedDays.length !== split.days.length) {
      return;
    }

    const nextSplit: WorkoutSplitTemplate = {
      ...split,
      days: sortSplitDays(
        orderedDays.map((day, index) => ({
          ...day,
          weekday: SPLIT_WEEKDAYS[index] ?? day.weekday,
        })),
      ),
    };

    clearAllExerciseSuggestions();
    setSplit(nextSplit);
    await saveSplit(nextSplit);
  }

  function selectSplit(splitId: string | null) {
    clearAllExerciseSuggestions();
    setSelectedSplitId(splitId);
  }

  return {
    split,
    splits,
    activeSplitId: splits.find((item) => item.isActive)?.id ?? null,
    selectedDay: exerciseActions.selectedDay,
    selectedWeekday,
    todayWeekday,
    isSaving,
    hasUnsavedChanges: dirtySplitKeys.includes(selectedSplitKey),
    exerciseSearchResults: exerciseActions.selectedDayExerciseSearchResults,
    selectSplit,
    selectWeekday: setSelectedWeekday,
    renameSplit,
    createSplit,
    deleteSplit,
    activateSplit,
    copySplit,
    saveSplit,
    saveDayOrder,
    setWorkoutType: exerciseActions.setWorkoutType,
    handleExerciseNameChange: exerciseActions.handleExerciseNameChange,
    handleExerciseNameFocus: exerciseActions.handleExerciseNameFocus,
    handleExerciseNameBlur: exerciseActions.handleExerciseNameBlur,
    applyExerciseSearchResult: exerciseActions.applyExerciseSearchResult,
    setExerciseSets: exerciseActions.setExerciseSets,
    addExercise: exerciseActions.addExercise,
    removeExercise: exerciseActions.removeExercise,
    reorderExercises: exerciseActions.reorderExercises,
  };
}
