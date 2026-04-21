import { clamp, median, roundToTenth, standardDeviation } from "./prediction-math";
import { RECENCY_DECAY } from "./prediction-types";
import type { ConfidenceAssessment, ExercisePrediction } from "./prediction-types";

export function createRepRange(
  reps: number,
  confidence: ExercisePrediction["confidence"],
) {
  const spread = confidence === "low" ? 2 : 1;

  return {
    min: Math.max(1, reps - spread),
    max: Math.max(1, reps + spread),
  };
}

export function getRecencyWeights(count: number) {
  return Array.from({ length: count }, (_, index) => Math.exp(-RECENCY_DECAY * index));
}

function assessHistoryScore(sessionCount: number) {
  if (sessionCount >= 4) {
    return 1;
  }

  if (sessionCount === 3) {
    return 0.75;
  }

  if (sessionCount === 2) {
    return 0.55;
  }

  if (sessionCount === 1) {
    return 0.3;
  }

  return 0;
}

function assessConsistencyScore(anchorValues: number[], setCounts: number[]) {
  if (anchorValues.length <= 1) {
    return 0.35;
  }

  const meanValue =
    anchorValues.reduce((sum, value) => sum + value, 0) / anchorValues.length;
  const strengthVariation = meanValue > 0 ? standardDeviation(anchorValues) / meanValue : 1;
  const strengthScore = 1 - clamp(strengthVariation / 0.18, 0, 1);
  const medianSetCount = median(setCounts) ?? setCounts[0] ?? 1;
  const averageSetDrift =
    setCounts.reduce((sum, count) => sum + Math.abs(count - medianSetCount), 0) /
    setCounts.length;
  const setCountScore = 1 - clamp(averageSetDrift / 1.5, 0, 1);

  return clamp(strengthScore * 0.7 + setCountScore * 0.3, 0, 1);
}

function assessRecencyScore(daysSinceLastPerformed: number | null) {
  if (daysSinceLastPerformed === null) {
    return 0;
  }

  if (daysSinceLastPerformed <= 8) {
    return 1;
  }

  if (daysSinceLastPerformed <= 14) {
    return 0.85;
  }

  if (daysSinceLastPerformed <= 28) {
    return 0.6;
  }

  if (daysSinceLastPerformed <= 60) {
    return 0.35;
  }

  return 0.15;
}

function assessPositionScore(
  currentPosition: number,
  historicalMedianPosition: number | null,
) {
  if (historicalMedianPosition === null) {
    return 0.6;
  }

  const delta = Math.abs(currentPosition - historicalMedianPosition);
  return clamp(1 - 0.2 * delta, 0.2, 1);
}

export function scorePredictionConfidence(options: {
  sessionCount: number;
  anchorValues: number[];
  setCounts: number[];
  daysSinceLastPerformed: number | null;
  currentPosition: number;
  historicalMedianPosition: number | null;
  capAtMedium?: boolean;
}) {
  const historyScore = assessHistoryScore(options.sessionCount);
  const consistencyScore = assessConsistencyScore(options.anchorValues, options.setCounts);
  const recencyScore = assessRecencyScore(options.daysSinceLastPerformed);
  const positionScore = assessPositionScore(
    options.currentPosition,
    options.historicalMedianPosition,
  );
  const score = clamp(
    historyScore * 0.35 +
      consistencyScore * 0.3 +
      recencyScore * 0.2 +
      positionScore * 0.15,
    0,
    1,
  );

  let label: ExercisePrediction["confidence"];

  if (score >= 0.75) {
    label = "high";
  } else if (score >= 0.5) {
    label = "medium";
  } else {
    label = "low";
  }

  if (options.sessionCount <= 1) {
    label = "low";
  }

  if (options.capAtMedium && label === "high") {
    label = "medium";
  }

  return {
    score: roundToTenth(score),
    label,
  } satisfies ConfidenceAssessment;
}

export function buildPredictionRationale(options: {
  basedOnSessions: number;
  daysSinceLastPerformed: number | null;
  recoveryFactor: number;
  positionAdjustment: number;
  trendAdjustment: number;
}) {
  const lines = [
    `Based on ${options.basedOnSessions} recent session${
      options.basedOnSessions === 1 ? "" : "s"
    }`,
  ];

  if (options.positionAdjustment <= 0.985) {
    lines.push("slightly reduced because this exercise is later in the workout");
  } else if (options.positionAdjustment >= 1.015) {
    lines.push("slightly increased because this exercise is earlier in the workout");
  }

  if (options.recoveryFactor >= 0.995 && options.recoveryFactor <= 1.005) {
    lines.push("recovery window looks good");
  } else if (
    options.daysSinceLastPerformed !== null &&
    options.daysSinceLastPerformed <= 1
  ) {
    lines.push("slightly reduced because recovery is short");
  } else if (
    options.daysSinceLastPerformed !== null &&
    options.daysSinceLastPerformed > 14
  ) {
    lines.push("slightly reduced because the layoff is longer than usual");
  } else if (options.recoveryFactor < 0.995) {
    lines.push("recovery is a little off peak");
  }

  if (lines.length < 3) {
    if (options.trendAdjustment >= 1.015) {
      lines.push("recent performance has been nudging upward");
    } else if (options.trendAdjustment <= 0.985) {
      lines.push("recent performance has cooled slightly");
    } else {
      lines.push("recent performance looks steady");
    }
  }

  return lines.slice(0, 3);
}
