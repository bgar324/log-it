"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { invalidateWorkoutDetails } from "@/app/dashboard/workout-detail-cache";
import type { WeightUnit } from "@/lib/weight-unit";
import { parseStoredWorkoutDraft, clearStoredWorkoutDraft, readStoredWorkoutDraft, WORKOUT_DRAFT_CHANGE_EVENT } from "../workout-logger.draft";
import { useWorkoutDraftStatus } from "./use-workout-draft-status";


function subscribe(onChange: () => void) {
  window.addEventListener(WORKOUT_DRAFT_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  window.addEventListener("pageshow", onChange);
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.removeEventListener(WORKOUT_DRAFT_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
    window.removeEventListener("pageshow", onChange);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

const serverSnapshot = () => null;

// A stored copy is not necessarily unfinished: the server may have committed it
// before a lost response or an older window left the local copy behind.
export function useStoredWorkoutDraft(weightUnit: WeightUnit, userId: string | undefined) {
  const router = useRouter();
  const raw = useSyncExternalStore(subscribe, readStoredWorkoutDraft, serverSnapshot);
  const snapshot = useMemo(() => parseStoredWorkoutDraft(raw, weightUnit), [raw, weightUnit]);
  const { state, retry } = useWorkoutDraftStatus(snapshot, weightUnit, userId);
  useEffect(() => {
    if (state.status === "saved" && clearStoredWorkoutDraft(raw)) {
      invalidateWorkoutDetails(state.workoutId);
      router.refresh();
    }
  }, [raw, router, state]);
  return { draft: state.status === "saved" ? null : snapshot, state, retry };
}
