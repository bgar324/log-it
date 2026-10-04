import { buildExercisePrediction } from "./prediction-builders";
import { computeSetStrength, findAnchorSet } from "./prediction-anchor";
import { scorePredictionConfidence } from "./prediction-confidence";
import { getAnchorSessions, sortSessionsByDateDescending, buildBackoffProfile } from "./prediction-history";
import {
  MAX_RECENT_SESSIONS,
  type PredictExercisePerformanceOptions,
} from "./prediction-types";

export type {
  AnchorSet,
  ExercisePrediction,
  PredictionSession,
  PredictionSessionSet,
  PredictedSet,
} from "./prediction-types";

export {
  computeSetStrength,
  findAnchorSet,
  scorePredictionConfidence,
};

export function computeBackoffProfile(
  sessions: Parameters<typeof sortSessionsByDateDescending>[0],
) {
  return buildBackoffProfile(getAnchorSessions(sortSessionsByDateDescending(sessions)));
}

export function predictExercisePerformance(options: PredictExercisePerformanceOptions) {
  if (!Number.isInteger(options.setCount) || options.setCount <= 0 ||
      !Number.isFinite(options.performedAt.getTime()) ||
      !Number.isInteger(options.currentPosition) || options.currentPosition <= 0) {
    return null;
  }

  // Date-only logs cannot establish ordering within a day. Never learn from the
  // target date or future dates, including when editing a historical workout.
  const targetDay = options.performedAt.toISOString().slice(0, 10);
  const seenDays = new Set<string>();
  const sessions = sortSessionsByDateDescending(options.sessions).filter(session => {
    if (!Number.isFinite(session.performedAt.getTime())) return false;
    const day = session.performedAt.toISOString().slice(0, 10);
    if (day >= targetDay || seenDays.has(day)) return false;
    seenDays.add(day);
    return true;
  }).slice(0, MAX_RECENT_SESSIONS);
  const anchorSessions = getAnchorSessions(sessions.map(session => ({
    ...session,
    sets: session.sets.filter(set => Number.isInteger(set.reps) && set.reps > 0 &&
      (set.weightLb === null || (Number.isFinite(set.weightLb) && set.weightLb > 0)))
      .map((set, index) => ({ ...set, setIndex: index + 1 })),
  })));

  if (anchorSessions.length === 0) {
    return null;
  }

  // A switch to bodyweight must not resurrect older weighted recommendations.
  const kind = anchorSessions[0].anchor.kind;
  return buildExercisePrediction({
    ...options,
    anchorSessions: anchorSessions.filter(({ anchor }) => anchor.kind === kind),
  });
}
