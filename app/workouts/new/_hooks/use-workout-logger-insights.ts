"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createExerciseInsightRequestContext } from "@/lib/workouts/insight-request";
import type {
  ExerciseDraft,
  ExerciseInsight,
  ExerciseInsightState,
} from "../workout-logger.utils";

type UseWorkoutLoggerInsightsOptions = {
  exercises: ExerciseDraft[];
  performedAt: string;
};

type InsightRequestContext = NonNullable<
  ReturnType<typeof createExerciseInsightRequestContext>
>;

export function useWorkoutLoggerInsights({
  exercises,
  performedAt,
}: UseWorkoutLoggerInsightsOptions) {
  const insightCacheRef = useRef<Record<string, ExerciseInsight>>({});
  const latestInsightLookupRef = useRef<Record<string, string>>({});
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
            exercise.sets.length,
          ),
        }))
        .filter(
          (
            item,
          ): item is {
            exerciseId: string;
            context: InsightRequestContext;
          } => item.context !== null,
        ),
    [exercises, performedAt],
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
        exercise.sets.length,
      );
    },
    [exercises, performedAt],
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

      setExerciseInsightById((current) => ({
        ...current,
        [exerciseId]: {
          status: "loading",
          lookupKey,
        },
      }));

      try {
        const response = await fetch(requestContext.requestPath, {
          cache: "no-store",
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
        if (latestInsightLookupRef.current[exerciseId] !== lookupKey) {
          return;
        }

        setExerciseInsightById((current) => ({
          ...current,
          [exerciseId]: {
            status: "error",
            lookupKey,
            error:
              error instanceof Error
                ? error.message
                : "Unable to compare exercise.",
          },
        }));
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

    delete latestInsightLookupRef.current[exerciseId];
  }, []);

  const resetExerciseInsightState = useCallback((exerciseId: string) => {
    setExerciseInsightById((current) => {
      const previous = current[exerciseId];

      if (!previous || previous.status === "idle") {
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

      if (!state || state.status === "idle" || state.lookupKey === context.lookupKey) {
        continue;
      }

      void fetchExerciseInsight(exerciseId, context.exerciseName, context);
    }
  }, [exerciseInsightById, exerciseInsightContexts, fetchExerciseInsight]);

  return {
    clearExerciseInsight,
    exerciseInsightById,
    fetchExerciseInsight,
    getExerciseInsightContext,
    resetExerciseInsightState,
  };
}
