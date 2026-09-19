"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { WeightUnit } from "@/lib/weight-unit";
import { parseStoredWorkoutDraft, WORKOUT_DRAFT_STORAGE_KEY } from "../workout-logger.utils";

function readRawDraft() {
  try { return window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY); }
  catch { return null; }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("pageshow", onChange);
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("pageshow", onChange);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

const serverSnapshot = () => null;

// Home reads the exact recovery parser. Only the logger may write/consume drafts.
export function useStoredWorkoutDraft(weightUnit: WeightUnit) {
  const raw = useSyncExternalStore(subscribe, readRawDraft, serverSnapshot);
  return useMemo(() => parseStoredWorkoutDraft(raw, weightUnit), [raw, weightUnit]);
}
