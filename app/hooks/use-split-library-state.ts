"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type SetStateAction } from "react";
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
  withExerciseDraftIds,
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
  /** Stable while an unsaved template receives its database ID. */
  editorKey: string;
  selectedDay: WorkoutSplitDayTemplate | null;
  selectedWeekday: SplitWeekdayValue;
  todayWeekday: SplitWeekdayValue;
  isSaving: boolean;
  /** True while the selected split holds edits the server has not stored. */
  hasUnsavedChanges: boolean;
  /** Every library key — split id, or the draft key — holding unsaved edits. */
  unsavedSplitIds: readonly string[];
  exerciseSearchResults: Record<string, string[]>;
  selectSplit: (splitId: string | null) => void;
  selectWeekday: (weekday: SplitWeekdayValue) => void;
  renameSplit: (name: string, target?: WorkoutSplitTemplate) => void;
  createSplit: () => Promise<void>;
  /** Resolves true only when the server deleted the captured split. */
  deleteSplit: (splitId: string) => Promise<boolean>;
  activateSplit: (splitId: string) => Promise<void>;
  copySplit: (target?: WorkoutSplitTemplate) => Promise<void>;
  /** Resolves true only when the server stored the split. */
  saveSplit: (nextSplit?: WorkoutSplitTemplate, options?: { preserveIncomplete?: boolean }) => Promise<boolean>;
  /** Restores the selected split to the last version the server confirmed. */
  discardChanges: () => void;
  /** Discards the entire in-memory library when leaving its editing surface. */
  discardAllChanges: () => void;
  applyDayOrder: (orderedWeekdays: SplitWeekdayValue[]) => void;
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

// Database saves replace nested rows. Keep the editor's identity for unchanged
// exercises so an acknowledgement or refresh does not replace focused inputs.
function retainExerciseIdentity(next: WorkoutSplitTemplate, previous?: WorkoutSplitTemplate): WorkoutSplitTemplate {
  if (!previous) return next;
  return {
    ...next,
    days: next.days.map(day => {
      const oldDay = previous.days.find(item => item.weekday === day.weekday);
      return {
        ...day,
        exercises: day.exercises.map(exercise => {
          const oldExercise = oldDay?.exercises.find(item =>
            item.order === exercise.order &&
            item.exerciseDisplayName.toLowerCase() === exercise.exerciseDisplayName.toLowerCase(),
          );
          return oldExercise ? { ...exercise, id: oldExercise.id } : exercise;
        }),
      };
    }),
  };
}

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
    () => (initialSplits.length > 0 ? initialSplits : [initialSplit]).map(withExerciseDraftIds),
    [initialSplit, initialSplits],
  );
  const [splits, setSplits] = useState(initialLibrary);
  const libraryRef = useRef(initialLibrary);
  const savingRef = useRef(false);
  const confirmedSplitKeysRef = useRef(new Set<string>());
  useLayoutEffect(() => { libraryRef.current = splits; }, [splits]);
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(
    initialSplit.id ?? initialLibrary[0]?.id ?? null,
  );
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
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
    confirmedSplitKeysRef.current.add(saved.id ?? DRAFT_SPLIT_KEY);
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
      const key = item.id ?? DRAFT_SPLIT_KEY;
      // An earlier route refresh must not roll back a write already acknowledged.
      if (!confirmedSplitKeysRef.current.has(key)) {
        getSavedSplits().set(key, retainExerciseIdentity(item, getSavedSplits().get(key)));
      }
    }

    if (dirtyKeysRef.current.length > 0) {
      return;
    }

    const refreshed = initialLibrary.map(item => getSavedSplits().get(item.id ?? DRAFT_SPLIT_KEY) ?? item);
    libraryRef.current = refreshed;
    setSplits(refreshed);
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
    const current = libraryRef.current.find(item => item.id === split.id) ?? split;
    const nextSplit = typeof action === "function" ? action(current) : action;
    markDirty(nextSplit.id ?? DRAFT_SPLIT_KEY, true);
    const index = libraryRef.current.findIndex(item => item.id === current.id);
    const nextLibrary = index === -1 ? [nextSplit, ...libraryRef.current]
      : libraryRef.current.map((item, position) => position === index ? nextSplit : item);
    libraryRef.current = nextLibrary;
    setSplits(nextLibrary);
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

  async function saveSplit(nextSplit?: WorkoutSplitTemplate, options: { preserveIncomplete?: boolean } = {}) {
    if (savingRef.current) {
      return false;
    }

    if (refuseInPreview("Saving splits is disabled in this preview.")) {
      return false;
    }

    const source = nextSplit ?? libraryRef.current.find(item => item.id === split.id) ?? split;
    const currentAtStart = libraryRef.current.find(item => item.id === source.id);
    const savedSnapshot = getSavedSplits().get(source.id ?? DRAFT_SPLIT_KEY);
    const splitToSave = options.preserveIncomplete ? {
      ...source,
      days: source.days.map(day => ({
        ...day,
        exercises: day.exercises.flatMap(exercise => {
          if (exercise.exerciseDisplayName.trim()) return [exercise];
          if (savedSnapshot) {
            for (const savedDay of savedSnapshot.days) {
              const saved = savedDay.exercises.find(item => item.id === exercise.id);
              if (saved) return [{ ...exercise, exerciseDisplayName: saved.exerciseDisplayName, exerciseSlug: saved.exerciseSlug }];
            }
          }
          return [];
        }),
      })),
    } : source;
    if (options.preserveIncomplete && savedSnapshot && splitToSave.name.trim() === savedSnapshot.name.trim() &&
      splitToSave.days.every(day => {
        const savedDay = savedSnapshot.days.find(item => item.weekday === day.weekday);
        return savedDay && day.workoutType.trim() === savedDay.workoutType.trim() &&
          day.exercises.length === savedDay.exercises.length &&
          day.exercises.every((exercise, index) =>
            exercise.exerciseDisplayName.trim() === savedDay.exercises[index]?.exerciseDisplayName.trim() &&
            exercise.sets === savedDay.exercises[index]?.sets);
      })) {
      markDirty(source.id ?? DRAFT_SPLIT_KEY,
        source.days.some(day => day.exercises.some(exercise => !exercise.exerciseDisplayName.trim())));
      return true;
    }
    savingRef.current = true;
    setIsSaving(true);

    try {
      const savedSplit = await saveWorkoutSplit(splitToSave);
      const current = libraryRef.current.find(item => item.id === splitToSave.id);
      const hasIncompleteEdits = Boolean(options.preserveIncomplete &&
        current?.days.some(day => day.exercises.some(exercise => !exercise.exerciseDisplayName.trim())));
      const hasNewerEdits = current !== currentAtStart || hasIncompleteEdits;
      const nextLibrary = libraryRef.current.map(item => item.id !== splitToSave.id ? item
        : hasNewerEdits ? { ...item, id: savedSplit.id, isActive: savedSplit.isActive }
          : retainExerciseIdentity(savedSplit, splitToSave));
      libraryRef.current = nextLibrary;
      setSplits(nextLibrary);
      if (!splitToSave.id && savedSplit.id) setSavedDraftId(savedSplit.id);
      if (!splitToSave.id) setSelectedSplitId(selected => selected === null ? savedSplit.id : selected);
      rememberSavedSplit(retainExerciseIdentity(savedSplit, splitToSave));
      markDirty(splitToSave.id ?? DRAFT_SPLIT_KEY, hasNewerEdits && splitToSave.id === savedSplit.id);
      markDirty(savedSplit.id ?? DRAFT_SPLIT_KEY, hasNewerEdits);
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
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  function renameSplit(name: string, target = split) {
    if (isSaving || name === target.name) return;
    const key = target.id ?? DRAFT_SPLIT_KEY;
    markDirty(key, true);
    setSplits(current => current.map(item =>
      (item.id ?? DRAFT_SPLIT_KEY) === key ? { ...item, name } : item,
    ));
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
      return false;
    }

    if (refuseInPreview("Deleting splits is disabled in this preview.")) {
      return false;
    }

    setIsSaving(true);

    try {
      const deleted = await deleteWorkoutSplit(splitId);
      // A library cannot be empty: deleting the last split leaves an unsaved
      // draft, and that draft is what discarding edits returns to.
      const replacement = withExerciseDraftIds(createUnsavedWorkoutSplitDraft(initialSplit));

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
      confirmedSplitKeysRef.current.delete(splitId);
      for (const [key, snapshot] of getSavedSplits()) {
        getSavedSplits().set(key, { ...snapshot, isActive: Boolean(snapshot.id && snapshot.id === deleted.activeSplitId) });
      }
      markDirty(splitId, false);
      posthog.capture("workout_split_deleted");
      notify("Split deleted.", "success");
      onRefresh();
      return true;
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to delete split.",
        "error",
      );
      return false;
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
      notify(message, "info");
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

  function applyDayOrder(orderedWeekdays: SplitWeekdayValue[]) {
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
  }

  function selectSplit(splitId: string | null) {
    clearAllExerciseSuggestions();
    setSelectedSplitId(splitId);
  }

  return {
    split,
    splits,
    activeSplitId: splits.find((item) => item.isActive)?.id ?? null,
    editorKey: split.id && split.id !== savedDraftId ? split.id : DRAFT_SPLIT_KEY,
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
    applyDayOrder,
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
