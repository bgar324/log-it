"use client";

import { convertStoredWeightToDisplay, formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import { styles } from "../workout-logger.styles";
import {
  formatConfidenceLabel,
  formatDelta,
  formatExerciseInsightDate,
  formatLoggedSetSnapshot,
  formatPredictedSetSnapshot,
  formatRepRange,
  summarizeDraftSets,
  type ExerciseDraft,
  type ExerciseInsightState,
} from "../workout-logger.utils";

type WorkoutLoggerInsightPanelProps = {
  exercise: ExerciseDraft;
  insightState?: ExerciseInsightState;
  weightUnit: WeightUnit;
  weightUnitLabel: string;
};

export function WorkoutLoggerInsightPanel({
  exercise,
  insightState,
  weightUnit,
  weightUnitLabel,
}: WorkoutLoggerInsightPanelProps) {
  if (!insightState || insightState.status === "idle") {
    return null;
  }

  if (insightState.status === "loading") {
    return (
      <p className={styles.compareHint}>
        Comparing with previous sessions...
      </p>
    );
  }

  if (insightState.status === "error") {
    return (
      <p className={styles.compareHint}>
        Could not load comparison right now.
      </p>
    );
  }

  const insight = insightState.data;

  if (!insight || !insight.lastSession) {
    return (
      <p className={styles.compareHint}>
        No previous logs for this exercise yet.
      </p>
    );
  }

  const lastSession = insight.lastSession;
  const draftSummary = summarizeDraftSets(exercise);
  const lastVolume =
    convertStoredWeightToDisplay(lastSession.totalVolume, weightUnit) ?? 0;
  const allTimeBestWeight =
    insight.allTimeBestWeight === null
      ? null
      : (convertStoredWeightToDisplay(insight.allTimeBestWeight, weightUnit) ?? 0);
  const volumeDelta = draftSummary.totalVolume - lastVolume;
  const lastSessionBestWeightDisplay = lastSession.sets.reduce<number | null>(
    (max, set) => {
      if (set.weightLb === null) {
        return max;
      }

      const displayWeight =
        convertStoredWeightToDisplay(set.weightLb, weightUnit) ?? 0;

      if (max === null) {
        return displayWeight;
      }

      return Math.max(max, displayWeight);
    },
    null,
  );
  const draftBestWeight = draftSummary.bestWeight ?? 0;
  const bestWeightDelta =
    draftBestWeight - (lastSessionBestWeightDisplay ?? 0);
  const prediction = insight.prediction;
  const predictedAnchorSet = prediction?.predictedSets[0] ?? null;

  return (
    <section className={styles.compareCard}>
      <div className={styles.compareHead}>
        <p className={styles.compareMeta}>
          Last hit {formatExerciseInsightDate(lastSession.performedAt)}
        </p>
        {prediction ? (
          <p className={styles.compareMeta}>
            Based on {prediction.basedOnSessions} recent session
            {prediction.basedOnSessions === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <div className={styles.compareBody}>
        <div className={styles.compareGrid}>
          <div className={styles.compareItem}>
            <p className={styles.compareLabel}>Last session</p>
            <p className={styles.compareValue}>
              {lastSession.setCount} sets · {lastSession.totalReps} reps
            </p>
          </div>
          <div className={styles.compareItem}>
            <p className={styles.compareLabel}>All-time best</p>
            <p className={styles.compareValue}>
              {allTimeBestWeight !== null
                ? formatWeightWithUnit(allTimeBestWeight, weightUnit)
                : "--"}
            </p>
          </div>
        </div>

        <div className={styles.compareSnapshot}>
          <p className={styles.compareLabel}>Last session snapshot</p>
          <div className={styles.compareSetList}>
            {lastSession.sets.map((set, index) => (
              <div
                key={`${lastSession.workoutId}-set-${index}`}
                className={styles.compareSetRow}
              >
                <span className={styles.compareSetIndex}>#{index + 1}</span>
                <span className={styles.compareSetValue}>
                  {formatLoggedSetSnapshot(set, weightUnit)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {prediction && predictedAnchorSet ? (
        <section className={styles.predictionPanel}>
          <div className={styles.predictionSummary}>
            <div className={styles.compareItem}>
              <p className={styles.compareLabel}>Recommended target</p>
              <p className={styles.compareValue}>
                {formatPredictedSetSnapshot(predictedAnchorSet, weightUnit)}
              </p>
            </div>
            <div className={styles.compareItem}>
              <p className={styles.compareLabel}>Expected range</p>
              <p className={styles.compareValue}>
                {formatRepRange(predictedAnchorSet.repRange)}
              </p>
            </div>
            <div className={styles.compareItem}>
              <p className={styles.compareLabel}>Confidence</p>
              <p className={styles.compareValue}>
                {formatConfidenceLabel(prediction.confidence)}
              </p>
            </div>
          </div>

          <div className={styles.compareSnapshot}>
            <p className={styles.compareLabel}>Predicted set flow</p>
            <div className={styles.compareSetList}>
              {prediction.predictedSets.map((set) => (
                <div
                  key={`${exercise.id}-prediction-${set.setIndex}`}
                  className={styles.compareSetRow}
                >
                  <span className={styles.compareSetIndex}>#{set.setIndex}</span>
                  <span className={styles.compareSetValue}>
                    {formatPredictedSetSnapshot(set, weightUnit)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {draftSummary.setCount > 0 ? (
        <p className={styles.compareDelta}>
          Volume vs last: {formatDelta(volumeDelta, weightUnitLabel)} · Best vs
          last: {formatDelta(bestWeightDelta, weightUnitLabel)}
        </p>
      ) : null}
    </section>
  );
}
