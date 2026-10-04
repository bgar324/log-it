import {
  displayWeightToPounds,
  getGymWeightIncrement,
  roundStoredWeightToGymIncrement,
} from "../weight-unit";
import { daysBetweenDatabaseDates } from "../workout-utils";
import { createRepRange, scorePredictionConfidence } from "./prediction-confidence";
import {
  getFallbackRepDelta,
  getFallbackWeightRatio,
  buildBackoffProfile,
  getHistoricalMedianPosition,
} from "./prediction-history";
import { clamp } from "./prediction-math";
import { predictLearnedAnchor } from "./prediction-model";
import type { AnchorSession, ExercisePrediction, PredictExercisePerformanceOptions, PredictedSet } from "./prediction-types";

export function buildExercisePrediction(options: Omit<PredictExercisePerformanceOptions, "sessions"> & {
  anchorSessions: AnchorSession[];
}) {
  const latest = options.anchorSessions[0];
  const forecast = predictLearnedAnchor(options);
  if (!latest || !forecast) return null;

  // Confidence and backoff describe the current routine, not the entire training window.
  const recent = options.anchorSessions.slice(0, 5);
  const daysSinceLastPerformed = daysBetweenDatabaseDates(options.performedAt, latest.session.performedAt);
  const confidence = scorePredictionConfidence({
    sessionCount: recent.length,
    anchorValues: recent.map(({ anchor }) => anchor.strength),
    setCounts: recent.map(({ session }) => session.sets.length),
    daysSinceLastPerformed,
    currentPosition: options.currentPosition,
    historicalMedianPosition: getHistoricalMedianPosition(recent),
    capAtMedium: latest.anchor.kind === "bodyweight",
  }).label;
  const backoff = buildBackoffProfile(recent);
  let anchorWeightLb: number | null = null;
  const anchorReps = latest.anchor.kind === "bodyweight"
    ? Math.max(1, Math.round(forecast.strength))
    : forecast.reps;
  if (latest.anchor.weightLb !== null) {
    const stepLb = displayWeightToPounds(getGymWeightIncrement(options.weightUnit), options.weightUnit);
    const recentLoad = roundStoredWeightToGymIncrement(latest.anchor.weightLb, options.weightUnit);
    const decrease = stepLb * (daysSinceLastPerformed > 28 ? 3 : 2);
    const rawLoad = forecast.strength / (1 + Math.min(anchorReps, 12) / 30);
    anchorWeightLb = roundStoredWeightToGymIncrement(
      clamp(rawLoad, Math.max(stepLb, recentLoad - decrease), Math.max(stepLb, recentLoad + stepLb)),
      options.weightUnit,
    );
  }

  const predictedSets: PredictedSet[] = [];
  for (let setIndex = 1; setIndex <= options.setCount; setIndex += 1) {
    const offset = setIndex - 1;
    const profile = backoff.get(offset);
    const reps = Math.max(1, anchorReps + (offset === 0 ? 0 : Math.round(profile?.repDelta ?? getFallbackRepDelta(offset))));
    const weightLb = anchorWeightLb === null ? null : Math.min(anchorWeightLb,
      roundStoredWeightToGymIncrement(anchorWeightLb * (offset === 0 ? 1 : profile?.weightRatio ?? getFallbackWeightRatio(offset)), options.weightUnit));
    predictedSets.push({ setIndex, weightLb, reps, repRange: createRepRange(reps, confidence) });
  }
  return {
    basedOnSessions: options.anchorSessions.length,
    daysSinceLastPerformed,
    confidence,
    model: forecast.assessment,
    rationale: [
      `Based on ${options.anchorSessions.length} prior sessions`,
      forecast.assessment.source === "ridge"
        ? `Personal regression trained on ${forecast.assessment.trainingExamples} transitions; beat repeat-last on four chronological checks`
        : forecast.assessment.validationExamples > 0
          ? "Repeating the last anchor because the learned model did not beat it in chronological validation"
          : "Repeating the last anchor until enough history exists to validate a learned model",
      "Confidence describes history consistency, not a calibrated probability",
    ],
    predictedSets,
  } satisfies ExercisePrediction;
}
