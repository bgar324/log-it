import { copyTextToClipboard } from "@/lib/clipboard";
import { formatWorkoutSplitForClipboard } from "@/lib/workout-export";
import { getCurrentPacificDate } from "@/lib/workout-utils";
import { normalizeWorkoutTypeSlug } from "@/lib/workout-utils";
import {
  getWeekdayForDate,
  type SplitWeekdayValue,
  type WorkoutSplitTemplate,
} from "@/lib/workout-splits/shared";

export type SplitManagerSaveState =
  | { kind: "idle" }
  | { kind: "saving" };

export type SaveSplitResponse =
  | {
      ok: true;
      split: WorkoutSplitTemplate;
    }
  | {
      ok?: false;
      error?: string;
    };

export type SplitMutationResponse = SaveSplitResponse;

export const EXERCISE_SUGGESTION_DEBOUNCE_MS = 140;

export function createExerciseDraft(order: number) {
  return {
    id: null,
    order,
    exerciseDisplayName: "",
    exerciseSlug: "",
    sets: 2,
  };
}

export function exerciseSuggestionKey(
  weekday: SplitWeekdayValue,
  exerciseIndex: number,
) {
  return `${weekday}-${exerciseIndex}`;
}

export function getInitialSelectedWeekday(): SplitWeekdayValue {
  return getWeekdayForDate(getCurrentPacificDate());
}

export function buildSelectedDayExerciseSearchResults(
  selectedDay: WorkoutSplitTemplate["days"][number] | null,
  resultsByKey: Record<string, string[]>,
) {
  if (!selectedDay) {
    return {};
  }

  return Object.fromEntries(
    selectedDay.exercises.map((_, index) => {
      const key = exerciseSuggestionKey(selectedDay.weekday, index);
      return [key, resultsByKey[key] ?? []];
    }),
  );
}

export function clampExerciseSets(value: number) {
  return Math.min(Math.max(value, 1), 20);
}

export async function saveWorkoutSplit(split: WorkoutSplitTemplate) {
  const response = await fetch("/api/workout-split", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: split.id,
      name: split.name,
      days: split.days.map((day) => ({
        weekday: day.weekday,
        workoutType: day.workoutType,
        exercises:
          normalizeWorkoutTypeSlug(day.workoutType) === "rest"
            ? []
            : day.exercises.map((exercise) => ({
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

  return payload.split;
}

export async function createWorkoutSplit() {
  const response = await fetch("/api/workout-split", {
    method: "POST",
  });
  const payload = (await response.json()) as SplitMutationResponse;

  if (!response.ok || !payload || !("ok" in payload && payload.ok)) {
    throw new Error(payload && "error" in payload ? payload.error : "Unable to create split.");
  }

  return payload.split;
}

export async function activateWorkoutSplit(splitId: string) {
  const response = await fetch("/api/workout-split", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: splitId,
      action: "activate",
    }),
  });
  const payload = (await response.json()) as SplitMutationResponse;

  if (!response.ok || !payload || !("ok" in payload && payload.ok)) {
    throw new Error(payload && "error" in payload ? payload.error : "Unable to activate split.");
  }

  return payload.split;
}

export async function deleteWorkoutSplit(splitId: string) {
  const response = await fetch(`/api/workout-split?id=${encodeURIComponent(splitId)}`, {
    method: "DELETE",
  });
  const payload = (await response.json()) as { ok?: boolean; id?: string; error?: string };

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? "Unable to delete split.");
  }

  return payload.id ?? splitId;
}

export async function copyWorkoutSplit(split: WorkoutSplitTemplate) {
  const result = await copyTextToClipboard(formatWorkoutSplitForClipboard(split));

  return result === "clipboard"
    ? "Copied split to clipboard."
    : "Clipboard blocked. Split text opened for manual copy.";
}
