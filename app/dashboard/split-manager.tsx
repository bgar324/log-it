"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  normalizeExerciseDisplayName,
  normalizeExerciseLookupKey,
  pickBestExerciseSuggestion,
} from "@/lib/exercise-autofill";
import { formatWorkoutSplitForClipboard } from "@/lib/workout-export";
import { getCurrentPacificDate } from "@/lib/workout-utils";
import {
  getWeekdayForDate,
  reorderSplitDays,
  SPLIT_WEEKDAYS,
  type SplitWeekdayValue,
  type WorkoutSplitTemplate,
} from "@/lib/workout-splits/shared";
import { SplitDayCard } from "./split-day-card";
import { SplitEditor } from "./split-editor";
import splitStyles from "./split-system.module.css";

type SplitManagerProps = {
  initialSplit: WorkoutSplitTemplate;
};

type SaveState =
  | { kind: "idle"; message: string }
  | { kind: "saving"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type SaveSplitResponse =
  | {
      ok: true;
      split: WorkoutSplitTemplate;
    }
  | {
      ok?: false;
      error?: string;
    };

type ExerciseSuggestionsPayload = {
  suggestions?: string[];
  error?: string;
};

const EXERCISE_SUGGESTION_DEBOUNCE_MS = 140;

function createExerciseDraft(order: number) {
  return {
    id: null,
    order,
    exerciseDisplayName: "",
    exerciseSlug: "",
    sets: 2,
  };
}

export function SplitManager({ initialSplit }: SplitManagerProps) {
  const router = useRouter();
  const [split, setSplit] = useState(initialSplit);
  const [selectedWeekday, setSelectedWeekday] = useState<SplitWeekdayValue>(
    getWeekdayForDate(getCurrentPacificDate()),
  );
  const [saveState, setSaveState] = useState<SaveState>({
    kind: "idle",
    message: "",
  });
  const [copyState, setCopyState] = useState<{
    kind: "idle" | "success" | "error";
    message: string;
  }>({
    kind: "idle",
    message: "",
  });
  const suggestionCacheRef = useRef<Record<string, string[]>>({});
  const latestSuggestionLookupRef = useRef<Record<string, string>>({});
  const suggestionDebounceTimeoutRef = useRef<Record<string, number>>({});
  const [exerciseSuggestionByKey, setExerciseSuggestionByKey] = useState<
    Record<string, string>
  >({});
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const selectedDay = useMemo(
    () => split.days.find((day) => day.weekday === selectedWeekday) ?? split.days[0],
    [selectedWeekday, split.days],
  );

  useEffect(() => {
    const pendingSuggestionTimeouts = suggestionDebounceTimeoutRef.current;

    return () => {
      for (const timeoutId of Object.values(pendingSuggestionTimeouts)) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  function updateSplitDay(
    weekday: SplitWeekdayValue,
    updater: (day: WorkoutSplitTemplate["days"][number]) => WorkoutSplitTemplate["days"][number],
  ) {
    setSplit((current) => ({
      ...current,
      days: current.days.map((day) => (day.weekday === weekday ? updater(day) : day)),
    }));
  }

  function exerciseSuggestionKey(weekday: SplitWeekdayValue, exerciseIndex: number) {
    return `${weekday}-${exerciseIndex}`;
  }

  function setExerciseSuggestion(exerciseKey: string, suggestion: string | null) {
    setExerciseSuggestionByKey((current) => {
      if (!suggestion) {
        if (!(exerciseKey in current)) {
          return current;
        }

        const next = { ...current };
        delete next[exerciseKey];
        return next;
      }

      if (current[exerciseKey] === suggestion) {
        return current;
      }

      return {
        ...current,
        [exerciseKey]: suggestion,
      };
    });
  }

  function clearPendingSuggestionLookup(exerciseKey: string) {
    const pendingTimeout = suggestionDebounceTimeoutRef.current[exerciseKey];

    if (pendingTimeout !== undefined) {
      window.clearTimeout(pendingTimeout);
      delete suggestionDebounceTimeoutRef.current[exerciseKey];
    }
  }

  const clearAllExerciseSuggestions = useCallback(() => {
    for (const exerciseKey of Object.keys(suggestionDebounceTimeoutRef.current)) {
      clearPendingSuggestionLookup(exerciseKey);
    }

    latestSuggestionLookupRef.current = {};
    setExerciseSuggestionByKey({});
  }, []);

  async function fetchExerciseSuggestions(exerciseKey: string, query: string) {
    const lookupKey = normalizeExerciseLookupKey(query);

    if (!lookupKey) {
      setExerciseSuggestion(exerciseKey, null);
      delete latestSuggestionLookupRef.current[exerciseKey];
      return;
    }

    const cachedSuggestions = suggestionCacheRef.current[lookupKey];

    if (cachedSuggestions) {
      setExerciseSuggestion(
        exerciseKey,
        pickBestExerciseSuggestion(query, cachedSuggestions),
      );
      return;
    }

    latestSuggestionLookupRef.current[exerciseKey] = lookupKey;

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
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter((item) => item !== "")
        : [];
      suggestionCacheRef.current[lookupKey] = suggestions;

      if (latestSuggestionLookupRef.current[exerciseKey] !== lookupKey) {
        return;
      }

      setExerciseSuggestion(
        exerciseKey,
        pickBestExerciseSuggestion(query, suggestions),
      );
    } catch {
      if (latestSuggestionLookupRef.current[exerciseKey] !== lookupKey) {
        return;
      }

      setExerciseSuggestion(exerciseKey, null);
    }
  }

  function queueExerciseSuggestionLookup(exerciseKey: string, rawValue: string) {
    clearPendingSuggestionLookup(exerciseKey);

    if (!rawValue.trim()) {
      setExerciseSuggestion(exerciseKey, null);
      delete latestSuggestionLookupRef.current[exerciseKey];
      return;
    }

    suggestionDebounceTimeoutRef.current[exerciseKey] = window.setTimeout(() => {
      delete suggestionDebounceTimeoutRef.current[exerciseKey];
      void fetchExerciseSuggestions(exerciseKey, rawValue);
    }, EXERCISE_SUGGESTION_DEBOUNCE_MS);
  }

  function handleExerciseNameChange(exerciseIndex: number, value: string) {
    const exerciseKey = exerciseSuggestionKey(selectedDay.weekday, exerciseIndex);

    updateSplitDay(selectedDay.weekday, (day) => ({
      ...day,
      exercises: day.exercises.map((exercise, index) =>
        index === exerciseIndex
          ? { ...exercise, exerciseDisplayName: value }
          : exercise,
      ),
    }));
    queueExerciseSuggestionLookup(exerciseKey, value);
  }

  function handleExerciseNameBlur(exerciseIndex: number, rawValue: string) {
    const exerciseKey = exerciseSuggestionKey(selectedDay.weekday, exerciseIndex);

    clearPendingSuggestionLookup(exerciseKey);
    setExerciseSuggestion(exerciseKey, null);
    delete latestSuggestionLookupRef.current[exerciseKey];

    updateSplitDay(selectedDay.weekday, (day) => ({
      ...day,
      exercises: day.exercises.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              exerciseDisplayName: normalizeExerciseDisplayName(rawValue),
            }
          : exercise,
      ),
    }));
  }

  function acceptExerciseSuggestion(exerciseIndex: number, suggestion: string) {
    const exerciseKey = exerciseSuggestionKey(selectedDay.weekday, exerciseIndex);

    clearPendingSuggestionLookup(exerciseKey);
    setExerciseSuggestion(exerciseKey, null);
    delete latestSuggestionLookupRef.current[exerciseKey];

    updateSplitDay(selectedDay.weekday, (day) => ({
      ...day,
      exercises: day.exercises.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              exerciseDisplayName: normalizeExerciseDisplayName(suggestion),
            }
          : exercise,
      ),
    }));
  }

  useEffect(() => {
    clearAllExerciseSuggestions();
  }, [clearAllExerciseSuggestions, selectedWeekday]);

  function handleSplitDayReorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      setDraggingIndex(null);
      setDropTargetIndex(null);
      return;
    }

    clearAllExerciseSuggestions();
    setSplit((current) => ({
      ...current,
      days: reorderSplitDays(current.days, fromIndex, toIndex),
    }));
    setSelectedWeekday(SPLIT_WEEKDAYS[toIndex] ?? selectedWeekday);
    setDraggingIndex(null);
    setDropTargetIndex(null);
  }

  async function handleSave() {
    setSaveState({ kind: "saving", message: "Saving split..." });

    try {
      const response = await fetch("/api/workout-split", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: split.name,
          days: split.days.map((day) => ({
            weekday: day.weekday,
            workoutType: day.workoutType,
            exercises: day.exercises.map((exercise) => ({
              exerciseDisplayName: exercise.exerciseDisplayName,
              sets: exercise.sets,
            })),
          })),
        }),
      });
      const payload = (await response.json()) as SaveSplitResponse;

      if (!response.ok || !payload || !("ok" in payload && payload.ok)) {
        throw new Error(payload && "error" in payload ? payload.error : "Unable to save split.");
      }

      setSplit(payload.split);
      clearAllExerciseSuggestions();
      setSaveState({
        kind: "success",
        message: "Workout split saved. Calendar and logger autofill are updated.",
      });
      router.refresh();
    } catch (error) {
      setSaveState({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to save split.",
      });
    }
  }

  async function handleCopySplit() {
    try {
      const result = await copyTextToClipboard(formatWorkoutSplitForClipboard(split));
      setCopyState({
        kind: "success",
        message:
          result === "clipboard"
            ? "Copied split to clipboard."
            : "Clipboard blocked. Split text opened for manual copy.",
      });
    } catch (error) {
      setCopyState({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to copy split.",
      });
    }
  }

  if (!selectedDay) {
    return null;
  }

  return (
    <div className={splitStyles.splitLayout}>
      <section className={splitStyles.splitSummary}>
        <div className={splitStyles.splitSummaryHead}>
          <div>
            <h2 className={splitStyles.splitHeading}>Workout split</h2>
          </div>

          <div className={splitStyles.splitSummaryActions}>
            <button
              type="button"
              className={splitStyles.inlineButton}
              onClick={() => void handleCopySplit()}
              disabled={saveState.kind === "saving"}
            >
              Copy split
            </button>
            <button
              type="button"
              className={splitStyles.primaryButton}
              onClick={() => void handleSave()}
              disabled={saveState.kind === "saving"}
            >
              {saveState.kind === "saving" ? "Saving..." : "Save split"}
            </button>
          </div>
        </div>

        <label className={splitStyles.editorField}>
          <span className={splitStyles.editorLabel}>Split name</span>
          <input
            className={splitStyles.editorInput}
            value={split.name}
            onChange={(event) =>
              setSplit((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Powerbuilding split"
          />
        </label>

        <p className={splitStyles.splitSummaryHint}>
          Drag the grip on a day card to shift where the split starts. Moving Upper into Tue makes Tuesday’s calendar badge and logger autofill become Upper.
        </p>

        <div className={splitStyles.splitGrid}>
          {split.days.map((day, index) => (
            <SplitDayCard
              key={day.weekday}
              day={day}
              isSelected={day.weekday === selectedWeekday}
              isDragging={draggingIndex === index}
              isDropTarget={dropTargetIndex === index && draggingIndex !== index}
              onSelect={() => setSelectedWeekday(day.weekday)}
              onDragStart={() => {
                setDraggingIndex(index);
                setDropTargetIndex(index);
              }}
              onDragOver={() => setDropTargetIndex(index)}
              onDrop={() => handleSplitDayReorder(draggingIndex ?? index, index)}
              onDragEnd={() => {
                setDraggingIndex(null);
                setDropTargetIndex(null);
              }}
            />
          ))}
        </div>

        {saveState.kind !== "idle" ? (
          <p
            className={`${splitStyles.status} ${
              saveState.kind === "success"
                ? splitStyles.statusSuccess
                : saveState.kind === "error"
                  ? splitStyles.statusError
                  : ""
            }`}
            role={saveState.kind === "error" ? "alert" : undefined}
          >
            {saveState.message}
          </p>
        ) : null}

        {copyState.kind !== "idle" ? (
          <p
            className={`${splitStyles.status} ${
              copyState.kind === "success"
                ? splitStyles.statusSuccess
                : splitStyles.statusError
            }`}
            role={copyState.kind === "error" ? "alert" : "status"}
          >
            {copyState.message}
          </p>
        ) : null}
      </section>

      <SplitEditor
        day={selectedDay}
        onWorkoutTypeChange={(value) =>
          updateSplitDay(selectedDay.weekday, (day) => ({
            ...day,
            workoutType: value,
          }))
        }
        exerciseSuggestions={Object.fromEntries(
          selectedDay.exercises.map((exercise, index) => {
            const exerciseKey = exerciseSuggestionKey(selectedDay.weekday, index);
            const suggestedName = exerciseSuggestionByKey[exerciseKey];
            const suggestionForAction =
              suggestedName &&
              normalizeExerciseLookupKey(exercise.exerciseDisplayName) !==
                normalizeExerciseLookupKey(suggestedName)
                ? suggestedName
                : null;

            return [exerciseKey, suggestionForAction];
          }),
        )}
        onExerciseNameChange={handleExerciseNameChange}
        onExerciseNameBlur={handleExerciseNameBlur}
        onAcceptExerciseSuggestion={acceptExerciseSuggestion}
        onExerciseSetsChange={(exerciseIndex, value) =>
          updateSplitDay(selectedDay.weekday, (day) => ({
            ...day,
            exercises: day.exercises.map((exercise, index) =>
              index === exerciseIndex
                ? { ...exercise, sets: Math.min(Math.max(value, 1), 20) }
                : exercise,
            ),
          }))
        }
        onAddExercise={() => {
          clearAllExerciseSuggestions();
          updateSplitDay(selectedDay.weekday, (day) => ({
            ...day,
            exercises: [
              ...day.exercises,
              createExerciseDraft(day.exercises.length + 1),
            ],
          }));
        }}
        onRemoveExercise={(exerciseIndex) => {
          clearAllExerciseSuggestions();
          updateSplitDay(selectedDay.weekday, (day) => ({
            ...day,
            exercises: day.exercises
              .filter((_, index) => index !== exerciseIndex)
              .map((exercise, index) => ({
                ...exercise,
                order: index + 1,
              })),
          }));
        }}
      />
    </div>
  );
}
