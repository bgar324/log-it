"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WeightUnit } from "@/lib/weight-unit";
import {
  loadWorkoutDetail,
  readWorkoutDetail,
  type WorkoutDetailState,
} from "../workout-detail-cache";

/** Cache-owned requests survive navigation; this hook only tracks the current selection. */
export function useWorkoutDetails(
  workoutIds: readonly string[],
  unit: WeightUnit,
  userId: string,
) {
  const idsKey = workoutIds.join(",");
  const selectionKey = `${userId}|${unit}|${idsKey}`;
  const [selection, setSelection] = useState<{
    key: string;
    states: Record<string, WorkoutDetailState>;
  }>(() => ({ key: selectionKey, states: {} }));
  const [attempt, setAttempt] = useState(0);

  if (selection.key !== selectionKey) {
    setSelection({ key: selectionKey, states: {} });
  }

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",") : [];
    let watching = true;

    const read = (id: string) => {
      void loadWorkoutDetail(userId, unit, id).then((state) => {
        if (!watching) return;
        if (!state) {
          // A successful write invalidated this pending read.
          read(id);
          return;
        }
        setSelection((current) => current.key === selectionKey ? {
          key: current.key,
          states: { ...current.states, [`${userId}|${unit}|${id}`]: state },
        } : current);
      });
    };

    for (const id of ids) {
      if (!readWorkoutDetail(userId, unit, id)) read(id);
    }

    return () => { watching = false; };
  }, [attempt, idsKey, selectionKey, unit, userId]);

  const retry = useCallback((id: string) => {
    const key = `${userId}|${unit}|${id}`;
    setSelection((current) => {
      if (current.key !== selectionKey || !(key in current.states)) return current;
      const states = { ...current.states };
      delete states[key];
      return { key: current.key, states };
    });
    setAttempt((count) => count + 1);
  }, [selectionKey, unit, userId]);

  const details = useMemo(() => {
    const byWorkout: Record<string, WorkoutDetailState> = {};
    for (const id of idsKey ? idsKey.split(",") : []) {
      const state = readWorkoutDetail(userId, unit, id) ?? selection.states[`${userId}|${unit}|${id}`];
      if (state) byWorkout[id] = state;
    }
    return byWorkout;
  }, [idsKey, selection, unit, userId]);

  return { details, retry };
}
