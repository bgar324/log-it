"use client";

import { GripVertical, Loader2, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import DatePicker from "react-datepicker";
import { ThemeToggle } from "@/app/components/theme-toggle";
import {
  normalizeExerciseDisplayName,
  normalizeExerciseLookupKey,
  pickBestExerciseSuggestion,
} from "@/lib/exercise-autofill";
import {
  formatDatabaseDateLabel,
  formatDatabaseDateValue,
  getCurrentPacificDate,
  reorderItems,
  toDatabaseDateFromInput,
} from "@/lib/workout-utils";
import {
  convertStoredWeightToDisplay,
  formatWeightWithUnit,
  getWeightUnitLabel,
  type WeightUnit,
} from "@/lib/weight-unit";
import styles from "./workout-logger.module.css";

type ExerciseSetDraft = {
  id: string;
  reps: string;
  weightLb: string;
};

type ExerciseDraft = {
  id: string;
  name: string;
  sets: ExerciseSetDraft[];
};

type ExerciseInsight = {
  exerciseName: string;
  normalizedName: string;
  sessionsCount: number;
  lastPerformedAt: string | null;
  lastSession: {
    workoutId: string;
    workoutTitle: string;
    performedAt: string;
    setCount: number;
    totalReps: number;
    bestWeight: number | null;
    bestWeightReps: number | null;
    totalVolume: number;
  } | null;
  allTimeBestWeight: number | null;
};

type ExerciseInsightState = {
  status: "idle" | "loading" | "ready" | "error";
  lookupKey?: string;
  data?: ExerciseInsight;
  error?: string;
};

type WorkoutDraftSnapshot = {
  title: string;
  workoutType: string;
  performedAt: string;
  exercises: Array<{
    name: string;
    sets: Array<{
      reps: string;
      weightLb: string;
    }>;
  }>;
};

export type WorkoutLoggerInitialData = WorkoutDraftSnapshot;

type WorkoutLoggerMode = "create" | "edit";

type WorkoutLoggerProps = {
  mode?: WorkoutLoggerMode;
  workoutId?: string;
  initialData?: WorkoutLoggerInitialData;
  weightUnit: WeightUnit;
};

type WorkoutDraftStoragePayload = WorkoutDraftSnapshot & {
  weightUnit: WeightUnit;
};

type ExerciseSuggestionsPayload = {
  suggestions?: string[];
  error?: string;
};

type WorkoutSubmitResponse = {
  id?: string;
  error?: string;
};

const INITIAL_EXERCISE_ID = "exercise-1";
const INITIAL_SET_ID = "set-1";
const WORKOUT_DRAFT_STORAGE_KEY = "logit-workout-draft-v2";
const WORKOUT_AUTOSAVE_DELAY_MS = 350;
const EXERCISE_SUGGESTION_DEBOUNCE_MS = 140;

function createSetDraft(id: string): ExerciseSetDraft {
  return {
    id,
    reps: "",
    weightLb: "",
  };
}

function createExerciseDraft(id: string, setId: string): ExerciseDraft {
  return {
    id,
    name: "",
    sets: [createSetDraft(setId)],
  };
}

function normalizePerformedAtInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return formatDatabaseDateValue(getCurrentPacificDate());
  }

  return formatDatabaseDateValue(toDatabaseDateFromInput(trimmed));
}

function toSafeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function sanitizeWeightInput(value: string) {
  const normalized = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");

  if (!normalized) {
    return "";
  }

  const firstDotIndex = normalized.indexOf(".");

  if (firstDotIndex === -1) {
    return normalized;
  }

  const whole = normalized.slice(0, firstDotIndex + 1);
  const fractional = normalized.slice(firstDotIndex + 1).replace(/\./g, "");

  return `${whole}${fractional}`;
}

function sanitizeRepsInput(value: string) {
  return value.replace(/\D/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createWorkoutDraftSnapshot(
  title: string,
  workoutType: string,
  performedAt: string,
  exercises: ExerciseDraft[],
): WorkoutDraftSnapshot {
  return {
    title,
    workoutType,
    performedAt,
    exercises: exercises.map((exercise) => ({
      name: toSafeString(exercise.name),
      sets:
        exercise.sets.length > 0
          ? exercise.sets.map((setItem) => ({
              reps: sanitizeRepsInput(toSafeString(setItem.reps)),
              weightLb: sanitizeWeightInput(toSafeString(setItem.weightLb)),
            }))
          : [{ reps: "", weightLb: "" }],
    })),
  };
}

function persistWorkoutDraft(
  snapshot: WorkoutDraftSnapshot,
  weightUnit: WeightUnit,
) {
  const payload: WorkoutDraftStoragePayload = {
    ...snapshot,
    weightUnit,
  };

  try {
    window.localStorage.setItem(
      WORKOUT_DRAFT_STORAGE_KEY,
      JSON.stringify(payload),
    );
    return true;
  } catch {
    return false;
  }
}

function parseStoredWorkoutDraft(
  rawValue: string | null,
  currentWeightUnit: WeightUnit,
) {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!isRecord(parsed)) {
      return null;
    }

    const title =
      typeof parsed.title === "string" ? parsed.title : "Gym session";
    const workoutType =
      typeof parsed.workoutType === "string" ? parsed.workoutType : "";
    const performedAtSource =
      typeof parsed.performedAt === "string" ? parsed.performedAt : "";
    const performedAt = formatDatabaseDateValue(
      toDatabaseDateFromInput(performedAtSource),
    );
    const weightUnit =
      parsed.weightUnit === "LB" || parsed.weightUnit === "KG"
        ? parsed.weightUnit
        : null;

    if (weightUnit !== currentWeightUnit) {
      return null;
    }

    const rawExercises = Array.isArray(parsed.exercises) ? parsed.exercises : [];
    const exercises = rawExercises
      .map((rawExercise) => {
        if (!isRecord(rawExercise)) {
          return null;
        }

        const name = toSafeString(rawExercise.name);
        const rawSets = Array.isArray(rawExercise.sets) ? rawExercise.sets : [];
        const sets = rawSets
          .map((rawSet) => {
            if (!isRecord(rawSet)) {
              return null;
            }

            return {
              reps: sanitizeRepsInput(toSafeString(rawSet.reps)),
              weightLb: sanitizeWeightInput(toSafeString(rawSet.weightLb)),
            };
          })
          .filter(
            (
              setItem,
            ): setItem is { reps: string; weightLb: string } =>
              setItem !== null,
          );

        return {
          name,
          sets: sets.length > 0 ? sets : [{ reps: "", weightLb: "" }],
        };
      })
      .filter(
        (
          exercise,
        ): exercise is WorkoutDraftSnapshot["exercises"][number] =>
          exercise !== null,
      );

    if (exercises.length === 0) {
      exercises.push({
        name: "",
        sets: [{ reps: "", weightLb: "" }],
      });
    }

    return {
      title,
      workoutType,
      performedAt,
      exercises,
    };
  } catch {
    return null;
  }
}

function hydrateExercisesFromSnapshot(
  exercises: WorkoutDraftSnapshot["exercises"],
) {
  let setCounter = 0;
  const hydrated = exercises.map((exercise, exerciseIndex) => ({
    id: `exercise-${exerciseIndex + 1}`,
    name: exercise.name,
    sets: exercise.sets.map((setItem) => {
      setCounter += 1;
      return {
        id: `set-${setCounter}`,
        reps: setItem.reps,
        weightLb: setItem.weightLb,
      };
    }),
  }));

  return {
    exercises:
      hydrated.length > 0
        ? hydrated
        : [createExerciseDraft(INITIAL_EXERCISE_ID, INITIAL_SET_ID)],
    counters: {
      exercise: Math.max(hydrated.length, 1),
      set: Math.max(setCounter, 1),
    },
  };
}

function createInitialLoggerState(initialData?: WorkoutLoggerInitialData) {
  if (!initialData) {
    return {
      title: "Gym session",
      workoutType: "",
      performedAt: formatDatabaseDateValue(getCurrentPacificDate()),
      exercises: [createExerciseDraft(INITIAL_EXERCISE_ID, INITIAL_SET_ID)],
      counters: {
        exercise: 1,
        set: 1,
      },
    };
  }

  const hydrated = hydrateExercisesFromSnapshot(initialData.exercises);

  return {
    title: toSafeString(initialData.title).trim() || "Gym session",
    workoutType: toSafeString(initialData.workoutType).trim(),
    performedAt: normalizePerformedAtInput(initialData.performedAt),
    exercises: hydrated.exercises,
    counters: hydrated.counters,
  };
}

function toOptionalPositiveNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function summarizeDraftSets(exercise: ExerciseDraft) {
  let setCount = 0;
  let totalReps = 0;
  let totalVolume = 0;
  let bestWeight: number | null = null;

  for (const setItem of exercise.sets) {
    const reps = Number.parseInt(setItem.reps.trim(), 10);

    if (!Number.isInteger(reps) || reps <= 0) {
      continue;
    }

    setCount += 1;
    totalReps += reps;

    const weight = toOptionalPositiveNumber(setItem.weightLb);

    if (weight === null) {
      continue;
    }

    totalVolume += weight * reps;
    bestWeight = bestWeight === null ? weight : Math.max(bestWeight, weight);
  }

  return {
    setCount,
    totalReps,
    totalVolume: Math.round(totalVolume),
    bestWeight,
  };
}

function formatExerciseInsightDate(value: string) {
  if (!value.trim()) {
    return "";
  }

  return formatDatabaseDateLabel(toDatabaseDateFromInput(value), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDelta(value: number, suffix: string) {
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded} ${suffix}`;
}

export function WorkoutLogger({
  mode = "create",
  workoutId,
  initialData,
  weightUnit,
}: WorkoutLoggerProps) {
  const isEditMode = mode === "edit" && Boolean(workoutId);
  const initialState = useMemo(
    () => createInitialLoggerState(initialData),
    [initialData],
  );
  const router = useRouter();
  const weightUnitLabel = getWeightUnitLabel(weightUnit);
  const weightUnitName = weightUnit === "KG" ? "kilograms" : "pounds";
  const idCounterRef = useRef(initialState.counters);
  const insightCacheRef = useRef<Record<string, ExerciseInsight>>({});
  const latestInsightLookupRef = useRef<Record<string, string>>({});
  const autosaveReadyRef = useRef(false);
  const latestDraftSnapshotRef = useRef<WorkoutDraftSnapshot | null>(null);
  const suggestionCacheRef = useRef<Record<string, string[]>>({});
  const latestSuggestionLookupRef = useRef<Record<string, string>>({});
  const suggestionDebounceTimeoutRef = useRef<Record<string, number>>({});
  const exerciseDragRef = useRef<{
    activeIndex: number;
    targetIndex: number;
    pointerId: number;
  } | null>(null);

  const [title, setTitle] = useState(initialState.title);
  const [workoutType, setWorkoutType] = useState(initialState.workoutType);
  const [performedAt, setPerformedAt] = useState(initialState.performedAt);
  const [exercises, setExercises] = useState<ExerciseDraft[]>(
    initialState.exercises,
  );
  const [exerciseInsightById, setExerciseInsightById] = useState<
    Record<string, ExerciseInsightState>
  >({});
  const [exerciseSuggestionById, setExerciseSuggestionById] = useState<
    Record<string, string>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draggingExerciseIndex, setDraggingExerciseIndex] = useState<number | null>(null);
  const [dropTargetExerciseIndex, setDropTargetExerciseIndex] = useState<number | null>(null);
  const performedAtDate = useMemo(
    () => toDatabaseDateFromInput(performedAt),
    [performedAt],
  );

  useEffect(() => {
    setTitle(initialState.title);
    setWorkoutType(initialState.workoutType);
    setPerformedAt(initialState.performedAt);
    setExercises(initialState.exercises);
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
      setTitle(storedDraft.title);
      setWorkoutType(storedDraft.workoutType);
      setPerformedAt(storedDraft.performedAt);
      setExercises(hydrated.exercises);
      idCounterRef.current = hydrated.counters;
    } else {
      if (rawDraft) {
        window.localStorage.removeItem(WORKOUT_DRAFT_STORAGE_KEY);
      }
    }

    autosaveReadyRef.current = true;
  }, [initialData, isEditMode, weightUnit]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    latestDraftSnapshotRef.current = createWorkoutDraftSnapshot(
      title,
      workoutType,
      performedAt,
      exercises,
    );
  }, [isEditMode, title, workoutType, performedAt, exercises]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    if (!autosaveReadyRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const snapshot = createWorkoutDraftSnapshot(
        title,
        workoutType,
        performedAt,
        exercises,
      );
      latestDraftSnapshotRef.current = snapshot;
      persistWorkoutDraft(snapshot, weightUnit);
    }, WORKOUT_AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isEditMode, title, workoutType, performedAt, exercises, weightUnit]);

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

  useEffect(() => {
    const pendingSuggestionTimeouts = suggestionDebounceTimeoutRef.current;

    return () => {
      for (const timeoutId of Object.values(pendingSuggestionTimeouts)) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

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
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === id ? updater(exercise) : exercise,
      ),
    );
  }

  function addExercise() {
    setExercises((current) => [
      ...current,
      createExerciseDraft(nextExerciseId(), nextSetId()),
    ]);
  }

  function removeExercise(id: string) {
    setExercises((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((exercise) => exercise.id !== id);
    });

    setExerciseInsightById((current) => {
      if (!(id in current)) {
        return current;
      }

      const next = { ...current };
      delete next[id];
      return next;
    });

    setExerciseSuggestionById((current) => {
      if (!(id in current)) {
        return current;
      }

      const next = { ...current };
      delete next[id];
      return next;
    });

    const pendingSuggestionTimeout = suggestionDebounceTimeoutRef.current[id];
    if (pendingSuggestionTimeout !== undefined) {
      window.clearTimeout(pendingSuggestionTimeout);
      delete suggestionDebounceTimeoutRef.current[id];
    }

    delete latestInsightLookupRef.current[id];
    delete latestSuggestionLookupRef.current[id];
  }

  function findExerciseIndexFromPoint(clientX: number, clientY: number) {
    for (const element of document.elementsFromPoint(clientX, clientY)) {
      if (!(element instanceof HTMLElement)) {
        continue;
      }

      const card = element.closest<HTMLElement>("[data-exercise-card]");

      if (!card) {
        continue;
      }

      const exerciseIndex = Number.parseInt(
        card.dataset.exerciseIndex ?? "",
        10,
      );

      if (Number.isInteger(exerciseIndex)) {
        return exerciseIndex;
      }
    }

    return null;
  }

  function clearExerciseDragState() {
    exerciseDragRef.current = null;
    setDraggingExerciseIndex(null);
    setDropTargetExerciseIndex(null);
  }

  function commitExerciseReorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      clearExerciseDragState();
      return;
    }

    setExercises((current) => reorderItems(current, fromIndex, toIndex));
    clearExerciseDragState();
  }

  function handleExercisePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    exerciseIndex: number,
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    exerciseDragRef.current = {
      activeIndex: exerciseIndex,
      targetIndex: exerciseIndex,
      pointerId: event.pointerId,
    };
    setDraggingExerciseIndex(exerciseIndex);
    setDropTargetExerciseIndex(exerciseIndex);
  }

  function handleExercisePointerMove(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const activeDrag = exerciseDragRef.current;

    if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
      return;
    }

    const hoveredIndex = findExerciseIndexFromPoint(event.clientX, event.clientY);

    if (hoveredIndex === null || hoveredIndex === activeDrag.targetIndex) {
      return;
    }

    exerciseDragRef.current = {
      ...activeDrag,
      targetIndex: hoveredIndex,
    };
    setDropTargetExerciseIndex(hoveredIndex);
  }

  function handleExercisePointerUp(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const activeDrag = exerciseDragRef.current;

    if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    commitExerciseReorder(activeDrag.activeIndex, activeDrag.targetIndex);
  }

  function handleExercisePointerCancel(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const activeDrag = exerciseDragRef.current;

    if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    clearExerciseDragState();
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

  function setExerciseSuggestion(exerciseId: string, suggestion: string | null) {
    setExerciseSuggestionById((current) => {
      if (!suggestion) {
        if (!(exerciseId in current)) {
          return current;
        }

        const next = { ...current };
        delete next[exerciseId];
        return next;
      }

      if (current[exerciseId] === suggestion) {
        return current;
      }

      return {
        ...current,
        [exerciseId]: suggestion,
      };
    });
  }

  function resetExerciseInsightState(exerciseId: string) {
    setExerciseInsightById((current) => {
      const previous = current[exerciseId];

      if (!previous || previous.status === "idle") {
        return current;
      }

      return {
        ...current,
        [exerciseId]: { status: "idle" },
      };
    });
  }

  function clearPendingSuggestionLookup(exerciseId: string) {
    const pendingTimeout = suggestionDebounceTimeoutRef.current[exerciseId];

    if (pendingTimeout !== undefined) {
      window.clearTimeout(pendingTimeout);
      delete suggestionDebounceTimeoutRef.current[exerciseId];
    }
  }

  async function fetchExerciseSuggestions(exerciseId: string, query: string) {
    const lookupKey = normalizeExerciseLookupKey(query);

    if (!lookupKey) {
      setExerciseSuggestion(exerciseId, null);
      delete latestSuggestionLookupRef.current[exerciseId];
      return;
    }

    const cachedSuggestions = suggestionCacheRef.current[lookupKey];

    if (cachedSuggestions) {
      const bestSuggestion = pickBestExerciseSuggestion(query, cachedSuggestions);
      setExerciseSuggestion(exerciseId, bestSuggestion);
      return;
    }

    latestSuggestionLookupRef.current[exerciseId] = lookupKey;

    try {
      const response = await fetch(
        `/api/workouts/exercise-suggestions?query=${encodeURIComponent(query)}`,
        {
          cache: "no-store",
        },
      );
      const payload = (await response.json()) as ExerciseSuggestionsPayload;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load suggestions.");
      }

      const suggestions = Array.isArray(payload.suggestions)
        ? payload.suggestions
            .map((item) => toSafeString(item).trim())
            .filter((item) => item !== "")
        : [];
      suggestionCacheRef.current[lookupKey] = suggestions;

      if (latestSuggestionLookupRef.current[exerciseId] !== lookupKey) {
        return;
      }

      const bestSuggestion = pickBestExerciseSuggestion(query, suggestions);
      setExerciseSuggestion(exerciseId, bestSuggestion);
    } catch {
      if (latestSuggestionLookupRef.current[exerciseId] !== lookupKey) {
        return;
      }

      setExerciseSuggestion(exerciseId, null);
    }
  }

  function queueExerciseSuggestionLookup(exerciseId: string, rawValue: string) {
    clearPendingSuggestionLookup(exerciseId);

    if (!rawValue.trim()) {
      setExerciseSuggestion(exerciseId, null);
      delete latestSuggestionLookupRef.current[exerciseId];
      return;
    }

    suggestionDebounceTimeoutRef.current[exerciseId] = window.setTimeout(() => {
      delete suggestionDebounceTimeoutRef.current[exerciseId];
      void fetchExerciseSuggestions(exerciseId, rawValue);
    }, EXERCISE_SUGGESTION_DEBOUNCE_MS);
  }

  function handleExerciseNameChange(exerciseId: string, rawValue: string) {
    updateExercise(exerciseId, (current) => ({
      ...current,
      name: rawValue,
    }));

    resetExerciseInsightState(exerciseId);
    queueExerciseSuggestionLookup(exerciseId, rawValue);
  }

  function acceptExerciseSuggestion(exerciseId: string, suggestion: string) {
    const normalizedSuggestion = normalizeExerciseDisplayName(suggestion);
    setExerciseSuggestion(exerciseId, null);
    delete latestSuggestionLookupRef.current[exerciseId];

    updateExercise(exerciseId, (current) => ({
      ...current,
      name: normalizedSuggestion,
    }));

    void fetchExerciseInsight(exerciseId, normalizedSuggestion);
  }

  async function fetchExerciseInsight(exerciseId: string, exerciseName: string) {
    const lookupKey = normalizeExerciseLookupKey(exerciseName);

    if (!lookupKey) {
      setExerciseInsightById((current) => ({
        ...current,
        [exerciseId]: { status: "idle" },
      }));
      delete latestInsightLookupRef.current[exerciseId];
      return;
    }

    const cached = insightCacheRef.current[lookupKey];

    if (cached) {
      setExerciseInsightById((current) => ({
        ...current,
        [exerciseId]: {
          status: "ready",
          lookupKey,
          data: cached,
        },
      }));
      return;
    }

    latestInsightLookupRef.current[exerciseId] = lookupKey;

    setExerciseInsightById((current) => ({
      ...current,
      [exerciseId]: {
        status: "loading",
        lookupKey,
      },
    }));

    try {
      const response = await fetch(
        `/api/workouts/insights?exercise=${encodeURIComponent(exerciseName)}`,
        {
          cache: "no-store",
        },
      );
      const payload = (await response.json()) as
        | ExerciseInsight
        | { error?: string };

      if (!response.ok || !("normalizedName" in payload)) {
        throw new Error(
          "error" in payload ? (payload.error ?? "Unable to compare exercise.") : "Unable to compare exercise.",
        );
      }

      const responseLookupKey = normalizeExerciseLookupKey(payload.normalizedName);
      insightCacheRef.current[responseLookupKey] = payload;

      if (latestInsightLookupRef.current[exerciseId] !== lookupKey) {
        return;
      }

      setExerciseInsightById((current) => ({
        ...current,
        [exerciseId]: {
          status: "ready",
          lookupKey,
          data: payload,
        },
      }));
    } catch (error) {
      if (latestInsightLookupRef.current[exerciseId] !== lookupKey) {
        return;
      }

      setExerciseInsightById((current) => ({
        ...current,
        [exerciseId]: {
          status: "error",
          lookupKey,
          error:
            error instanceof Error
              ? error.message
              : "Unable to compare exercise.",
        },
      }));
    }
  }

  async function handleExerciseNameBlur(exerciseId: string, rawValue: string) {
    clearPendingSuggestionLookup(exerciseId);
    setExerciseSuggestion(exerciseId, null);
    delete latestSuggestionLookupRef.current[exerciseId];

    const normalized = normalizeExerciseDisplayName(rawValue);

    updateExercise(exerciseId, (current) => ({
      ...current,
      name: normalized,
    }));

    await fetchExerciseInsight(exerciseId, normalized);
  }

  function buildPayload() {
    const normalizedExercises = exercises
      .map((exercise) => {
        const name = normalizeExerciseDisplayName(toSafeString(exercise.name));
        const parsedSets = exercise.sets
          .filter((setItem) => toSafeString(setItem.reps).trim() !== "")
          .map((setItem) => {
            const reps = Number.parseInt(toSafeString(setItem.reps).trim(), 10);
            const rawWeight = toSafeString(setItem.weightLb).trim();
            const weightLb = rawWeight
              ? rawWeight.startsWith(".")
                ? `0${rawWeight}`
                : rawWeight
              : null;

            return {
              reps,
              weightLb,
            };
          })
          .filter(
            (setItem) => Number.isInteger(setItem.reps) && setItem.reps > 0,
          );

        return {
          name,
          sets: parsedSets,
        };
      })
      .filter((exercise) => exercise.name !== "");

    if (normalizedExercises.length === 0) {
      return { error: "Add at least one exercise with a name." as const };
    }

    for (const exercise of normalizedExercises) {
      if (exercise.sets.length === 0) {
        return {
          error:
            `Add at least one set with reps for ${exercise.name}.` as const,
        };
      }
    }

    return {
      value: {
        title,
        workoutType,
        performedAt,
        weightUnit,
        exercises: normalizedExercises,
      },
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setFormError(null);

    const payload = buildPayload();

    if ("error" in payload) {
      setFormError(payload.error ?? "Unable to validate workout.");
      return;
    }

    setIsSaving(true);

    try {
      const requestBody = isEditMode
        ? {
            ...payload.value,
            workoutId,
          }
        : payload.value;
      const response = await fetch("/api/workouts", {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as WorkoutSubmitResponse;

      if (!response.ok) {
        setFormError(
          data.error ??
            (isEditMode
              ? "Unable to update workout."
              : "Unable to save workout."),
        );
        return;
      }

      if (!isEditMode) {
        window.localStorage.removeItem(WORKOUT_DRAFT_STORAGE_KEY);
      }

      const resolvedWorkoutId = data.id ?? workoutId;

      if (isEditMode && resolvedWorkoutId) {
        router.push(`/workouts/${resolvedWorkoutId}`);
      } else {
        router.push("/workouts");
      }
      router.refresh();
    } catch {
      setFormError(
        isEditMode ? "Unable to update workout." : "Unable to save workout.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const backHref = isEditMode ? `/workouts/${workoutId}` : "/dashboard?view=workouts";
  const backLabel = isEditMode ? "Back to workout" : "Back to workouts";
  const pageTitle = isEditMode ? "Edit workout" : "Log workout";
  const savingLabel = isEditMode ? "Saving changes..." : "Saving workout...";
  const submitLabel = isEditMode ? "Save changes" : "Save workout";

  return (
    <main className={styles.loggerShell}>
      <section className={styles.loggerStage} aria-label="Workout logger">
        <div className={styles.topRow}>
          <Link href={backHref} className={styles.backLink}>
            {backLabel}
          </Link>
          <ThemeToggle />
        </div>

        <header className={styles.header}>
          <h1 className={styles.title}>{pageTitle}</h1>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.card}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="workout-title">
                Workout title
              </label>
              <input
                id="workout-title"
                className={styles.input}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Push day"
              />
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="workout-type">
                  Workout type
                </label>
                <input
                  id="workout-type"
                  className={styles.input}
                  value={workoutType}
                  onChange={(event) => setWorkoutType(event.target.value)}
                  placeholder="Push"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="workout-performed-at">
                  Date
                </label>
                <DatePicker
                  id="workout-performed-at"
                  selected={performedAtDate}
                  onChange={(value: Date | null) => {
                    if (value) {
                      setPerformedAt(formatDatabaseDateValue(value));
                    }
                  }}
                  dateFormat="MM/dd/yyyy"
                  calendarClassName={styles.datePickerCalendar}
                  wrapperClassName={styles.datePickerWrapper}
                  popperClassName={styles.datePickerPopper}
                  className={`${styles.input} ${styles.dateInput}`}
                  showPopperArrow={false}
                />
              </div>
            </div>
          </section>

          <section className={styles.exerciseSection}>
            {exercises.map((exercise, exerciseIndex) => (
              <article
                key={exercise.id}
                className={`${styles.exerciseCard} ${
                  draggingExerciseIndex === exerciseIndex
                    ? styles.exerciseCardDragging
                    : ""
                } ${
                  dropTargetExerciseIndex === exerciseIndex &&
                  draggingExerciseIndex !== exerciseIndex
                    ? styles.exerciseCardDropTarget
                    : ""
                }`}
                data-exercise-card="true"
                data-exercise-index={exerciseIndex}
              >
                <div className={styles.exerciseHead}>
                  <div className={styles.exerciseHeading}>
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.dragHandle}`}
                      onPointerDown={(event) =>
                        handleExercisePointerDown(event, exerciseIndex)
                      }
                      onPointerMove={handleExercisePointerMove}
                      onPointerUp={handleExercisePointerUp}
                      onPointerCancel={handleExercisePointerCancel}
                      aria-label={`Drag to reorder exercise ${exerciseIndex + 1}`}
                      title="Drag to reorder"
                    >
                      <GripVertical
                        className={styles.icon}
                        aria-hidden="true"
                        strokeWidth={1.9}
                      />
                    </button>
                    <div>
                      <h2 className={styles.exerciseTitle}>
                        Exercise {exerciseIndex + 1}
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => removeExercise(exercise.id)}
                    disabled={exercises.length === 1}
                    aria-label={`Remove exercise ${exerciseIndex + 1}`}
                  >
                    <Trash2
                      className={styles.icon}
                      aria-hidden="true"
                      strokeWidth={1.9}
                    />
                  </button>
                </div>

                <div className={styles.field}>
                  <div className={styles.inlineRow}>
                    {(() => {
                      const suggestedName = exerciseSuggestionById[exercise.id];
                      const currentLookupKey = normalizeExerciseLookupKey(
                        exercise.name,
                      );
                      const suggestionLookupKey = normalizeExerciseLookupKey(
                        suggestedName ?? "",
                      );
                      const suggestionForAction =
                        suggestedName &&
                        currentLookupKey &&
                        currentLookupKey !== suggestionLookupKey
                          ? suggestedName
                          : null;

                      return (
                        <>
                          <input
                            id={`exercise-name-${exercise.id}`}
                            className={styles.input}
                            value={exercise.name}
                            aria-label={`Exercise name for exercise ${exerciseIndex + 1}`}
                            onChange={(event) =>
                              handleExerciseNameChange(exercise.id, event.target.value)
                            }
                            onBlur={(event) =>
                              void handleExerciseNameBlur(exercise.id, event.target.value)
                            }
                            autoComplete="off"
                            spellCheck={true}
                            autoCapitalize="words"
                            autoCorrect="on"
                            placeholder="Barbell bench press"
                          />
                          {suggestionForAction ? (
                            <p className={styles.didYouMean}>
                              Did you mean?{" "}
                              <button
                                type="button"
                                className={styles.didYouMeanSuggestion}
                                onPointerDown={(event) => {
                                  // Keep input focus so blur handlers do not clear the suggestion first.
                                  event.preventDefault();
                                }}
                                onClick={() => {
                                  clearPendingSuggestionLookup(exercise.id);
                                  acceptExerciseSuggestion(
                                    exercise.id,
                                    suggestionForAction,
                                  );
                                }}
                              >
                                {suggestionForAction}
                              </button>
                            </p>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {(() => {
                  const insightState = exerciseInsightById[exercise.id];

                  if (!insightState || insightState.status === "idle") {
                    return null;
                  }

                  if (insightState.status === "loading") {
                    return (
                      <p className={styles.compareHint}>
                        Comparing with previous sessions...
                      </p>
                    );
                  }

                  if (insightState.status === "error") {
                    return (
                      <p className={styles.compareHint}>
                        Could not load comparison right now.
                      </p>
                    );
                  }

                  const insight = insightState.data;

                  if (!insight || !insight.lastSession) {
                    return (
                      <p className={styles.compareHint}>
                        No previous logs for this exercise yet.
                      </p>
                    );
                  }

                  const draftSummary = summarizeDraftSets(exercise);
                  const lastVolume =
                    convertStoredWeightToDisplay(
                      insight.lastSession.totalVolume,
                      weightUnit,
                    ) ?? 0;
                  const lastBestWeight =
                    insight.lastSession.bestWeight === null
                      ? null
                      : (convertStoredWeightToDisplay(
                          insight.lastSession.bestWeight,
                          weightUnit,
                        ) ?? 0);
                  const allTimeBestWeight =
                    insight.allTimeBestWeight === null
                      ? null
                      : (convertStoredWeightToDisplay(
                          insight.allTimeBestWeight,
                          weightUnit,
                        ) ?? 0);
                  const volumeDelta = draftSummary.totalVolume - lastVolume;
                  const draftBestWeight = draftSummary.bestWeight ?? 0;
                  const bestWeightDelta =
                    draftBestWeight - (lastBestWeight ?? 0);

                  return (
                    <section className={styles.compareCard}>
                      <div className={styles.compareHead}>
                        <p className={styles.compareMeta}>
                          Last hit {formatExerciseInsightDate(insight.lastSession.performedAt)}
                        </p>
                      </div>

                      <div className={styles.compareGrid}>
                        <div className={styles.compareItem}>
                          <p className={styles.compareLabel}>Last session</p>
                          <p className={styles.compareValue}>
                            {insight.lastSession.setCount} sets · {insight.lastSession.totalReps} reps
                          </p>
                        </div>
                        <div className={styles.compareItem}>
                          <p className={styles.compareLabel}>Last volume</p>
                          <p className={styles.compareValue}>
                            {formatWeightWithUnit(lastVolume, weightUnit)}
                          </p>
                        </div>
                        <div className={styles.compareItem}>
                          <p className={styles.compareLabel}>Last best weight</p>
                          <p className={styles.compareValue}>
                            {lastBestWeight !== null
                              ? insight.lastSession.bestWeightReps !== null
                                ? `${formatWeightWithUnit(lastBestWeight, weightUnit)} x ${insight.lastSession.bestWeightReps}`
                                : formatWeightWithUnit(lastBestWeight, weightUnit)
                              : "--"}
                          </p>
                        </div>
                        <div className={styles.compareItem}>
                          <p className={styles.compareLabel}>All-time best</p>
                          <p className={styles.compareValue}>
                            {allTimeBestWeight !== null
                              ? formatWeightWithUnit(allTimeBestWeight, weightUnit)
                              : "--"}
                          </p>
                        </div>
                      </div>

                      {draftSummary.setCount > 0 ? (
                        <p className={styles.compareDelta}>
                          Volume vs last: {formatDelta(volumeDelta, weightUnitLabel)} ·
                          Best vs last: {formatDelta(bestWeightDelta, weightUnitLabel)}
                        </p>
                      ) : null}
                    </section>
                  );
                })()}

                <div className={styles.setsStack}>
                  <div
                    className={`${styles.setRow} ${styles.setRowHeader}`}
                    aria-hidden="true"
                  >
                    <span className={styles.setHeadLabel}>Set</span>
                    <span className={styles.setHeadLabel}>
                      Weight ({weightUnitLabel})
                    </span>
                    <span className={styles.setHeadLabel}>Reps</span>
                    <span className={styles.setHeadLabel}>Action</span>
                  </div>

                  {exercise.sets.map((setItem, setIndex) => (
                    <div key={setItem.id} className={styles.setRow}>
                      <p className={styles.setNumber}>#{setIndex + 1}</p>
                      <label
                        className={`${styles.setField} ${styles.setFieldWeight}`}
                      >
                        <span className={styles.setFieldLabel}>
                          Weight ({weightUnitLabel})
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*[.]?[0-9]*"
                          autoComplete="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          enterKeyHint="next"
                          className={styles.input}
                          placeholder={weightUnitLabel}
                          value={setItem.weightLb}
                          aria-label={`Weight in ${weightUnitName} for set ${setIndex + 1}`}
                          onChange={(event) =>
                            updateSet(
                              exercise.id,
                              setItem.id,
                              "weightLb",
                              sanitizeWeightInput(event.target.value),
                            )
                          }
                        />
                      </label>
                      <label
                        className={`${styles.setField} ${styles.setFieldReps}`}
                      >
                        <span className={styles.setFieldLabel}>Reps</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          enterKeyHint="done"
                          className={styles.input}
                          placeholder="Reps"
                          value={setItem.reps}
                          aria-label={`Repetitions for set ${setIndex + 1}`}
                          onChange={(event) =>
                            updateSet(
                              exercise.id,
                              setItem.id,
                              "reps",
                              sanitizeRepsInput(event.target.value),
                            )
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className={`${styles.iconButton} ${styles.setRemoveButton}`}
                        onClick={() => removeSet(exercise.id, setItem.id)}
                        disabled={exercise.sets.length === 1}
                        aria-label={`Remove set ${setIndex + 1}`}
                      >
                        <Trash2
                          className={styles.icon}
                          aria-hidden="true"
                          strokeWidth={1.9}
                        />
                      </button>
                    </div>
                  ))}

                  <div className={styles.setActions}>
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => addSet(exercise.id)}
                    >
                      <Plus
                        className={styles.actionIcon}
                        aria-hidden="true"
                        strokeWidth={1.9}
                      />
                      Add set
                    </button>
                  </div>
                </div>
              </article>
            ))}

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={addExercise}
            >
              <Plus
                className={styles.actionIcon}
                aria-hidden="true"
                strokeWidth={1.9}
              />
              Add another exercise
            </button>
          </section>

          {formError ? <p className={styles.formError}>{formError}</p> : null}

          <button
            type="submit"
            className={styles.saveButton}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2
                  className={styles.spinningIcon}
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
                {savingLabel}
              </>
            ) : (
              <>
                <Save
                  className={styles.actionIcon}
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
                {submitLabel}
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
