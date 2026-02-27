"use client";

import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { ThemeToggle } from "@/app/components/theme-toggle";
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
  performedAt: string;
  exercises: Array<{
    name: string;
    sets: Array<{
      reps: string;
      weightLb: string;
    }>;
  }>;
};

type WorkoutDraftStoragePayload = WorkoutDraftSnapshot & {
  savedAt: string;
};

type ExerciseSuggestionsPayload = {
  suggestions?: string[];
  error?: string;
};

const INITIAL_EXERCISE_ID = "exercise-1";
const INITIAL_SET_ID = "set-1";
const WORKOUT_DRAFT_STORAGE_KEY = "logit-workout-draft-v1";
const WORKOUT_AUTOSAVE_DELAY_MS = 350;
const EXERCISE_SUGGESTION_DEBOUNCE_MS = 140;

const COMMON_WORD_FIXES: Record<string, string> = {
  dumbell: "dumbbell",
  barbel: "barbell",
  barbelll: "barbell",
  pulldwon: "pulldown",
  shoudler: "shoulder",
  deltiod: "deltoid",
  tricep: "triceps",
  bicep: "biceps",
};

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

function toLocalDateTimeInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function parseLocalDateTimeInputValue(value: string) {
  const [datePart, timePart] = value.split("T");

  if (!datePart || !timePart) {
    return new Date();
  }

  const [year, month, day] = datePart
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  const [hours, minutes] = timePart
    .split(":")
    .map((part) => Number.parseInt(part, 10));

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return new Date();
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function toSafeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeExerciseDisplayName(value: unknown) {
  const trimmed = toSafeString(value).trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return "";
  }

  return trimmed
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();
      const fixed = COMMON_WORD_FIXES[lower] ?? lower;
      return fixed.charAt(0).toUpperCase() + fixed.slice(1);
    })
    .join(" ");
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

function normalizeExerciseLookupKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatAutosaveClock(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function createWorkoutDraftSnapshot(
  title: string,
  performedAt: string,
  exercises: ExerciseDraft[],
): WorkoutDraftSnapshot {
  return {
    title,
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

function persistWorkoutDraft(snapshot: WorkoutDraftSnapshot) {
  const payload: WorkoutDraftStoragePayload = {
    ...snapshot,
    savedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(
      WORKOUT_DRAFT_STORAGE_KEY,
      JSON.stringify(payload),
    );
    return payload.savedAt;
  } catch {
    return null;
  }
}

function parseStoredWorkoutDraft(rawValue: string | null) {
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
    const performedAtSource =
      typeof parsed.performedAt === "string" ? parsed.performedAt : "";
    const performedAt = toLocalDateTimeInputValue(
      parseLocalDateTimeInputValue(performedAtSource),
    );
    const savedAt = typeof parsed.savedAt === "string" ? parsed.savedAt : null;
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
      performedAt,
      exercises,
      savedAt,
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

function scoreExerciseSuggestionMatch(queryKey: string, candidateKey: string) {
  if (!queryKey || queryKey === candidateKey) {
    return Number.NEGATIVE_INFINITY;
  }

  const queryTokens = queryKey.split(" ").filter(Boolean);

  if (
    queryTokens.length === 0 ||
    queryTokens.some((token) => !candidateKey.includes(token))
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;

  if (candidateKey.startsWith(queryKey)) {
    score += 280;
  } else if (candidateKey.includes(queryKey)) {
    score += 190;
  }

  for (const token of queryTokens) {
    const tokenIndex = candidateKey.indexOf(token);
    if (tokenIndex === -1) {
      continue;
    }

    const startsWord = tokenIndex === 0 || candidateKey[tokenIndex - 1] === " ";
    score += startsWord ? 45 : 22;
  }

  const lengthPenalty = Math.max(0, candidateKey.length - queryKey.length);
  score -= lengthPenalty * 0.5;

  return score;
}

function pickBestExerciseSuggestion(rawQuery: string, suggestions: string[]) {
  const lookupKey = normalizeExerciseLookupKey(rawQuery);

  if (!lookupKey) {
    return null;
  }

  let bestName: string | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const suggestion of suggestions) {
    const candidateName = suggestion.trim().replace(/\s+/g, " ");

    if (!candidateName) {
      continue;
    }

    const candidateKey = normalizeExerciseLookupKey(candidateName);
    const score = scoreExerciseSuggestionMatch(lookupKey, candidateKey);

    if (!Number.isFinite(score)) {
      continue;
    }

    if (
      score > bestScore ||
      (score === bestScore &&
        bestName !== null &&
        candidateName.length < bestName.length)
    ) {
      bestName = candidateName;
      bestScore = score;
    }
  }

  return bestName;
}

function buildInlineSuggestionHint(
  rawValue: string,
  suggestion: string | undefined,
) {
  if (!suggestion) {
    return null;
  }

  const currentValue = toSafeString(rawValue);
  const currentLookupKey = normalizeExerciseLookupKey(currentValue);
  const suggestionLookupKey = normalizeExerciseLookupKey(suggestion);

  if (!currentLookupKey || currentLookupKey === suggestionLookupKey) {
    return null;
  }

  if (suggestion.toLowerCase().startsWith(currentValue.toLowerCase())) {
    return suggestion.slice(currentValue.length);
  }

  return `${suggestion}`;
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
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatDelta(value: number, suffix: string) {
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded} ${suffix}`;
}

export function WorkoutLogger() {
  const router = useRouter();
  const idCounterRef = useRef({ exercise: 1, set: 1 });
  const insightCacheRef = useRef<Record<string, ExerciseInsight>>({});
  const latestInsightLookupRef = useRef<Record<string, string>>({});
  const autosaveReadyRef = useRef(false);
  const latestDraftSnapshotRef = useRef<WorkoutDraftSnapshot | null>(null);
  const suggestionCacheRef = useRef<Record<string, string[]>>({});
  const latestSuggestionLookupRef = useRef<Record<string, string>>({});
  const suggestionDebounceTimeoutRef = useRef<Record<string, number>>({});

  const [title, setTitle] = useState("Gym session");
  const [performedAt, setPerformedAt] = useState(
    toLocalDateTimeInputValue(new Date()),
  );
  const [exercises, setExercises] = useState<ExerciseDraft[]>([
    createExerciseDraft(INITIAL_EXERCISE_ID, INITIAL_SET_ID),
  ]);
  const [exerciseInsightById, setExerciseInsightById] = useState<
    Record<string, ExerciseInsightState>
  >({});
  const [exerciseSuggestionById, setExerciseSuggestionById] = useState<
    Record<string, string>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [didRestoreDraft, setDidRestoreDraft] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const performedAtDate = useMemo(
    () => parseLocalDateTimeInputValue(performedAt),
    [performedAt],
  );

  useEffect(() => {
    const rawDraft = window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY);
    const storedDraft = parseStoredWorkoutDraft(rawDraft);

    if (storedDraft) {
      const hydrated = hydrateExercisesFromSnapshot(storedDraft.exercises);
      setTitle(storedDraft.title);
      setPerformedAt(storedDraft.performedAt);
      setExercises(hydrated.exercises);
      idCounterRef.current = hydrated.counters;
      setDidRestoreDraft(true);

      if (storedDraft.savedAt) {
        setLastDraftSavedAt(storedDraft.savedAt);
      }
    } else if (rawDraft) {
      window.localStorage.removeItem(WORKOUT_DRAFT_STORAGE_KEY);
    }

    autosaveReadyRef.current = true;
  }, []);

  useEffect(() => {
    latestDraftSnapshotRef.current = createWorkoutDraftSnapshot(
      title,
      performedAt,
      exercises,
    );
  }, [title, performedAt, exercises]);

  useEffect(() => {
    if (!autosaveReadyRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const snapshot = createWorkoutDraftSnapshot(title, performedAt, exercises);
      latestDraftSnapshotRef.current = snapshot;
      const savedAt = persistWorkoutDraft(snapshot);

      if (savedAt) {
        setLastDraftSavedAt(savedAt);
      }
    }, WORKOUT_AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [title, performedAt, exercises]);

  useEffect(() => {
    function handlePageHide() {
      if (!autosaveReadyRef.current || !latestDraftSnapshotRef.current) {
        return;
      }

      persistWorkoutDraft(latestDraftSnapshotRef.current);
    }

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

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

  function handleExerciseNameKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    exerciseId: string,
    suggestion: string | undefined,
  ) {
    if (!suggestion) {
      return;
    }

    const key = event.key;
    if (key !== "Tab" && key !== "ArrowRight") {
      return;
    }

    if (key === "ArrowRight") {
      const input = event.currentTarget;
      const selectionStart = input.selectionStart ?? input.value.length;
      const selectionEnd = input.selectionEnd ?? input.value.length;
      const isCursorAtEnd =
        selectionStart === input.value.length &&
        selectionEnd === input.value.length;

      if (!isCursorAtEnd) {
        return;
      }
    }

    event.preventDefault();
    clearPendingSuggestionLookup(exerciseId);
    acceptExerciseSuggestion(exerciseId, suggestion);
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
        performedAt,
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
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload.value),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFormError(data.error ?? "Unable to save workout.");
        return;
      }

      window.localStorage.removeItem(WORKOUT_DRAFT_STORAGE_KEY);

      router.push("/workouts");
      router.refresh();
    } catch {
      setFormError("Unable to save workout.");
    } finally {
      setIsSaving(false);
    }
  }

  const autosaveClock = lastDraftSavedAt ? formatAutosaveClock(lastDraftSavedAt) : "";

  return (
    <main className={styles.loggerShell}>
      <section className={styles.loggerStage} aria-label="Workout logger">
        <div className={styles.topRow}>
          <Link href="/dashboard?view=workouts" className={styles.backLink}>
            Back to workouts
          </Link>
          <ThemeToggle />
        </div>

        <header className={styles.header}>
          <h1 className={styles.title}>Log workout</h1>
          <p className={styles.autosaveMeta}>
            {didRestoreDraft ? "Draft restored. " : ""}
            {autosaveClock
              ? `Autosaved at ${autosaveClock}.`
              : "Autosaves on this device while you log."}
          </p>
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
                <label className={styles.label} htmlFor="workout-performed-at">
                  Date & time
                </label>
                <DatePicker
                  id="workout-performed-at"
                  selected={performedAtDate}
                  onChange={(value: Date | null) => {
                    if (value) {
                      setPerformedAt(toLocalDateTimeInputValue(value));
                    }
                  }}
                  showTimeSelect
                  timeIntervals={5}
                  dateFormat="MM/dd/yyyy, hh:mm aa"
                  calendarClassName={styles.datePickerCalendar}
                  wrapperClassName={styles.datePickerWrapper}
                  popperClassName={styles.datePickerPopper}
                  className={`${styles.input} ${styles.dateTimeInput}`}
                  showPopperArrow={false}
                />
              </div>
            </div>
          </section>

          <section className={styles.exerciseSection}>
            {exercises.map((exercise, exerciseIndex) => (
              <article key={exercise.id} className={styles.exerciseCard}>
                <div className={styles.exerciseHead}>
                  <h2 className={styles.exerciseTitle}>
                    Exercise {exerciseIndex + 1}
                  </h2>
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
                  <label
                    className={styles.label}
                    htmlFor={`exercise-name-${exercise.id}`}
                  >
                    Exercise name
                  </label>
                  <div className={styles.inlineRow}>
                    {(() => {
                      const inlineSuggestionHint = buildInlineSuggestionHint(
                        exercise.name,
                        exerciseSuggestionById[exercise.id],
                      );

                      if (!inlineSuggestionHint) {
                        return null;
                      }

                      return (
                        <span
                          className={styles.inlineSuggestionGhost}
                          aria-hidden="true"
                        >
                          <span className={styles.inlineSuggestionTyped}>
                            {exercise.name}
                          </span>
                          <span className={styles.inlineSuggestionText}>
                            {inlineSuggestionHint}
                          </span>
                        </span>
                      );
                    })()}
                    <input
                      id={`exercise-name-${exercise.id}`}
                      className={`${styles.input} ${styles.inlineSuggestionInput}`}
                      value={exercise.name}
                      onChange={(event) =>
                        handleExerciseNameChange(exercise.id, event.target.value)
                      }
                      onKeyDown={(event) =>
                        handleExerciseNameKeyDown(
                          event,
                          exercise.id,
                          exerciseSuggestionById[exercise.id],
                        )
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
                  const volumeDelta =
                    draftSummary.totalVolume - insight.lastSession.totalVolume;
                  const lastBestWeight = insight.lastSession.bestWeight ?? 0;
                  const draftBestWeight = draftSummary.bestWeight ?? 0;
                  const bestWeightDelta = draftBestWeight - lastBestWeight;

                  return (
                    <section className={styles.compareCard}>
                      <div className={styles.compareHead}>
                        <p className={styles.compareTitle}>Comparison</p>
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
                            {insight.lastSession.totalVolume} lb
                          </p>
                        </div>
                        <div className={styles.compareItem}>
                          <p className={styles.compareLabel}>Last best weight</p>
                          <p className={styles.compareValue}>
                            {insight.lastSession.bestWeight !== null
                              ? insight.lastSession.bestWeightReps !== null
                                ? `${insight.lastSession.bestWeight} lb x ${insight.lastSession.bestWeightReps}`
                                : `${insight.lastSession.bestWeight} lb`
                              : "--"}
                          </p>
                        </div>
                        <div className={styles.compareItem}>
                          <p className={styles.compareLabel}>All-time best</p>
                          <p className={styles.compareValue}>
                            {insight.allTimeBestWeight !== null
                              ? `${insight.allTimeBestWeight} lb`
                              : "--"}
                          </p>
                        </div>
                      </div>

                      {draftSummary.setCount > 0 ? (
                        <p className={styles.compareDelta}>
                          Volume vs last: {formatDelta(volumeDelta, "lb")} ·
                          Best vs last: {formatDelta(bestWeightDelta, "lb")}
                        </p>
                      ) : (
                        <p className={styles.compareDelta}>
                          Add reps and weight to compare this session live.
                        </p>
                      )}
                    </section>
                  );
                })()}

                <div className={styles.setsStack}>
                  <div className={styles.setsHead}>
                    <h3 className={styles.setsTitle}>Sets</h3>
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

                  <div
                    className={`${styles.setRow} ${styles.setRowHeader}`}
                    aria-hidden="true"
                  >
                    <span className={styles.setHeadLabel}>Set</span>
                    <span className={styles.setHeadLabel}>Weight (lb)</span>
                    <span className={styles.setHeadLabel}>Reps</span>
                    <span className={styles.setHeadLabel}>Action</span>
                  </div>

                  {exercise.sets.map((setItem, setIndex) => (
                    <div key={setItem.id} className={styles.setRow}>
                      <p className={styles.setNumber}>#{setIndex + 1}</p>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.]?[0-9]*"
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        enterKeyHint="next"
                        className={styles.input}
                        placeholder="Lb"
                        value={setItem.weightLb}
                        aria-label={`Weight in pounds for set ${setIndex + 1}`}
                        onChange={(event) =>
                          updateSet(
                            exercise.id,
                            setItem.id,
                            "weightLb",
                            sanitizeWeightInput(event.target.value),
                          )
                        }
                      />
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
                      <button
                        type="button"
                        className={styles.iconButton}
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
                Saving workout...
              </>
            ) : (
              <>
                <Save
                  className={styles.actionIcon}
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
                Save workout
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
