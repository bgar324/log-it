import type { AnchorSet, PredictionSession, PredictionSessionSet } from "./prediction-types";

export function computeSetStrength(weightLb: number, reps: number) {
  return weightLb * (1 + Math.min(reps, 12) / 30);
}

export function findAnchorSet(session: Pick<PredictionSession, "sets">) {
  const weightedSets = session.sets
    .filter(
      (set): set is PredictionSessionSet & { weightLb: number } =>
        set.weightLb !== null && Number.isFinite(set.weightLb) && set.weightLb > 0,
    )
    .map((set) => ({
      setIndex: set.setIndex,
      reps: set.reps,
      weightLb: set.weightLb,
      strength: computeSetStrength(set.weightLb, set.reps),
      kind: "weighted" as const,
    }));

  if (weightedSets.length > 0) {
    return weightedSets.reduce((best, current) => {
      if (current.strength > best.strength) {
        return current;
      }

      if (current.strength === best.strength && current.setIndex < best.setIndex) {
        return current;
      }

      return best;
    });
  }

  if (session.sets.length === 0) {
    return null;
  }

  return session.sets.reduce<AnchorSet>(
    (best, current) => {
      if (current.reps > best.reps) {
        return {
          setIndex: current.setIndex,
          reps: current.reps,
          weightLb: null,
          strength: current.reps,
          kind: "bodyweight",
        };
      }

      if (current.reps === best.reps && current.setIndex < best.setIndex) {
        return {
          setIndex: current.setIndex,
          reps: current.reps,
          weightLb: null,
          strength: current.reps,
          kind: "bodyweight",
        };
      }

      return best;
    },
    {
      setIndex: session.sets[0]?.setIndex ?? 1,
      reps: session.sets[0]?.reps ?? 0,
      weightLb: null,
      strength: session.sets[0]?.reps ?? 0,
      kind: "bodyweight",
    },
  );
}
