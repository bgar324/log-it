"use client";

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { WeightUnit } from "@/lib/weight-unit";
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
import { useWorkoutLoggerDrag } from "./use-workout-logger-drag";

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
    }),
  );
  const {
    draggingExerciseIndex,
    dropTargetExerciseIndex,
    dragOverExercise,
    dropExerciseAt,
    endExerciseDrag,
    startDraggingExercise,
  } = useWorkoutLoggerDrag({
    onReorder: (updater) => {
      dispatch({
        type: "update_exercises",
        updater,
      });
    },
  });

  useEffect(() => {
    dispatch({
      type: "replace",
      value: {
        title: initialState.title,
        workoutType: initialState.workoutType,
        performedAt: initialState.performedAt,
        exercises: initialState.exercises,
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
      const hydrated = hydrateExercisesFromSnapshot(storedDraft.exercises);
      dispatch({
        type: "replace",
        value: {
          title: storedDraft.title,
          workoutType: initialState.workoutType,
          performedAt: initialState.performedAt,
          exercises: hydrated.exercises,
        },
      });
      idCounterRef.current = hydrated.counters;
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

  function updateSet(
    exerciseId: string,
    setId: string,
    field: keyof ExerciseSetDraft,
    value: string,
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
    draggingExerciseIndex,
    dragOverExercise,
    dropExerciseAt,
    endExerciseDrag,
    dropTargetExerciseIndex,
    exercises: draftState.exercises,
    performedAt: draftState.performedAt,
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
    startDraggingExercise,
    setWorkoutType: (value: string) => {
      dispatch({ type: "set_workout_type", value });
    },
    title: draftState.title,
    updateSet,
    workoutType: draftState.workoutType,
  };
}
