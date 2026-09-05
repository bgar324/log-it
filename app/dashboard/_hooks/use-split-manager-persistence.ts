"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import posthog from "posthog-js";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import {
  copyWorkoutSplit,
  saveWorkoutSplit,
  type SplitManagerSaveState,
} from "../split-manager.shared";

type UseSplitManagerPersistenceOptions = {
  split: WorkoutSplitTemplate;
  setSplit: Dispatch<SetStateAction<WorkoutSplitTemplate>>;
  setSplits: Dispatch<SetStateAction<WorkoutSplitTemplate[]>>;
  clearAllExerciseSuggestions: () => void;
  persistChanges: boolean;
};

export function useSplitManagerPersistence({
  split,
  setSplit,
  setSplits,
  clearAllExerciseSuggestions,
  persistChanges,
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
      toast.message("Changes stay in this preview and are not saved.");
      return;
    }

    const splitToSave = nextSplit ?? split;
    const toastId = toast.loading("Saving split...");
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
      toast.success("Workout split saved.", {
        id: toastId,
        description: "Calendar and logger autofill are updated.",
      });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save split.", {
        id: toastId,
      });
    } finally {
      setSaveState({ kind: "idle" });
    }
  }

  async function handleCopySplit() {
    if (!persistChanges) {
      toast.message("Copying splits is disabled in this preview.");
      return;
    }

    const toastId = toast.loading("Copying split...");

    try {
      const message = await copyWorkoutSplit(split);
      posthog.capture("workout_split_copied");
      toast.success(message, {
        id: toastId,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to copy split.", {
        id: toastId,
      });
    }
  }

  return {
    saveState,
    handleSave,
    handleCopySplit,
  };
}
