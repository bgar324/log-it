"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createExerciseInsightRequestContext,
  type ExerciseInsightRequestContext,
} from "@/lib/workouts/insight-request";
import type {
  ExerciseDraft,
  ExerciseInsight,
  ExerciseInsightState,
} from "../workout-logger.utils";

type UseWorkoutLoggerInsightsOptions = {
  exercises: ExerciseDraft[];
  performedAt: string;
  excludeWorkoutId?: string | null;
};

export function useWorkoutLoggerInsights({
  exercises,
  performedAt,
  excludeWorkoutId = null,
}: UseWorkoutLoggerInsightsOptions) {
  const insightCacheRef = useRef<Record<string, ExerciseInsight>>({});
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
          } => item.context !== null,
        ),
    [excludeWorkoutId, exercises, performedAt],
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
    ) => {
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

      const lookupKey = requestContext.lookupKey;
      const cached = insightCacheRef.current[lookupKey];

      if (cached) {
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
      // A newer request for the same exercise wins: cancel the one in flight so
      // a slow response cannot land on top of it.
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
        const response = await fetch(requestContext.requestPath, {
          cache: "no-store",
          signal: abortController.signal,
        });
        const payload = (await response.json()) as
          | ExerciseInsight
          | { error?: string };

        if (!response.ok || !("normalizedName" in payload)) {
          throw new Error(
            "error" in payload
              ? (payload.error ?? "Unable to compare exercise.")
              : "Unable to compare exercise.",
          );
        }

        insightCacheRef.current[lookupKey] = payload;

        if (latestInsightLookupRef.current[exerciseId] !== lookupKey) {
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
    [getExerciseInsightContext],
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
      if (state?.status === "idle" || state?.lookupKey === context.lookupKey) {
        continue;
      }

      void fetchExerciseInsight(exerciseId, context.exerciseName, context);
    }
  }, [exerciseInsightById, exerciseInsightContexts, fetchExerciseInsight]);

  useEffect(() => {
    const controllers = requestAbortRef.current;

    return () => {
      for (const controller of Object.values(controllers)) {
        controller.abort();
      }
    };
  }, []);

  return {
    clearAllExerciseInsights,
    clearExerciseInsight,
    exerciseInsightById,
    fetchExerciseInsight,
    getExerciseInsightContext,
    resetExerciseInsightState,
  };
}
