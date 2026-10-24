"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WeightUnit } from "@/lib/weight-unit";
import { loadWorkoutInsight, readWorkoutInsight } from "../workout-insight-cache";
import {
  createExerciseInsightRequestContext,
  type ExerciseInsightRequestContext,
} from "@/lib/workouts/insight-request";
import type {
  ExerciseDraft,
  ExerciseInsightState,
} from "../workout-logger.utils";

type UseWorkoutLoggerInsightsOptions = {
  userId: string;
  weightUnit: WeightUnit;
  exercises: ExerciseDraft[];
  performedAt: string;
  excludeWorkoutId?: string | null;
  requestedExerciseIds?: readonly string[];
};

export function useWorkoutLoggerInsights({
  userId,
  weightUnit,
  exercises,
  performedAt,
  excludeWorkoutId = null,
  requestedExerciseIds,
}: UseWorkoutLoggerInsightsOptions) {
  const latestInsightLookupRef = useRef<Record<string, string>>({});
  const requestAbortRef = useRef<Record<string, AbortController>>({});
  const [exerciseInsightById, setExerciseInsightById] = useState<
    Record<string, ExerciseInsightState>
  >({});

  const exerciseInsightContexts = useMemo(
    () =>
      exercises
        .map((exercise, exerciseIndex) => ({
          exerciseId: exercise.id,
          context: createExerciseInsightRequestContext(
            exercise.name,
            performedAt,
            exerciseIndex + 1,
            excludeWorkoutId,
          ),
        }))
        .filter(
          (
            item,
          ): item is {
            exerciseId: string;
            context: ExerciseInsightRequestContext;
          } =>
            item.context !== null &&
            (requestedExerciseIds === undefined ||
              requestedExerciseIds.includes(item.exerciseId)),
        ),
    [excludeWorkoutId, exercises, performedAt, requestedExerciseIds],
  );

  const getExerciseInsightContext = useCallback(
    (exerciseId: string, exerciseName?: string) => {
      const exerciseIndex = exercises.findIndex(
        (exercise) => exercise.id === exerciseId,
      );

      if (exerciseIndex === -1) {
        return null;
      }

      const exercise = exercises[exerciseIndex];

      if (!exercise) {
        return null;
      }

      return createExerciseInsightRequestContext(
        exerciseName ?? exercise.name,
        performedAt,
        exerciseIndex + 1,
        excludeWorkoutId,
      );
    },
    [excludeWorkoutId, exercises, performedAt],
  );

  const fetchExerciseInsight = useCallback(
    async (
      exerciseId: string,
      exerciseName: string,
      requestContext = getExerciseInsightContext(exerciseId, exerciseName),
    ): Promise<void> => {
      if (!requestContext) {
        setExerciseInsightById((current) => ({
          ...current,
          [exerciseId]: { status: "idle" },
        }));
        requestAbortRef.current[exerciseId]?.abort();
        delete requestAbortRef.current[exerciseId];
        delete latestInsightLookupRef.current[exerciseId];
        return;
      }

      const lookupKey = JSON.stringify([userId, weightUnit, requestContext.lookupKey]);
      const cached = readWorkoutInsight(userId, weightUnit, requestContext);

      if (cached) {
        requestAbortRef.current[exerciseId]?.abort();
        delete requestAbortRef.current[exerciseId];
        latestInsightLookupRef.current[exerciseId] = lookupKey;
        setExerciseInsightById((current) => ({
          ...current,
          [exerciseId]: {
            status: "ready",
            lookupKey,
            data: cached,
          },
        }));
        return;
      }

      latestInsightLookupRef.current[exerciseId] = lookupKey;
      // Cancel this exercise's observation, not the shared transport another
      // view may still need. Superseded answers cannot replace current guidance.
      requestAbortRef.current[exerciseId]?.abort();
      const abortController = new AbortController();
      requestAbortRef.current[exerciseId] = abortController;

      // Keep whatever comparison is already on screen while the refetch runs.
      setExerciseInsightById((current) => {
        const previous = current[exerciseId];

        return {
          ...current,
          [exerciseId]: {
            status: "loading",
            lookupKey,
            ...(previous?.data ? { data: previous.data } : {}),
          },
        };
      });

      try {
        const payload = await loadWorkoutInsight(userId, weightUnit, requestContext);
        if (
          abortController.signal.aborted ||
          latestInsightLookupRef.current[exerciseId] !== lookupKey
        ) return;
        if (!payload) {
          // History changed while this read was pending; ask for the new generation.
          void fetchExerciseInsight(exerciseId, exerciseName, requestContext);
          return;
        }

        setExerciseInsightById((current) => ({
          ...current,
          [exerciseId]: {
            status: "ready",
            lookupKey,
            data: payload,
          },
        }));
      } catch (error) {
        if (
          abortController.signal.aborted ||
          latestInsightLookupRef.current[exerciseId] !== lookupKey
        ) {
          return;
        }

        setExerciseInsightById((current) => {
          const previous = current[exerciseId];

          return {
            ...current,
            [exerciseId]: {
              status: "error",
              lookupKey,
              ...(previous?.data ? { data: previous.data } : {}),
              error:
                error instanceof Error
                  ? error.message
                  : "Unable to compare exercise.",
            },
          };
        });
      }
    },
    [getExerciseInsightContext, userId, weightUnit],
  );

  const clearExerciseInsight = useCallback((exerciseId: string) => {
    setExerciseInsightById((current) => {
      if (!(exerciseId in current)) {
        return current;
      }

      const next = { ...current };
      delete next[exerciseId];
      return next;
    });

    requestAbortRef.current[exerciseId]?.abort();
    delete requestAbortRef.current[exerciseId];
    delete latestInsightLookupRef.current[exerciseId];
  }, []);

  const clearAllExerciseInsights = useCallback(() => {
    for (const controller of Object.values(requestAbortRef.current)) {
      controller.abort();
    }

    requestAbortRef.current = {};
    latestInsightLookupRef.current = {};
    setExerciseInsightById({});
  }, []);

  // Typing a name parks the exercise until blur or a picked suggestion, so the
  // logger never fires a request per keystroke.
  const resetExerciseInsightState = useCallback((exerciseId: string) => {
    requestAbortRef.current[exerciseId]?.abort();
    delete requestAbortRef.current[exerciseId];
    delete latestInsightLookupRef.current[exerciseId];
    setExerciseInsightById((current) => {
      if (current[exerciseId]?.status === "idle") {
        return current;
      }

      return {
        ...current,
        [exerciseId]: { status: "idle" },
      };
    });
  }, []);

  useEffect(() => {
    for (const { exerciseId, context } of exerciseInsightContexts) {
      const state = exerciseInsightById[exerciseId];

      // No state yet means the exercise arrived prefilled (edit mode, a split
      // template, a recovered draft): compare it right away.
      if (state?.status === "idle" || state?.lookupKey === JSON.stringify([userId, weightUnit, context.lookupKey])) {
        continue;
      }

      void fetchExerciseInsight(exerciseId, context.exerciseName, context);
    }
  }, [exerciseInsightById, exerciseInsightContexts, fetchExerciseInsight, userId, weightUnit]);

  useEffect(() => {
    return () => {
      for (const controller of Object.values(requestAbortRef.current)) {
        controller.abort();
      }
    };
  }, []);

  const visibleInsights: Record<string, ExerciseInsightState> = {};
  for (const { exerciseId, context } of exerciseInsightContexts) {
    const state = exerciseInsightById[exerciseId];
    if (state && (state.status === "idle" || state.lookupKey === JSON.stringify([userId, weightUnit, context.lookupKey]))) {
      visibleInsights[exerciseId] = state;
    }
  }

  return {
    clearAllExerciseInsights,
    clearExerciseInsight,
    exerciseInsightById: visibleInsights,
    fetchExerciseInsight,
    getExerciseInsightContext,
    resetExerciseInsightState,
  };
}
