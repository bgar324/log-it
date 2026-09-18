"use client";

import { useEffect, useLayoutEffect, useMemo, useReducer, useRef } from "react";
import type { WeightUnit } from "@/lib/weight-unit";
import type { WorkoutLoggerInitialData } from "@/app/workouts/new/workout-logger.utils";
import {
  applySetBodyweight,
  applySetValue,
  clearIonicDraftStorage,
  createIonicIdFactory,
  createIonicInitialSnapshot,
  createIonicSetDraft,
  findSetTarget,
  highestIdSuffix,
  hydrateIonicExercises,
  ionicDraftStorageKey,
  persistIonicDraft,
  readIonicDraft,
  readLegacyWorkoutDraft,
  resolveActivePointer,
  validateSetForCompletion,
  type IonicIdFactory,
} from "./ionic-logger-draft";
import {
  IONIC_AUTOSAVE_DELAY_MS,
  type IonicDraftSource,
  type IonicLoggerExerciseDraft,
  type IonicLoggerSetDraft,
  type IonicLoggerSnapshot,
  type IonicSetValueField,
} from "./ionic-logger.types";

type IonicDraftState = IonicLoggerSnapshot & {
  recoverySource: IonicDraftSource | null;
  convertedFromUnit: WeightUnit | null;
};

type IonicDraftAction =
  | { type: "replace"; value: IonicDraftState }
  | { type: "patch"; value: Partial<IonicDraftState> }
  | {
      type: "map_exercises";
      updater: (exercises: IonicLoggerExerciseDraft[]) => IonicLoggerExerciseDraft[];
      focus?: { exerciseId: string; setId: string | null };
    }
  | { type: "complete_set"; exerciseId: string; setId: string };

function mapSet(
  exercises: IonicLoggerExerciseDraft[],
  exerciseId: string,
  setId: string,
  updater: (setItem: IonicLoggerSetDraft) => IonicLoggerSetDraft,
) {
  return exercises.map((exercise) =>
    exercise.id === exerciseId
      ? {
          ...exercise,
          sets: exercise.sets.map((setItem) =>
            setItem.id === setId ? updater(setItem) : setItem,
          ),
        }
      : exercise,
  );
}

function draftReducer(
  state: IonicDraftState,
  action: IonicDraftAction,
): IonicDraftState {
  switch (action.type) {
    case "replace":
      return action.value;
    case "patch":
      return { ...state, ...action.value };
    case "map_exercises": {
      const exercises = action.updater(state.exercises);
      const pointer = resolveActivePointer(
        exercises,
        action.focus?.exerciseId ?? state.activeExerciseId,
        action.focus ? action.focus.setId : state.activeSetId,
      );

      return { ...state, exercises, ...pointer };
    }
    case "complete_set": {
      const exercises = mapSet(
        state.exercises,
        action.exerciseId,
        action.setId,
        (setItem) => ({ ...setItem, isCompleted: true }),
      );
      // After a set becomes a result, the session moves to the next set that
      // is not one yet — inside this exercise first, then the following
      // exercises. When everything is complete the pointer stays put so the
      // just-finished set is still on screen next to Finish.
      const nextTarget =
        findSetTarget(
          exercises,
          (setItem) => !setItem.isCompleted,
          action.exerciseId,
        ) ?? {
          activeExerciseId: state.activeExerciseId,
          activeSetId: state.activeSetId,
        };

      return { ...state, exercises, ...nextTarget };
    }
    default:
      return state;
  }
}

export type UseIonicLoggerDraftOptions = {
  initialData?: WorkoutLoggerInitialData;
  isEditMode: boolean;
  userId: string;
  weightUnit: WeightUnit;
};

export type IonicLoggerDraft = {
  title: string;
  workoutType: string;
  performedAt: string;
  exercises: IonicLoggerExerciseDraft[];
  activeExerciseId: string | null;
  activeSetId: string | null;
  hasRecoveredDraft: boolean;
  recoverySource: IonicDraftSource | null;
  convertedFromUnit: WeightUnit | null;
  setTitle: (value: string) => void;
  setWorkoutType: (value: string) => void;
  setPerformedAt: (value: string) => void;
  focusExercise: (exerciseId: string) => void;
  focusSet: (exerciseId: string, setId: string) => void;
  setExerciseName: (exerciseId: string, name: string) => void;
  addExercise: () => void;
  removeExercise: (exerciseId: string) => void;
  reorderExercisesById: (orderedExerciseIds: string[]) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  updateSetValue: (
    exerciseId: string,
    setId: string,
    field: IonicSetValueField,
    value: string,
  ) => void;
  setUsesBodyweight: (
    exerciseId: string,
    setId: string,
    usesBodyweight: boolean,
  ) => void;
  completeSet: (exerciseId: string, setId: string) => void;
  reopenSet: (exerciseId: string, setId: string) => void;
  resetExercisesFromSnapshot: (
    exercises: WorkoutLoggerInitialData["exercises"],
  ) => void;
  markSaved: () => void;
  discardDraft: () => void;
};

export function useIonicLoggerDraft({
  initialData,
  isEditMode,
  userId,
  weightUnit,
}: UseIonicLoggerDraftOptions): IonicLoggerDraft {
  const storageKey = useMemo(() => ionicDraftStorageKey(userId), [userId]);
  const seed = useMemo(
    () =>
      createIonicInitialSnapshot(initialData, {
        // Edit mode opens the saved workout, and every set in it is already a
        // result: they start completed so Finish preserves them untouched.
        markCompleted: isEditMode,
      }),
    [initialData, isEditMode],
  );
  const idsRef = useRef<IonicIdFactory>(createIonicIdFactory(seed.idSeed));
  // Recovery has run, so a write cannot race the restore.
  const restoreDoneRef = useRef(false);
  // The user actually changed something. Without this, merely opening the
  // logger stored a dated draft that pinned later visits to a past day.
  const hasUnsavedEditsRef = useRef(false);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const [state, dispatch] = useReducer(draftReducer, {
    ...seed.snapshot,
    recoverySource: null,
    convertedFromUnit: null,
  });
  const latestStateRef = useRef(state);
  useLayoutEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  // Re-seeding only happens while the session is untouched. The shell can
  // refetch its data at any time, and replacing live state on a new prop
  // identity would delete sets the user had already completed.
  useEffect(() => {
    if (hasUnsavedEditsRef.current || latestStateRef.current.recoverySource) {
      return;
    }

    idsRef.current = createIonicIdFactory(seed.idSeed);
    dispatch({
      type: "replace",
      value: { ...seed.snapshot, recoverySource: null, convertedFromUnit: null },
    });
  }, [seed]);

  useEffect(() => {
    if (isEditMode) {
      // An edit session is never persisted: the saved workout is the source of
      // truth, and a stale local copy could silently overwrite it later.
      restoreDoneRef.current = true;
      return;
    }

    const recovered =
      readIonicDraft(storageKey, userId, weightUnit) ??
      readLegacyWorkoutDraft(weightUnit);

    if (recovered) {
      idsRef.current = createIonicIdFactory(
        highestIdSuffix(recovered.snapshot.exercises),
      );
      dispatch({
        type: "replace",
        value: {
          ...recovered.snapshot,
          recoverySource: recovered.source,
          convertedFromUnit: recovered.convertedFromUnit,
        },
      });
    }

    restoreDoneRef.current = true;
  }, [storageKey, isEditMode, userId, weightUnit]);

  useEffect(() => {
    if (isEditMode || !restoreDoneRef.current || !hasUnsavedEditsRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      autosaveTimeoutRef.current = null;
      persistIonicDraft(storageKey, userId, latestStateRef.current, weightUnit);
    }, IONIC_AUTOSAVE_DELAY_MS);
    autosaveTimeoutRef.current = timeoutId;

    return () => {
      window.clearTimeout(timeoutId);

      if (autosaveTimeoutRef.current === timeoutId) {
        autosaveTimeoutRef.current = null;
      }
    };
  }, [state, storageKey, isEditMode, userId, weightUnit]);

  // Two ways out of the session that a debounce cannot cover: the tab going
  // away (`pagehide`, which iOS fires on backgrounding and lock) and the shell
  // unmounting the logger on route change. Both flush the latest state, and
  // both respect the same guards, so a saved session is never resurrected.
  useEffect(() => {
    if (isEditMode) {
      return;
    }

    function flush() {
      if (!restoreDoneRef.current || !hasUnsavedEditsRef.current) {
        return;
      }

      persistIonicDraft(storageKey, userId, latestStateRef.current, weightUnit);
    }

    window.addEventListener("pagehide", flush);

    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [storageKey, isEditMode, userId, weightUnit]);

  // Every user-driven change goes through here. Seeding and recovery dispatch
  // directly, because neither is an edit the user made.
  function commit(action: IonicDraftAction) {
    hasUnsavedEditsRef.current = true;
    dispatch(action);
  }

  function cancelPendingAutosave() {
    if (autosaveTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = null;
  }

  return {
    title: state.title,
    workoutType: state.workoutType,
    performedAt: state.performedAt,
    exercises: state.exercises,
    activeExerciseId: state.activeExerciseId,
    activeSetId: state.activeSetId,
    hasRecoveredDraft: state.recoverySource !== null,
    recoverySource: state.recoverySource,
    convertedFromUnit: state.convertedFromUnit,
    setTitle: (value) => {
      commit({ type: "patch", value: { title: value } });
    },
    setWorkoutType: (value) => {
      commit({ type: "patch", value: { workoutType: value } });
    },
    setPerformedAt: (value) => {
      commit({ type: "patch", value: { performedAt: value } });
    },
    focusExercise: (exerciseId) => {
      dispatch({
        type: "patch",
        value: resolveActivePointer(latestStateRef.current.exercises, exerciseId, null),
      });
    },
    focusSet: (exerciseId, setId) => {
      dispatch({ type: "patch", value: { activeExerciseId: exerciseId, activeSetId: setId } });
    },
    setExerciseName: (exerciseId, name) => {
      commit({
        type: "map_exercises",
        updater: (exercises) =>
          exercises.map((exercise) =>
            exercise.id === exerciseId ? { ...exercise, name } : exercise,
          ),
      });
    },
    addExercise: () => {
      const exerciseId = idsRef.current.nextExerciseId();
      const setId = idsRef.current.nextSetId();
      commit({
        type: "map_exercises",
        updater: (exercises) => [
          ...exercises,
          { id: exerciseId, name: "", sets: [createIonicSetDraft(setId)] },
        ],
        focus: { exerciseId, setId },
      });
    },
    removeExercise: (exerciseId) => {
      commit({
        type: "map_exercises",
        updater: (exercises) =>
          exercises.length === 1
            ? exercises
            : exercises.filter((exercise) => exercise.id !== exerciseId),
      });
    },
    reorderExercisesById: (orderedExerciseIds) => {
      commit({
        type: "map_exercises",
        updater: (exercises) => {
          const reordered = orderedExerciseIds
            .map((exerciseId) =>
              exercises.find((exercise) => exercise.id === exerciseId),
            )
            .filter(
              (exercise): exercise is IonicLoggerExerciseDraft =>
                exercise !== undefined,
            );

          return reordered.length === exercises.length ? reordered : exercises;
        },
      });
    },
    addSet: (exerciseId) => {
      const setId = idsRef.current.nextSetId();
      commit({
        type: "map_exercises",
        updater: (exercises) =>
          exercises.map((exercise) =>
            exercise.id === exerciseId
              ? {
                  ...exercise,
                  sets: [
                    ...exercise.sets,
                    createIonicSetDraft(
                      setId,
                      exercise.sets[exercise.sets.length - 1],
                    ),
                  ],
                }
              : exercise,
          ),
        focus: { exerciseId, setId },
      });
    },
    removeSet: (exerciseId, setId) => {
      commit({
        type: "map_exercises",
        updater: (exercises) =>
          exercises.map((exercise) =>
            exercise.id === exerciseId && exercise.sets.length > 1
              ? {
                  ...exercise,
                  sets: exercise.sets.filter((setItem) => setItem.id !== setId),
                }
              : exercise,
          ),
      });
    },
    updateSetValue: (exerciseId, setId, field, value) => {
      commit({
        type: "map_exercises",
        updater: (exercises) =>
          mapSet(exercises, exerciseId, setId, (setItem) =>
            applySetValue(setItem, field, value),
          ),
      });
    },
    setUsesBodyweight: (exerciseId, setId, usesBodyweight) => {
      commit({
        type: "map_exercises",
        updater: (exercises) =>
          mapSet(exercises, exerciseId, setId, (setItem) =>
            applySetBodyweight(setItem, usesBodyweight),
          ),
      });
    },
    completeSet: (exerciseId, setId) => {
      const exercise = latestStateRef.current.exercises.find(
        (item) => item.id === exerciseId,
      );
      const setItem = exercise?.sets.find((item) => item.id === setId);

      if (!setItem || validateSetForCompletion(setItem, weightUnit) !== null) {
        return;
      }

      hasUnsavedEditsRef.current = true;
      dispatch({ type: "complete_set", exerciseId, setId });
    },
    reopenSet: (exerciseId, setId) => {
      commit({
        type: "map_exercises",
        updater: (exercises) =>
          mapSet(exercises, exerciseId, setId, (setItem) => ({
            ...setItem,
            isCompleted: false,
          })),
        focus: { exerciseId, setId },
      });
    },
    resetExercisesFromSnapshot: (exercises) => {
      const hydrated = hydrateIonicExercises(exercises, idsRef.current, {
        markCompleted: false,
      });
      commit({
        type: "map_exercises",
        updater: () => hydrated,
        focus: {
          exerciseId: hydrated[0]?.id ?? "",
          setId: hydrated[0]?.sets[0]?.id ?? null,
        },
      });
    },
    // Called once the workout is stored server-side: delete the draft and
    // disarm every writer that could put it back.
    markSaved: () => {
      hasUnsavedEditsRef.current = false;
      cancelPendingAutosave();
      clearIonicDraftStorage(storageKey, latestStateRef.current.adoptedLegacyValue);
    },
    // Throwing the draft away is deliberate, and it returns the logger to what
    // the server seeded for this date.
    discardDraft: () => {
      hasUnsavedEditsRef.current = false;
      cancelPendingAutosave();
      clearIonicDraftStorage(storageKey, latestStateRef.current.adoptedLegacyValue);
      idsRef.current = createIonicIdFactory(seed.idSeed);
      dispatch({
        type: "replace",
        value: {
          ...createIonicInitialSnapshot(initialData, { markCompleted: isEditMode })
            .snapshot,
          recoverySource: null,
          convertedFromUnit: null,
        },
      });
    },
  };
}
