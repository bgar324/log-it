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
    sets: Array<{
      reps: number;
      weightLb: number | null;
    }>;
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

function formatLoggedSetSnapshot(
  set: { reps: number; weightLb: number | null },
  weightUnit: WeightUnit,
) {
  if (set.weightLb === null) {
    return `${set.reps} reps`;
  }

  const displayWeight = convertStoredWeightToDisplay(set.weightLb, weightUnit) ?? 0;
  return `${formatWeightWithUnit(displayWeight, weightUnit)} × ${set.reps}`;
}

function isWorkoutSnapshotEqual(
  left: WorkoutDraftSnapshot,
  right: WorkoutDraftSnapshot,
) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function WorkoutLogger({
  mode = "create",
  workoutId,
  initialData,
  weightUnit,
}: WorkoutLoggerProps) {
  const router = useRouter();
  const initialState = useMemo(() => createInitialLoggerState(initialData), [initialData]);
  const [title, setTitle] = useState(initialState.title);
  const [workoutType, setWorkoutType] = useState(initialState.workoutType);
  const [performedAt, setPerformedAt] = useState(initialState.performedAt);
  const [exercises, setExercises] = useState(initialState.exercises);
  const [exerciseCounter, setExerciseCounter] = useState(initialState.counters.exercise);
  const [setCounter, setSetCounter] = useState(initialState.counters.set);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isHydrated, setIsHydrated] = useState(false);
  const [suggestionsByExerciseId, setSuggestionsByExerciseId] = useState<Record<string, string[]>>({});
  const [activeSuggestionExerciseId, setActiveSuggestionExerciseId] = useState<string | null>(null);
  const [insightsByExerciseId, setInsightsByExerciseId] = useState<Record<string, ExerciseInsightState>>({});
  const [draggingExerciseId, setDraggingExerciseId] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const suggestionTimersRef = useRef<Record<string, number>>({});
  const suggestionsAbortControllersRef = useRef<Record<string, AbortController>>({});
  const insightsAbortControllersRef = useRef<Record<string, AbortController>>({});
  const submitIntentRef = useRef<"save" | "save-and-continue">("save");
  const dragStartIndexRef = useRef<number | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);

  const initialSnapshot = useMemo(
    () =>
      createWorkoutDraftSnapshot(
        initialState.title,
        initialState.workoutType,
        initialState.performedAt,
        initialState.exercises,
      ),
    [initialState],
  );

  const currentSnapshot = useMemo(
    () => createWorkoutDraftSnapshot(title, workoutType, performedAt, exercises),
    [title, workoutType, performedAt, exercises],
  );

  const hasUnsavedChanges = useMemo(
    () => !isWorkoutSnapshotEqual(initialSnapshot, currentSnapshot),
    [initialSnapshot, currentSnapshot],
  );

  const weightUnitLabel = getWeightUnitLabel(weightUnit);
  const weightUnitName = weightUnit === "LB" ? "pounds" : "kilograms";
  const isEditMode = mode === "edit";
  const pageTitle = isEditMode ? "Edit workout" : "Log workout";
  const pageDescription = isEditMode
    ? "Update the details below and save your changes."
    : "Track your workout quickly and keep your progress moving.";
  const submitLabel = isEditMode ? "Save changes" : "Save workout";
  const savingLabel = isEditMode ? "Saving changes..." : "Saving workout...";

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || isEditMode) {
      return;
    }

    const storedDraft = parseStoredWorkoutDraft(
      window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY),
      weightUnit,
    );

    if (!storedDraft) {
      return;
    }

    const hydrated = hydrateExercisesFromSnapshot(storedDraft.exercises);
    setTitle(storedDraft.title.trim() || "Gym session");
    setWorkoutType(storedDraft.workoutType.trim());
    setPerformedAt(normalizePerformedAtInput(storedDraft.performedAt));
    setExercises(hydrated.exercises);
    setExerciseCounter(hydrated.counters.exercise);
    setSetCounter(hydrated.counters.set);
  }, [isHydrated, isEditMode, weightUnit]);

  useEffect(() => {
    if (!isHydrated || isEditMode) {
      return;
    }

    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      const didPersist = persistWorkoutDraft(currentSnapshot, weightUnit);
      setDraftStatus(didPersist ? "saved" : "error");
    }, WORKOUT_AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [currentSnapshot, isHydrated, isEditMode, weightUnit]);

  useEffect(() => {
    return () => {
      Object.values(suggestionTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      Object.values(suggestionsAbortControllersRef.current).forEach((controller) => {
        controller.abort();
      });
      Object.values(insightsAbortControllersRef.current).forEach((controller) => {
        controller.abort();
      });
    };
  }, []);

  useEffect(() => {
    const lookupEntries = exercises.map((exercise) => {
      const normalizedName = normalizeExerciseLookupKey(exercise.name);
      return {
        exerciseId: exercise.id,
        normalizedName,
      };
    });

    setInsightsByExerciseId((previous) => {
      const next: Record<string, ExerciseInsightState> = {};

      for (const { exerciseId, normalizedName } of lookupEntries) {
        const existing = previous[exerciseId];

        if (!normalizedName) {
          if (existing?.status === "ready" || existing?.status === "loading") {
            const controller = insightsAbortControllersRef.current[exerciseId];
            if (controller) {
              controller.abort();
              delete insightsAbortControllersRef.current[exerciseId];
            }
          }
          next[exerciseId] = { status: "idle" };
          continue;
        }

        if (
          existing &&
          existing.lookupKey === normalizedName &&
          (existing.status === "loading" || existing.status === "ready")
        ) {
          next[exerciseId] = existing;
          continue;
        }

        next[exerciseId] = {
          status: "loading",
          lookupKey: normalizedName,
        };

        const existingController = insightsAbortControllersRef.current[exerciseId];
        if (existingController) {
          existingController.abort();
        }

        const controller = new AbortController();
        insightsAbortControllersRef.current[exerciseId] = controller;

        fetch(`/api/exercises/insights?name=${encodeURIComponent(normalizedName)}`, {
          signal: controller.signal,
        })
          .then(async (response) => {
            const payload = (await response.json()) as ExerciseInsight | { error?: string };

            if (!response.ok) {
              throw new Error(
                "error" in payload && typeof payload.error === "string"
                  ? payload.error
                  : "Could not load comparison.",
              );
            }

            setInsightsByExerciseId((current) => {
              const latest = current[exerciseId];

              if (!latest || latest.lookupKey !== normalizedName) {
                return current;
              }

              return {
                ...current,
                [exerciseId]: {
                  status: "ready",
                  lookupKey: normalizedName,
                  data: payload as ExerciseInsight,
                },
              };
            });
          })
          .catch((error: unknown) => {
            if (controller.signal.aborted) {
              return;
            }

            const message =
              error instanceof Error ? error.message : "Could not load comparison.";

            setInsightsByExerciseId((current) => {
              const latest = current[exerciseId];

              if (!latest || latest.lookupKey !== normalizedName) {
                return current;
              }

              return {
                ...current,
                [exerciseId]: {
                  status: "error",
                  lookupKey: normalizedName,
                  error: message,
                },
              };
            });
          })
          .finally(() => {
            if (insightsAbortControllersRef.current[exerciseId] === controller) {
              delete insightsAbortControllersRef.current[exerciseId];
            }
          });
      }

      for (const exerciseId of Object.keys(previous)) {
        if (lookupEntries.some((entry) => entry.exerciseId === exerciseId)) {
          continue;
        }

        const controller = insightsAbortControllersRef.current[exerciseId];
        if (controller) {
          controller.abort();
          delete insightsAbortControllersRef.current[exerciseId];
        }
      }

      return next;
    });
  }, [exercises]);

  const clearSuggestionsForExercise = (exerciseId: string) => {
    const timerId = suggestionTimersRef.current[exerciseId];
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      delete suggestionTimersRef.current[exerciseId];
    }

    const controller = suggestionsAbortControllersRef.current[exerciseId];
    if (controller) {
      controller.abort();
      delete suggestionsAbortControllersRef.current[exerciseId];
    }

    setSuggestionsByExerciseId((current) => {
      if (!(exerciseId in current)) {
        return current;
      }

      const next = { ...current };
      delete next[exerciseId];
      return next;
    });

    setActiveSuggestionExerciseId((current) =>
      current === exerciseId ? null : current,
    );
  };

  const loadSuggestionsForExercise = (exerciseId: string, query: string) => {
    clearSuggestionsForExercise(exerciseId);

    const normalizedQuery = normalizeExerciseLookupKey(query);

    if (!normalizedQuery) {
      return;
    }

    suggestionTimersRef.current[exerciseId] = window.setTimeout(async () => {
      const controller = new AbortController();
      suggestionsAbortControllersRef.current[exerciseId] = controller;

      try {
        const response = await fetch(
          `/api/exercises/suggestions?query=${encodeURIComponent(normalizedQuery)}`,
          {
            signal: controller.signal,
          },
        );

        const payload = (await response.json()) as ExerciseSuggestionsPayload;

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load exercise suggestions.");
        }

        const suggestions = Array.isArray(payload.suggestions)
          ? payload.suggestions.filter((value): value is string => typeof value === "string")
          : [];

        setSuggestionsByExerciseId((current) => ({
          ...current,
          [exerciseId]: suggestions,
        }));
        setActiveSuggestionExerciseId(exerciseId);
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setSuggestionsByExerciseId((current) => ({
          ...current,
          [exerciseId]: [],
        }));
      } finally {
        if (suggestionsAbortControllersRef.current[exerciseId] === controller) {
          delete suggestionsAbortControllersRef.current[exerciseId];
        }
      }
    }, EXERCISE_SUGGESTION_DEBOUNCE_MS);
  };

  const updateExerciseName = (exerciseId: string, value: string) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              name: value,
            }
          : exercise,
      ),
    );

    loadSuggestionsForExercise(exerciseId, value);
  };

  const selectSuggestion = (exerciseId: string, suggestion: string) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              name: normalizeExerciseDisplayName(suggestion),
            }
          : exercise,
      ),
    );
    clearSuggestionsForExercise(exerciseId);
  };

  const addExercise = () => {
    setExerciseCounter((currentCounter) => {
      const nextCounter = currentCounter + 1;
      setSetCounter((currentSetCounter) => {
        const nextSetCounter = currentSetCounter + 1;
        setExercises((currentExercises) => [
          ...currentExercises,
          createExerciseDraft(`exercise-${nextCounter}`, `set-${nextSetCounter}`),
        ]);
        return nextSetCounter;
      });
      return nextCounter;
    });
  };

  const removeExercise = (exerciseId: string) => {
    setExercises((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((exercise) => exercise.id !== exerciseId);
    });
    clearSuggestionsForExercise(exerciseId);
  };

  const addSet = (exerciseId: string) => {
    setSetCounter((currentCounter) => {
      const nextCounter = currentCounter + 1;

      setExercises((currentExercises) =>
        currentExercises.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: [...exercise.sets, createSetDraft(`set-${nextCounter}`)],
              }
            : exercise,
        ),
      );

      return nextCounter;
    });
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId || exercise.sets.length === 1) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.filter((setItem) => setItem.id !== setId),
        };
      }),
    );
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: keyof Pick<ExerciseSetDraft, "reps" | "weightLb">,
    value: string,
  ) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((setItem) =>
                setItem.id === setId
                  ? {
                      ...setItem,
                      [field]: value,
                    }
                  : setItem,
              ),
            }
          : exercise,
      ),
    );
  };

  const onDragStart = (
    event: ReactPointerEvent<HTMLButtonElement>,
    exerciseId: string,
  ) => {
    const target = event.currentTarget;
    const pointerId = event.pointerId;
    dragPointerIdRef.current = pointerId;
    setDraggingExerciseId(exerciseId);
    dragStartIndexRef.current = exercises.findIndex((exercise) => exercise.id === exerciseId);
    target.setPointerCapture(pointerId);
  };

  const onDragMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
    hoveredExerciseId: string,
  ) => {
    if (!draggingExerciseId || dragPointerIdRef.current !== event.pointerId) {
      return;
    }

    if (draggingExerciseId === hoveredExerciseId) {
      return;
    }

    setExercises((current) => {
      const fromIndex = current.findIndex((exercise) => exercise.id === draggingExerciseId);
      const toIndex = current.findIndex((exercise) => exercise.id === hoveredExerciseId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return current;
      }

      return reorderItems(current, fromIndex, toIndex);
    });
  };

  const onDragEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragPointerIdRef.current === event.pointerId) {
      dragPointerIdRef.current = null;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStartIndexRef.current = null;
    setDraggingExerciseId(null);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError(null);

    const trimmedTitle = title.trim() || "Gym session";
    const normalizedPerformedAt = normalizePerformedAtInput(performedAt);
    const payload = createWorkoutDraftSnapshot(
      trimmedTitle,
      workoutType.trim(),
      normalizedPerformedAt,
      exercises.map((exercise) => ({
        ...exercise,
        name: exercise.name.trim(),
      })),
    );

    const hasExerciseWithName = payload.exercises.some((exercise) => exercise.name.trim());

    if (!hasExerciseWithName) {
      setFormError("Add at least one exercise before saving.");
      return;
    }

    const hasLoggedSet = payload.exercises.some((exercise) =>
      exercise.sets.some((setItem) => {
        const reps = Number.parseInt(setItem.reps.trim(), 10);
        return Number.isInteger(reps) && reps > 0;
      }),
    );

    if (!hasLoggedSet) {
      setFormError("Log at least one set with reps before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        isEditMode && workoutId ? `/api/workouts/${workoutId}` : "/api/workouts",
        {
          method: isEditMode ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as WorkoutSubmitResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Could not save workout.");
      }

      if (!isEditMode) {
        window.localStorage.removeItem(WORKOUT_DRAFT_STORAGE_KEY);
      }

      if (submitIntentRef.current === "save-and-continue") {
        setTitle("Gym session");
        setWorkoutType("");
        setPerformedAt(formatDatabaseDateValue(getCurrentPacificDate()));
        setExercises([createExerciseDraft(INITIAL_EXERCISE_ID, INITIAL_SET_ID)]);
        setExerciseCounter(1);
        setSetCounter(1);
        setSuggestionsByExerciseId({});
        setActiveSuggestionExerciseId(null);
        setInsightsByExerciseId({});
        setDraftStatus("idle");
        router.refresh();
        return;
      }

      router.push("/workouts");
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not save workout.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.eyebrowRow}>
              <Link href="/workouts" className={styles.backLink}>
                Back to workouts
              </Link>
              <ThemeToggle />
            </div>
            <div>
              <p className={styles.eyebrow}>Workout logger</p>
              <h1 className={styles.title}>{pageTitle}</h1>
              <p className={styles.description}>{pageDescription}</p>
            </div>
          </div>
          <div className={styles.statusPillGroup}>
            {isEditMode ? null : (
              <span className={styles.statusPill}>
                {draftStatus === "saved"
                  ? "Draft autosaved"
                  : draftStatus === "error"
                    ? "Draft save failed"
                    : "Draft ready"}
              </span>
            )}
            <span className={styles.statusPill}>
              {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
            </span>
          </div>
        </header>

        <form className={styles.form} onSubmit={onSubmit}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.panelEyebrow}>Session details</p>
                <h2 className={styles.panelTitle}>Workout info</h2>
              </div>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Title</span>
                <input
                  type="text"
                  className={styles.input}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Push day"
                  autoComplete="off"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Workout type</span>
                <input
                  type="text"
                  className={styles.input}
                  value={workoutType}
                  onChange={(event) => setWorkoutType(event.target.value)}
                  placeholder="Upper body"
                  autoComplete="off"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Date performed</span>
                <DatePicker
                  selected={toDatabaseDateFromInput(performedAt)}
                  onChange={(date) => {
                    const value = date
                      ? formatDatabaseDateValue(date)
                      : formatDatabaseDateValue(getCurrentPacificDate());
                    setPerformedAt(value);
                  }}
                  dateFormat="MMM d, yyyy"
                  className={styles.input}
                />
              </label>
            </div>
          </section>

          <section className={styles.exerciseSection}>
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.panelEyebrow}>Exercises</p>
                <h2 className={styles.panelTitle}>Log your lifts</h2>
              </div>

              {!isEditMode ? (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    submitIntentRef.current = "save-and-continue";
                  }}
                  disabled={isSaving}
                >
                  Save and continue
                </button>
              ) : null}
            </div>

            {exercises.map((exercise, exerciseIndex) => (
              <article
                key={exercise.id}
                className={`${styles.exerciseCard} ${
                  draggingExerciseId === exercise.id ? styles.exerciseCardDragging : ""
                }`}
              >
                <div className={styles.exerciseHead}>
                  <div className={styles.exerciseHeadLeft}>
                    <button
                      type="button"
                      className={styles.dragHandle}
                      aria-label={`Reorder exercise ${exerciseIndex + 1}`}
                      onPointerDown={(event) => onDragStart(event, exercise.id)}
                      onPointerMove={(event) => onDragMove(event, exercise.id)}
                      onPointerUp={onDragEnd}
                      onPointerCancel={onDragEnd}
                    >
                      <GripVertical
                        className={styles.icon}
                        aria-hidden="true"
                        strokeWidth={1.9}
                      />
                    </button>
                    <div>
                      <p className={styles.exerciseIndex}>Exercise {exerciseIndex + 1}</p>
                      <p className={styles.exerciseSummary}>
                        {exercise.sets.length} set{exercise.sets.length === 1 ? "" : "s"}
                      </p>
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

                <div className={styles.exerciseBody}>
                  <label className={styles.field}>
                    <span className={styles.label}>Exercise name</span>
                    <input
                      type="text"
                      className={styles.input}
                      value={exercise.name}
                      onChange={(event) =>
                        updateExerciseName(exercise.id, event.target.value)
                      }
                      placeholder="Incline dumbbell press"
                      autoComplete="off"
                      onFocus={() => {
                        if ((suggestionsByExerciseId[exercise.id] ?? []).length > 0) {
                          setActiveSuggestionExerciseId(exercise.id);
                        }
                      }}
                      onBlur={() => {
                        window.setTimeout(() => {
                          setActiveSuggestionExerciseId((current) =>
                            current === exercise.id ? null : current,
                          );
                        }, 120);
                      }}
                    />

                    {activeSuggestionExerciseId === exercise.id &&
                    (suggestionsByExerciseId[exercise.id] ?? []).length > 0 ? (
                      <div className={styles.suggestions}>
                        {(suggestionsByExerciseId[exercise.id] ?? []).map((suggestion) => (
                          <button
                            key={`${exercise.id}-${suggestion}`}
                            type="button"
                            className={styles.suggestionButton}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              selectSuggestion(exercise.id, suggestion);
                            }}
                          >
                            {normalizeExerciseDisplayName(suggestion)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </label>

                  {(() => {
                    const insightState = insightsByExerciseId[exercise.id];

                    if (!insightState || insightState.status === "idle") {
                      return (
                        <p className={styles.compareHint}>
                          Start typing an exercise name to compare against your history.
                        </p>
                      );
                    }

                    if (insightState.status === "loading") {
                      return (
                        <p className={styles.compareHint}>Loading previous session...</p>
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

                    const lastSession = insight.lastSession;
                    const draftSummary = summarizeDraftSets(exercise);
                    const lastVolume =
                      convertStoredWeightToDisplay(
                        lastSession.totalVolume,
                        weightUnit,
                      ) ?? 0;
                    const allTimeBestWeight =
                      insight.allTimeBestWeight === null
                        ? null
                        : (convertStoredWeightToDisplay(
                            insight.allTimeBestWeight,
                            weightUnit,
                          ) ?? 0);
                    const volumeDelta = draftSummary.totalVolume - lastVolume;
                    const lastSessionBestWeightDisplay = lastSession.sets.reduce<number | null>(
                      (max, set) => {
                        if (set.weightLb === null) {
                          return max;
                        }

                        const displayWeight =
                          convertStoredWeightToDisplay(set.weightLb, weightUnit) ?? 0;

                        if (max === null) {
                          return displayWeight;
                        }

                        return Math.max(max, displayWeight);
                      },
                      null,
                    );
                    const draftBestWeight = draftSummary.bestWeight ?? 0;
                    const bestWeightDelta =
                      draftBestWeight - (lastSessionBestWeightDisplay ?? 0);

                    return (
                      <section className={styles.compareCard}>
                        <div className={styles.compareHead}>
                          <p className={styles.compareMeta}>
                            Last hit {formatExerciseInsightDate(lastSession.performedAt)}
                          </p>
                        </div>

                        <div className={styles.compareBody}>
                          <div className={styles.compareGrid}>
                            <div className={styles.compareItem}>
                              <p className={styles.compareLabel}>Last session</p>
                              <p className={styles.compareValue}>
                                {lastSession.setCount} sets · {lastSession.totalReps} reps
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

                          <div className={styles.compareSnapshot}>
                            <p className={styles.compareLabel}>Last session snapshot</p>
                            <div className={styles.compareSetList}>
                              {lastSession.sets.map((set, index) => (
                                <div key={`${lastSession.workoutId}-set-${index}`} className={styles.compareSetRow}>
                                  <span className={styles.compareSetIndex}>#{index + 1}</span>
                                  <span className={styles.compareSetValue}>
                                    {formatLoggedSetSnapshot(set, weightUnit)}
                                  </span>
                                </div>
                              ))}
                            </div>
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
            onClick={() => {
              submitIntentRef.current = "save";
            }}
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