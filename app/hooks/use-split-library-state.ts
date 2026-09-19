"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";
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
import { DRAFT_SPLIT_LIBRARY_KEY as DRAFT_SPLIT_KEY } from "@/app/dashboard/split-library.shared";
import { useExerciseSuggestions } from "@/app/hooks/use-exercise-suggestions";
import {
  createUnsavedWorkoutSplitDraft,
  sortSplitDays,
  SPLIT_WEEKDAYS,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
  type WorkoutSplitTemplate,
} from "@/lib/workout-splits/shared";

export type SplitLibraryNoticeTone = "success" | "error" | "info";

export type SplitLibraryState = {
  split: WorkoutSplitTemplate;
  splits: WorkoutSplitTemplate[];
  activeSplitId: string | null;
  selectedDay: WorkoutSplitDayTemplate | null;
  selectedWeekday: SplitWeekdayValue;
  todayWeekday: SplitWeekdayValue;
  isSaving: boolean;
  /** True while the selected split holds day edits the server has not stored. */
  hasUnsavedChanges: boolean;
  /** Every library key — split id, or the draft key — holding unsaved edits. */
  unsavedSplitIds: readonly string[];
  exerciseSearchResults: Record<string, string[]>;
  selectSplit: (splitId: string | null) => void;
  selectWeekday: (weekday: SplitWeekdayValue) => void;
  renameSplit: (name: string, target?: WorkoutSplitTemplate) => Promise<void>;
  createSplit: () => Promise<void>;
  deleteSplit: (splitId: string) => Promise<void>;
  activateSplit: (splitId: string) => Promise<void>;
  copySplit: (target?: WorkoutSplitTemplate) => Promise<void>;
  /** Resolves true only when the server stored the split. */
  saveSplit: (nextSplit?: WorkoutSplitTemplate) => Promise<boolean>;
  /** Restores the selected split to the last version the server confirmed. */
  discardChanges: () => void;
  /** Discards the entire in-memory library when leaving its editing surface. */
  discardAllChanges: () => void;
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

type UseSplitLibraryStateOptions = {
  initialSplit: WorkoutSplitTemplate;
  initialSplits: WorkoutSplitTemplate[];
  /** Invalidates whatever fetched the split data after a successful write. */
  onRefresh: () => void;
  notify: (message: string, tone: SplitLibraryNoticeTone) => void;
  /** False in previews: editing stays live, writes never leave the browser. */
  persistChanges?: boolean;
};

/**
 * Split library and day editing state: the saved splits, which one is selected,
 * which weekday is being edited, the request payloads, and whether the
 * selection holds work the server has not stored.
 *
 * Feedback and data invalidation are injected, so the same state drives any
 * presentation layer: `notify` renders however the host app announces things,
 * and `onRefresh` invalidates whatever fetched the splits.
 *
 * Unsaved day edits are tracked per split so switching day or split cannot
 * quietly drop typed work, and `discardChanges` is the only path back to the
 * server's version.
 */
export function useSplitLibraryState({
  initialSplit,
  initialSplits,
  onRefresh,
  notify,
  persistChanges = true,
}: UseSplitLibraryStateOptions): SplitLibraryState {
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
  // The last version of each split the server confirmed. Discarding edits
  // needs a value to return to, and local state is already the edited one.
  const savedSplitsRef = useRef<Map<string, WorkoutSplitTemplate> | null>(null);
  const getSavedSplits = useCallback(
    () => (savedSplitsRef.current ??= new Map(
      initialLibrary.map((item) => [item.id ?? DRAFT_SPLIT_KEY, item]),
    )),
    [initialLibrary],
  );

  function rememberSavedSplit(saved: WorkoutSplitTemplate) {
    const snapshots = getSavedSplits();
    if (saved.isActive) {
      for (const [id, snapshot] of snapshots) {
        if (id !== saved.id && snapshot.isActive) {
          snapshots.set(id, { ...snapshot, isActive: false });
        }
      }
    }
    snapshots.set(saved.id ?? DRAFT_SPLIT_KEY, saved);
  }

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
  // refresh triggered by some other write must not wipe typed day edits. The
  // saved snapshots always take it, because they are the server's version.
  useEffect(() => {
    if (seededLibraryRef.current === initialLibrary) {
      return;
    }

    seededLibraryRef.current = initialLibrary;

    for (const item of initialLibrary) {
      getSavedSplits().set(item.id ?? DRAFT_SPLIT_KEY, item);
    }

    if (dirtyKeysRef.current.length > 0) {
      return;
    }

    setSplits(initialLibrary);
  }, [initialLibrary, getSavedSplits]);

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

  /** True when the action was skipped because this host is a preview. */
  function refuseInPreview(message: string) {
    if (persistChanges) {
      return false;
    }

    notify(message, "info");
    return true;
  }

  async function saveSplit(nextSplit?: WorkoutSplitTemplate) {
    if (isSaving) {
      return false;
    }

    if (refuseInPreview("Saving splits is disabled in this preview.")) {
      return false;
    }

    const splitToSave = nextSplit ?? split;
    setIsSaving(true);

    try {
      const savedSplit = await saveWorkoutSplit(splitToSave);
      setSplits((current) =>
        current.map((item) => (item.id === splitToSave.id ? savedSplit : item)),
      );
      setSelectedSplitId(savedSplit.id);
      rememberSavedSplit(savedSplit);
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
      return true;
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to save split.",
        "error",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  // The library renames a folder without opening it, so the target is explicit.
  // `setSplit` only ever writes the selected split; for any other split the
  // save itself is what puts the new name back into the library.
  async function renameSplit(name: string, target?: WorkoutSplitTemplate) {
    const nextSplit = { ...(target ?? split), name };

    if (nextSplit.id === split.id) {
      setSplit(nextSplit);
    }

    await saveSplit(nextSplit);
  }

  async function createSplit() {
    if (isSaving) {
      return;
    }

    if (refuseInPreview("Creating splits is disabled in this preview.")) {
      return;
    }

    setIsSaving(true);

    try {
      const created = await createWorkoutSplit();
      setSplits((current) => [created, ...current]);
      setSelectedSplitId(created.id);
      rememberSavedSplit(created);
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

    if (refuseInPreview("Deleting splits is disabled in this preview.")) {
      return;
    }

    setIsSaving(true);

    try {
      const deleted = await deleteWorkoutSplit(splitId);
      // A library cannot be empty: deleting the last split leaves an unsaved
      // draft, and that draft is what discarding edits returns to.
      const replacement = createUnsavedWorkoutSplitDraft(initialSplit);

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

        return remaining.length > 0 ? remaining : [replacement];
      });
      getSavedSplits().set(DRAFT_SPLIT_KEY, replacement);
      getSavedSplits().delete(splitId);
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
    if (dirtyKeysRef.current.includes(splitId)) {
      notify("Save this plan before making it active.", "error");
      return;
    }

    if (refuseInPreview("Changing the active split is disabled in this preview.")) {
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
      rememberSavedSplit(activated);
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

  async function copySplit(target?: WorkoutSplitTemplate) {
    if (refuseInPreview("Copying splits is disabled in this preview.")) {
      return;
    }

    try {
      const message = await copyWorkoutSplit(target ?? split);
      posthog.capture("workout_split_copied");
      notify(message, "success");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to copy split.",
        "error",
      );
    }
  }

  // Returns the selected split to the server's version. Local edits are the
  // only thing lost, which is exactly what the caller asked for.
  function discardChanges() {
    if (isSaving) {
      return;
    }

    const saved = getSavedSplits().get(selectedSplitKey);

    if (!saved) {
      return;
    }

    clearAllExerciseSuggestions();
    setSplits((current) =>
      current.map((item) =>
        item.id === split.id ? { ...saved, isActive: item.isActive } : item,
      ),
    );
    markDirty(selectedSplitKey, false);
  }

  function discardAllChanges() {
    if (isSaving) return;
    const dirty = new Set(dirtyKeysRef.current);
    const saved = getSavedSplits();
    clearAllExerciseSuggestions();
    setSplits((current) => current.map((item) => {
      const key = item.id ?? DRAFT_SPLIT_KEY;
      const snapshot = saved.get(key);
      return dirty.has(key) && snapshot ? { ...snapshot, isActive: item.isActive } : item;
    }));
    dirtyKeysRef.current = [];
    setDirtySplitKeys([]);
  }

  // The reorder gesture is the commit: weekday assignments move and persist in
  // one action. The week itself has no separate Save.
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
    unsavedSplitIds: dirtySplitKeys,
    exerciseSearchResults: exerciseActions.selectedDayExerciseSearchResults,
    selectSplit,
    selectWeekday: setSelectedWeekday,
    renameSplit,
    createSplit,
    deleteSplit,
    activateSplit,
    copySplit,
    saveSplit,
    discardChanges,
    discardAllChanges,
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
