"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import type { Feedback } from "@/app/components/inline-feedback";
import posthog from "posthog-js";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import {
  copyWorkoutSplit,
  saveWorkoutSplit,
  type SplitManagerSaveState,
} from "@/app/_legacy/dashboard/split-manager.shared";

type UseSplitManagerPersistenceOptions = {
  split: WorkoutSplitTemplate;
  setSplit: Dispatch<SetStateAction<WorkoutSplitTemplate>>;
  setSplits: Dispatch<SetStateAction<WorkoutSplitTemplate[]>>;
  clearAllExerciseSuggestions: () => void;
  persistChanges: boolean;
  setFeedback: Dispatch<SetStateAction<Feedback | null>>;
};

export function useSplitManagerPersistence({
  split,
  setSplit,
  setSplits,
  clearAllExerciseSuggestions,
  persistChanges,
  setFeedback,
}: UseSplitManagerPersistenceOptions) {
  const router = useRouter();
  const [saveState, setSaveState] = useState<SplitManagerSaveState>({
    kind: "idle",
  });

  // Takes an explicit split when the caller already knows the next value:
  // reordering the week saves immediately, and React state is not readable
  // until the next render.
  async function handleSave(nextSplit?: WorkoutSplitTemplate) {
    if (!persistChanges) {
      setFeedback({ tone: "info", message: "Changes stay in this preview and are not saved." });
      return;
    }

    const splitToSave = nextSplit ?? split;
    setFeedback(null);
    setSaveState({ kind: "saving" });

    try {
      const savedSplit = await saveWorkoutSplit(splitToSave);
      setSplit(savedSplit);
      setSplits((current) =>
        current.map((item) => (item.id === splitToSave.id ? savedSplit : item)),
      );
      clearAllExerciseSuggestions();
      posthog.capture("workout_split_updated", {
        training_day_count: savedSplit.days.filter((day) => day.exercises.length > 0).length,
        exercise_count: savedSplit.days.reduce(
          (total, day) => total + day.exercises.length,
          0,
        ),
      });
      router.refresh();
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : "Unable to save split." });
    } finally {
      setSaveState({ kind: "idle" });
    }
  }

  async function handleCopySplit() {
    if (!persistChanges) {
      setFeedback({ tone: "info", message: "Copying splits is disabled in this preview." });
      return;
    }

    setFeedback(null);

    try {
      const message = await copyWorkoutSplit(split);
      posthog.capture("workout_split_copied");
      setFeedback({ tone: "info", message });
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : "Unable to copy split." });
    }
  }

  return {
    saveState,
    handleSave,
    handleCopySplit,
  };
}
