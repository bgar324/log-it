"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import {
  copyWorkoutSplit,
  saveWorkoutSplit,
  type SplitManagerCopyState,
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
    message: "",
  });
  const [copyState, setCopyState] = useState<SplitManagerCopyState>({
    kind: "idle",
    message: "",
  });

  async function handleSave() {
    setSaveState({ kind: "saving", message: "Saving split..." });

    try {
      const savedSplit = await saveWorkoutSplit(split);
      setSplit(savedSplit);
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
      setCopyState({
        kind: "success",
        message: await copyWorkoutSplit(split),
      });
    } catch (error) {
      setCopyState({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to copy split.",
      });
    }
  }

  return {
    saveState,
    copyState,
    handleSave,
    handleCopySplit,
  };
}
