"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { WeightUnit } from "@/lib/weight-unit";
import { displayWeightToPounds, formatWeightInputValueFromPounds } from "@/lib/weight-unit";
import { recoverWorkoutDraft } from "@/lib/workouts/draft-recovery";
import { clearStoredWorkoutDraft, readStoredWorkoutDraft } from "../workout-logger.draft";
import {
  createExerciseDraft,
  createInitialLoggerState,
  createSetDraft,
  createWorkoutDraftSnapshot,
  hydrateExercisesFromSnapshot,
  parseStoredWorkoutDraft,
  persistWorkoutDraft,
  type ExerciseDraft,
  type ExerciseSetDraft,
  type WorkoutDraftSnapshot,
  type WorkoutLoggerInitialData,
} from "../workout-logger.utils";

type UseWorkoutLoggerDraftOptions = {
  initialData?: WorkoutLoggerInitialData;
  isEditMode: boolean;
  weightUnit: WeightUnit;
};

type DraftState = {
  title: string;
  workoutType: string;
  performedAt: string;
  exercises: ExerciseDraft[];
  recovery: { status: "pending" | "none" } | { status: "restored"; snapshot: WorkoutDraftSnapshot };
  hasUnsavedEdits: boolean;
};

type DraftAction =
  | { type: "replace"; value: DraftState }
  | { type: "mark_saved" }
  | { type: "finish_recovery" }
  | { type: "set_title"; value: string }
  | { type: "set_workout_type"; value: string }
  | { type: "set_performed_at"; value: string }
  | {
      type: "update_exercises";
      updater: (current: ExerciseDraft[]) => ExerciseDraft[];
    };

function draftStateReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case "replace":
      return action.value;
    case "mark_saved":
      return { ...state, recovery: { status: "none" }, hasUnsavedEdits: false };
    case "finish_recovery":
      return { ...state, recovery: { status: "none" } };
    case "set_title":
      return { ...state, title: action.value, hasUnsavedEdits: true };
    case "set_workout_type":
      return { ...state, workoutType: action.value, hasUnsavedEdits: true };
    case "set_performed_at":
      return { ...state, performedAt: action.value, hasUnsavedEdits: true };
    case "update_exercises":
      return { ...state, exercises: action.updater(state.exercises), hasUnsavedEdits: true };
    default:
      return state;
  }
}

export function useWorkoutLoggerDraft({
  initialData,
  isEditMode,
  weightUnit,
}: UseWorkoutLoggerDraftOptions) {
  const initialState = useMemo(
    () => createInitialLoggerState(initialData),
    [initialData],
  );
  const idCounterRef = useRef(initialState.counters);
  const appliedSeedRef = useRef(initialState);
  const draftWeightUnitRef = useRef(weightUnit);
  const autosaveReadyRef = useRef(false);
  // Two separate questions. `autosaveReadyRef` says recovery has run, so a
  // write cannot race the restore. `hasUnsavedEditsRef` says the user actually
  // changed something: without it, merely opening the logger stored a draft
  // stamped with today's date, and that unwanted draft pinned the logger to a
  // past day on every later visit.
  const hasUnsavedEditsRef = useRef(false);
  // The ref is what the autosave and the `pagehide` flush read, because both
  // need the answer synchronously. The state is the same fact for rendering:
  // edit mode has no autosaved draft, so a view has to be able to warn before
  // the user walks away from typed changes.

  const persistedRawRef = useRef<string | null>(null);
  const [draftState, dispatch] = useReducer(
    draftStateReducer,
    initialState,
    (state): DraftState => ({
      title: state.title,
      workoutType: state.workoutType,
      performedAt: state.performedAt,
      exercises: state.exercises,
      recovery: { status: isEditMode ? "none" : "pending" },
      hasUnsavedEdits: false,
    }),
  );
  const latestDraftStateRef = useRef(draftState);
  const persistOwnedSnapshot = useCallback((snapshot: WorkoutDraftSnapshot) => {
    if (isEditMode || !autosaveReadyRef.current || !hasUnsavedEditsRef.current) return;
    const raw = persistWorkoutDraft(snapshot, weightUnit, persistedRawRef.current);
    if (raw !== null) persistedRawRef.current = raw;
  }, [isEditMode, weightUnit]);
  useLayoutEffect(() => {
    latestDraftStateRef.current = draftState;
  }, [draftState]);
  useEffect(() => {
    if (appliedSeedRef.current === initialState && draftWeightUnitRef.current === weightUnit) return;
    appliedSeedRef.current = initialState;
    const previousUnit = draftWeightUnitRef.current;
    draftWeightUnitRef.current = weightUnit;
    if (hasUnsavedEditsRef.current || latestDraftStateRef.current.recovery.status === "restored") {
      if (previousUnit !== weightUnit) {
        hasUnsavedEditsRef.current = true;
        const current = latestDraftStateRef.current;
        const next: DraftState = {
          ...current,
          hasUnsavedEdits: true,
          exercises: current.exercises.map(exercise => ({
            ...exercise,
            sets: exercise.sets.map(set => ({
              ...set,
              weightLb: set.weightLb.trim() && Number.isFinite(Number(set.weightLb))
                ? formatWeightInputValueFromPounds(displayWeightToPounds(Number(set.weightLb), previousUnit), weightUnit)
                : set.weightLb,
            })),
          })),
        };
        latestDraftStateRef.current = next;
        persistOwnedSnapshot(createWorkoutDraftSnapshot(next.title, next.workoutType, next.performedAt, next.exercises));
        dispatch({ type: "replace", value: next });
      }
      return;
    }
    dispatch({
      type: "replace",
      value: {
        title: initialState.title,
        workoutType: initialState.workoutType,
        performedAt: initialState.performedAt,
        exercises: initialState.exercises,
        recovery: { status: "none" },
        hasUnsavedEdits: false,
      },
    });
    idCounterRef.current = initialState.counters;
  }, [initialState, persistOwnedSnapshot, weightUnit]);

  useLayoutEffect(() => {
    if (autosaveReadyRef.current) return;
    if (isEditMode) {
      autosaveReadyRef.current = true;
      return;
    }

    const rawDraft = readStoredWorkoutDraft();
    persistedRawRef.current = rawDraft;
    const storedDraft = parseStoredWorkoutDraft(rawDraft, weightUnit);

    if (storedDraft) {
      const recoveredState = recoverWorkoutDraft(
        storedDraft,
        hydrateExercisesFromSnapshot(storedDraft.exercises),
      );
      dispatch({
        type: "replace",
        value: {
          title: recoveredState.title,
          workoutType: recoveredState.workoutType,
          performedAt: recoveredState.performedAt,
          exercises: recoveredState.exercises,
          recovery: { status: "restored", snapshot: storedDraft },
          hasUnsavedEdits: false,
        },
      });
      idCounterRef.current = recoveredState.counters;
    } else {
      if (rawDraft && clearStoredWorkoutDraft(rawDraft)) persistedRawRef.current = null;
      dispatch({ type: "finish_recovery" });
    }

    autosaveReadyRef.current = true;
  }, [initialState.performedAt, initialState.workoutType, isEditMode, weightUnit]);



  useEffect(() => {
    if (isEditMode) {
      return;
    }

    function handlePageHide() {
      // A saved workout has no draft. Flushing the last in-memory state here
      // used to resurrect the draft that `markSaved` had just deleted, which
      // left the logger stuck on the saved workout's date forever.
      if (!autosaveReadyRef.current || !hasUnsavedEditsRef.current) {
        return;
      }
      const latestDraftState = latestDraftStateRef.current;
      persistOwnedSnapshot(
        createWorkoutDraftSnapshot(
          latestDraftState.title,
          latestDraftState.workoutType,
          latestDraftState.performedAt,
          latestDraftState.exercises,
        ),
      );
    }

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      handlePageHide();
    };
  }, [isEditMode, persistOwnedSnapshot]);

  // Every user-driven change goes through here. Seeding and recovery use
  // `dispatch` directly, because neither is an edit the user made.
  function commitEdit(action: DraftAction) {
    const next = draftStateReducer(latestDraftStateRef.current, action);
    latestDraftStateRef.current = next;
    hasUnsavedEditsRef.current = true;
    // Claim real input immediately. A delayed writer must not overwrite a
    // later save/removal, or leave an edit invisible to another window's check.
    if (readStoredWorkoutDraft() === null) persistedRawRef.current = null;
    persistOwnedSnapshot(createWorkoutDraftSnapshot(next.title, next.workoutType, next.performedAt, next.exercises));
    dispatch({ type: "replace", value: next });
  }



  // Called once the workout is stored server-side: delete the draft and disarm
  // every writer that could put it back.
  function markSaved() {
    hasUnsavedEditsRef.current = false;
    dispatch({ type: "mark_saved" });
    if (!isEditMode && clearStoredWorkoutDraft(persistedRawRef.current)) persistedRawRef.current = null;
  }

  // Throw the recovered draft away and fall back to what the server seeded for
  // the selected date. The counters are copied, because `nextExerciseId`
  // mutates them in place.
  function discardDraft() {
    hasUnsavedEditsRef.current = false;
    if (!isEditMode && clearStoredWorkoutDraft(persistedRawRef.current)) persistedRawRef.current = null;
    idCounterRef.current = { ...initialState.counters };
    dispatch({
      type: "replace",
      value: {
        title: initialState.title,
        workoutType: initialState.workoutType,
        performedAt: initialState.performedAt,
        exercises: initialState.exercises,
        recovery: { status: "none" },
        hasUnsavedEdits: false,
      },
    });
  }

  function nextExerciseId() {
    idCounterRef.current.exercise += 1;
    return `exercise-${idCounterRef.current.exercise}`;
  }

  function nextSetId() {
    idCounterRef.current.set += 1;
    return `set-${idCounterRef.current.set}`;
  }

  function updateExercise(
    id: string,
    updater: (exercise: ExerciseDraft) => ExerciseDraft,
  ) {
    commitEdit({
      type: "update_exercises",
      updater: (current) =>
        current.map((exercise) =>
          exercise.id === id ? updater(exercise) : exercise,
        ),
    });
  }

  function setExerciseName(exerciseId: string, name: string) {
    const current = latestDraftStateRef.current.exercises.find(exercise => exercise.id === exerciseId);
    if (!current || current.name === name) return;
    updateExercise(exerciseId, (exercise) => ({
      ...exercise,
      name,
    }));
  }

  function addExercise() {
    commitEdit({
      type: "update_exercises",
      updater: (current) => [
        ...current,
        createExerciseDraft(nextExerciseId(), nextSetId()),
      ],
    });
  }

  function removeExercise(id: string) {
    commitEdit({
      type: "update_exercises",
      updater: (current) => {
        if (current.length === 1) {
          return current;
        }

        return current.filter((exercise) => exercise.id !== id);
      },
    });
  }

  function reorderExercisesById(orderedExerciseIds: string[]) {
    commitEdit({
      type: "update_exercises",
      updater: (current) => {
        const exercisesById = new Map(
          current.map((exercise) => [exercise.id, exercise]),
        );
        const reordered = orderedExerciseIds
          .map((exerciseId) => exercisesById.get(exerciseId))
          .filter((exercise): exercise is ExerciseDraft => Boolean(exercise));

        if (reordered.length !== current.length) {
          return current;
        }

        return reordered;
      },
    });
  }

  function addSet(exerciseId: string) {
    updateExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: [
        ...exercise.sets,
        createSetDraft(nextSetId()),
      ],
    }));
  }

  function removeSet(exerciseId: string, setId: string) {
    updateExercise(exerciseId, (exercise) => {
      if (exercise.sets.length === 1) {
        return exercise;
      }

      return {
        ...exercise,
        sets: exercise.sets.filter((setItem) => setItem.id !== setId),
      };
    });
  }

  function updateSet<K extends keyof ExerciseSetDraft>(
    exerciseId: string,
    setId: string,
    field: K,
    value: ExerciseSetDraft[K],
  ) {
    updateExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((setItem) =>
        setItem.id === setId ? { ...setItem, [field]: value } : setItem,
      ),
    }));
  }

  function resetExercisesFromSnapshot(
    exercises: WorkoutDraftSnapshot["exercises"],
  ) {
    const hydrated = hydrateExercisesFromSnapshot(exercises);
    idCounterRef.current = hydrated.counters;
    commitEdit({
      type: "update_exercises",
      updater: () => hydrated.exercises,
    });
  }

  return {
    addExercise,
    addSet,
    discardDraft,
    isRecoveryReady: draftState.recovery.status !== "pending",
    exercises: draftState.exercises,
    hasRecoveredDraft: draftState.recovery.status === "restored",
    recoveredSnapshot: draftState.recovery.status === "restored" ? draftState.recovery.snapshot : null,
    hasUnsavedEdits: draftState.hasUnsavedEdits,
    markSaved,
    performedAt: draftState.performedAt,
    reorderExercisesById,
    removeExercise,
    removeSet,
    resetExercisesFromSnapshot,
    setExerciseName,
    setPerformedAt: (value: string) => {
      commitEdit({ type: "set_performed_at", value });
    },
    setTitle: (value: string) => {
      commitEdit({ type: "set_title", value });
    },
    setWorkoutType: (value: string) => {
      commitEdit({ type: "set_workout_type", value });
    },
    title: draftState.title,
    updateSet,
    workoutType: draftState.workoutType,
  };
}
