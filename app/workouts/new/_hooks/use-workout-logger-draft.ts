"use client";

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { WeightUnit } from "@/lib/weight-unit";
import { recoverWorkoutDraft } from "@/lib/workouts/draft-recovery";
import {
  WORKOUT_AUTOSAVE_DELAY_MS,
  WORKOUT_DRAFT_STORAGE_KEY,
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
  isRecoveredDraft: boolean;
};

type DraftAction =
  | { type: "replace"; value: DraftState }
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
    case "set_title":
      return { ...state, title: action.value };
    case "set_workout_type":
      return { ...state, workoutType: action.value };
    case "set_performed_at":
      return { ...state, performedAt: action.value };
    case "update_exercises":
      return { ...state, exercises: action.updater(state.exercises) };
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
  const autosaveReadyRef = useRef(false);
  const latestDraftSnapshotRef = useRef<WorkoutDraftSnapshot | null>(null);
  const [draftState, dispatch] = useReducer(
    draftStateReducer,
    initialState,
    (state) => ({
      title: state.title,
      workoutType: state.workoutType,
      performedAt: state.performedAt,
      exercises: state.exercises,
      isRecoveredDraft: false,
    }),
  );
  useEffect(() => {
    dispatch({
      type: "replace",
      value: {
        title: initialState.title,
        workoutType: initialState.workoutType,
        performedAt: initialState.performedAt,
        exercises: initialState.exercises,
        isRecoveredDraft: false,
      },
    });
    idCounterRef.current = initialState.counters;
  }, [initialState]);

  useEffect(() => {
    if (isEditMode) {
      autosaveReadyRef.current = true;
      return;
    }

    const rawDraft = window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY);
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
          isRecoveredDraft: true,
        },
      });
      idCounterRef.current = recoveredState.counters;
    } else if (rawDraft) {
      window.localStorage.removeItem(WORKOUT_DRAFT_STORAGE_KEY);
    }

    autosaveReadyRef.current = true;
  }, [initialState.performedAt, initialState.workoutType, isEditMode, weightUnit]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    latestDraftSnapshotRef.current = createWorkoutDraftSnapshot(
      draftState.title,
      draftState.workoutType,
      draftState.performedAt,
      draftState.exercises,
    );
  }, [
    draftState.exercises,
    draftState.performedAt,
    draftState.title,
    draftState.workoutType,
    isEditMode,
  ]);

  useEffect(() => {
    if (isEditMode || !autosaveReadyRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const snapshot = createWorkoutDraftSnapshot(
        draftState.title,
        draftState.workoutType,
        draftState.performedAt,
        draftState.exercises,
      );
      latestDraftSnapshotRef.current = snapshot;
      persistWorkoutDraft(snapshot, weightUnit);
    }, WORKOUT_AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    draftState.exercises,
    draftState.performedAt,
    draftState.title,
    draftState.workoutType,
    isEditMode,
    weightUnit,
  ]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    function handlePageHide() {
      if (!autosaveReadyRef.current || !latestDraftSnapshotRef.current) {
        return;
      }

      persistWorkoutDraft(latestDraftSnapshotRef.current, weightUnit);
    }

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isEditMode, weightUnit]);

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
    dispatch({
      type: "update_exercises",
      updater: (current) =>
        current.map((exercise) =>
          exercise.id === id ? updater(exercise) : exercise,
        ),
    });
  }

  function setExerciseName(exerciseId: string, name: string) {
    updateExercise(exerciseId, (exercise) => ({
      ...exercise,
      name,
    }));
  }

  function addExercise() {
    dispatch({
      type: "update_exercises",
      updater: (current) => [
        ...current,
        createExerciseDraft(nextExerciseId(), nextSetId()),
      ],
    });
  }

  function removeExercise(id: string) {
    dispatch({
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
    dispatch({
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
      sets: [...exercise.sets, createSetDraft(nextSetId())],
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
    dispatch({
      type: "update_exercises",
      updater: () => hydrated.exercises,
    });
  }

  return {
    addExercise,
    addSet,
    exercises: draftState.exercises,
    hasRecoveredDraft: draftState.isRecoveredDraft,
    performedAt: draftState.performedAt,
    reorderExercisesById,
    removeExercise,
    removeSet,
    resetExercisesFromSnapshot,
    setExerciseName,
    setPerformedAt: (value: string) => {
      dispatch({ type: "set_performed_at", value });
    },
    setTitle: (value: string) => {
      dispatch({ type: "set_title", value });
    },
    setWorkoutType: (value: string) => {
      dispatch({ type: "set_workout_type", value });
    },
    title: draftState.title,
    updateSet,
    workoutType: draftState.workoutType,
  };
}
