"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import {
  copyWorkoutSplit,
  saveWorkoutSplit,
  type SplitManagerSaveState,
} from "../split-manager.shared";

type UseSplitManagerPersistenceOptions = {
  split: WorkoutSplitTemplate;
  setSplit: Dispatch<SetStateAction<WorkoutSplitTemplate>>;
  clearAllExerciseSuggestions: () => void;
};

export function useSplitManagerPersistence({
  split,
  setSplit,
  clearAllExerciseSuggestions,
}: UseSplitManagerPersistenceOptions) {
  const router = useRouter();
  const [saveState, setSaveState] = useState<SplitManagerSaveState>({
    kind: "idle",
  });

  async function handleSave() {
    const toastId = toast.loading("Saving split...");
    setSaveState({ kind: "saving" });

    try {
      const savedSplit = await saveWorkoutSplit(split);
      setSplit(savedSplit);
      clearAllExerciseSuggestions();
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
    const toastId = toast.loading("Copying split...");

    try {
      toast.success(await copyWorkoutSplit(split), {
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
