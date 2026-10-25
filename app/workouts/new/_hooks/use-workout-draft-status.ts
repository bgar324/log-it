"use client";

import { useEffect, useState } from "react";
import type { WeightUnit } from "@/lib/weight-unit";
import type { WorkoutDraftStatus } from "@/lib/workouts/draft-status";
import type { WorkoutDraftSnapshot } from "../workout-logger.types";

type CheckState = WorkoutDraftStatus | { status: "idle" | "checking" } | { status: "error"; message: string };

export function useWorkoutDraftStatus(snapshot: WorkoutDraftSnapshot | null, weightUnit: WeightUnit, userId: string | undefined) {
  const body = snapshot ? JSON.stringify({ draft: snapshot, weightUnit }) : null;
  const key = userId && body ? JSON.stringify([userId, body]) : null;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string | null; attempt: number; state: CheckState }>({ key: null, attempt: 0, state: { status: "idle" } });
  useEffect(() => {
    if (!key || !body || document.visibilityState === "hidden") return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/workouts/draft-status", {
          method: "POST", headers: { "Content-Type": "application/json" }, body,
          cache: "no-store", signal: controller.signal,
        });
        const payload: WorkoutDraftStatus | { error: string } = await response.json();
        if (!response.ok || !("status" in payload)) {
          throw new Error("error" in payload ? payload.error : "Unable to check this workout.");
        }
        if (!controller.signal.aborted) setResult({ key, attempt, state: payload });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key, attempt, state: { status: "error", message: error instanceof Error ? error.message : "Unable to check this workout." } });
      }
    })();
    return () => controller.abort();
  }, [attempt, body, key]);
  useEffect(() => {
    if (!key) return;
    const checkAgain = () => setAttempt(value => value + 1);
    const onVisible = () => { if (document.visibilityState === "visible") checkAgain(); };
    window.addEventListener("pageshow", checkAgain);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", checkAgain);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [key]);
  const state: CheckState = !key ? { status: "idle" }
    : result.key === key && result.attempt === attempt ? result.state : { status: "checking" };
  return { state, retry: () => setAttempt(value => value + 1) };
}
