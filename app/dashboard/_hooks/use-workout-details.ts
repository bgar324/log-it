"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WorkspaceWorkoutDetailProjection } from "@/app/workspace/details/workspace-workout-detail.data";
import type { WeightUnit } from "@/lib/weight-unit";

export type WorkoutDetailState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; detail: WorkspaceWorkoutDetailProjection };

/**
 * Sets for the sessions currently on screen, fetched once each.
 *
 * The history browser can move between days faster than a request completes,
 * so every run aborts the requests the previous one started and only the run
 * that is still mounted may write state. Resolved days stay in a cache keyed by
 * workout AND display unit: stepping back to yesterday is instant, and changing
 * pounds to kilograms cannot leave a converted number on screen.
 */
export function useWorkoutDetails(workoutIds: readonly string[], unit: WeightUnit) {
  const cacheRef = useRef(new Map<string, WorkoutDetailState>());
  const requestedRef = useRef(new Set<string>());
  const [states, setStates] = useState<Record<string, WorkoutDetailState>>({});
  const [attempt, setAttempt] = useState(0);
  const idsKey = workoutIds.join(",");

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",") : [];
    const controller = new AbortController();
    const started: string[] = [];
    const cache = cacheRef.current;
    const requested = requestedRef.current;

    for (const id of ids) {
      const key = `${unit}|${id}`;
      const cached = cache.get(key);

      if (cached) {
        setStates((current) =>
          current[key] === cached ? current : { ...current, [key]: cached },
        );
        continue;
      }

      if (requested.has(key)) {
        continue;
      }

      requested.add(key);
      started.push(key);
      setStates((current) => ({ ...current, [key]: { status: "loading" } }));

      void (async () => {
        let next: WorkoutDetailState;

        try {
          const response = await fetch(`/api/workouts/${encodeURIComponent(id)}`, {
            cache: "no-store",
            signal: controller.signal,
            headers: { accept: "application/json" },
          });
          const payload = (await response.json().catch(() => null)) as
            | { detail?: WorkspaceWorkoutDetailProjection; error?: string }
            | null;

          next =
            response.status === 404
              ? { status: "missing" }
              : !response.ok || !payload?.detail
                ? {
                    status: "error",
                    message: payload?.error ?? "Unable to load this workout.",
                  }
                : { status: "ready", detail: payload.detail };
        } catch (error) {
          next = {
            status: "error",
            message:
              error instanceof Error && !controller.signal.aborted
                ? error.message
                : "Unable to load this workout.",
          };
        }

        // A later day already took over: this answer is stale, and the cleanup
        // below has already released the key so the day can be loaded again.
        if (controller.signal.aborted) {
          return;
        }

        if (next.status === "error") {
          // Errors are transient. Let coming back to the day try again.
          requested.delete(key);
        } else {
          cache.set(key, next);
        }

        setStates((current) => ({ ...current, [key]: next }));
      })();
    }

    return () => {
      controller.abort();

      for (const key of started) {
        if (!cache.has(key)) {
          requested.delete(key);
        }
      }
    };
  }, [attempt, idsKey, unit]);

  const retry = useCallback(
    (id: string) => {
      const key = `${unit}|${id}`;
      requestedRef.current.delete(key);
      cacheRef.current.delete(key);
      setStates((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setAttempt((count) => count + 1);
    },
    [unit],
  );

  const details = useMemo(() => {
    const byWorkout: Record<string, WorkoutDetailState> = {};

    for (const id of idsKey ? idsKey.split(",") : []) {
      const state = states[`${unit}|${id}`];

      if (state) {
        byWorkout[id] = state;
      }
    }

    return byWorkout;
  }, [idsKey, states, unit]);

  return { details, retry };
}
