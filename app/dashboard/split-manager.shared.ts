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

export async function copyWorkoutSplit(split: WorkoutSplitTemplate) {
  const result = await copyTextToClipboard(formatWorkoutSplitForClipboard(split));

  return result === "clipboard"
    ? "Copied split to clipboard."
    : "Clipboard blocked. Split text opened for manual copy.";
}
