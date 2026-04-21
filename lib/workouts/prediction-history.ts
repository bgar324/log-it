import { findAnchorSet } from "./prediction-anchor";
import { median } from "./prediction-math";
import type {
  AnchorSession,
  BackoffProfile,
  PredictionSession,
} from "./prediction-types";

export function getFallbackWeightRatio(offset: number) {
  if (offset <= 0) {
    return 1;
  }

  if (offset === 1) {
    return 0.97;
  }

  if (offset === 2) {
    return 0.94;
  }

  if (offset === 3) {
    return 0.92;
  }

  return Math.max(0.88, 0.92 - 0.02 * (offset - 3));
}

export function getFallbackRepDelta(offset: number) {
  if (offset <= 0) {
    return 0;
  }

  if (offset === 1) {
    return 0;
  }

  if (offset === 2) {
    return -1;
  }

  if (offset === 3) {
    return -2;
  }

  return -(offset - 1);
}

export function getAnchorSessions(sessions: PredictionSession[]) {
  return sessions
    .map((session) => {
      const anchor = findAnchorSet(session);

      if (!anchor) {
        return null;
      }

      return { session, anchor } satisfies AnchorSession;
    })
    .filter((item): item is AnchorSession => item !== null);
}

export function sortSessionsByDateDescending(sessions: PredictionSession[]) {
  return [...sessions].sort((left, right) => {
    const timeDifference = right.performedAt.getTime() - left.performedAt.getTime();

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return right.workoutId.localeCompare(left.workoutId);
  });
}

export function buildBackoffProfile(anchorSessions: AnchorSession[]) {
  const buckets = new Map<
    number,
    {
      weightRatios: number[];
      repDeltas: number[];
    }
  >();

  for (const { session, anchor } of anchorSessions) {
    const anchorOffset = anchor.setIndex - 1;

    for (let currentIndex = anchorOffset + 1; currentIndex < session.sets.length; currentIndex += 1) {
      const set = session.sets[currentIndex];
      const offset = currentIndex - anchorOffset;

      if (!set || offset <= 0) {
        continue;
      }

      const bucket =
        buckets.get(offset) ??
        ({
          weightRatios: [],
          repDeltas: [],
        } satisfies {
          weightRatios: number[];
          repDeltas: number[];
        });

      if (
        anchor.weightLb !== null &&
        anchor.weightLb > 0 &&
        set.weightLb !== null &&
        set.weightLb > 0
      ) {
        bucket.weightRatios.push(set.weightLb / anchor.weightLb);
      }

      bucket.repDeltas.push(set.reps - anchor.reps);
      buckets.set(offset, bucket);
    }
  }

  const profile: BackoffProfile = new Map();

  for (const [offset, bucket] of buckets.entries()) {
    profile.set(offset, {
      weightRatio: median(bucket.weightRatios),
      repDelta: median(bucket.repDeltas),
    });
  }

  return profile;
}

export function getHistoricalMedianPosition(anchorSessions: AnchorSession[]) {
  const positions = anchorSessions
    .map(({ session }) => session.exerciseOrder)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isInteger(value) && value > 0,
    );

  return median(positions);
}
