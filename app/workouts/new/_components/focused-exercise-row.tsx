"use client";

import { ChevronRight } from "lucide-react";
import type { ExerciseSetDraft } from "../workout-logger.utils";
import focused from "./focused-workout-logger.module.css";

/** One set, written the way it was entered. No targets, no coaching. */
function formatEnteredSet(
  setItem: ExerciseSetDraft,
  weightUnitLabel: string,
) {
  const reps = setItem.reps.trim();
  const weight = setItem.usesBodyweight
    ? "BW"
    : setItem.weightLb.trim()
      ? `${setItem.weightLb.trim()} ${weightUnitLabel}`
      : "";
  const seconds = setItem.durationSeconds.trim();
  const load = weight && reps ? `${weight} × ${reps}` : weight || (reps ? `${reps} reps` : "");
  const time = seconds ? `${seconds}s` : "";

  return [load, time].filter(Boolean).join(" · ");
}

export function summarizeExerciseSets(
  sets: ExerciseSetDraft[],
  weightUnitLabel: string,
) {
  const entered = sets.filter(
    (setItem) =>
      setItem.usesBodyweight ||
      setItem.reps.trim() !== "" ||
      setItem.weightLb.trim() !== "" ||
      setItem.durationSeconds.trim() !== "",
  );
  const lastEntered = entered.at(-1);

  return {
    enteredCount: entered.length,
    // The most recent entry, because mid-workout the question is what you just
    // did, not what the heaviest set of the session was.
    summary: lastEntered ? formatEnteredSet(lastEntered, weightUnitLabel) : "",
  };
}

type FocusedExerciseRowProps = {
  exerciseId: string;
  title: string;
  sets: ExerciseSetDraft[];
  weightUnitLabel: string;
  onOpen: () => void;
};

/**
 * A closed exercise: name, what is entered under it, and how much of it is
 * filled in. Borderless, one hairline between rows, 52px tall so it is a
 * comfortable target with a thumb.
 */
export function FocusedExerciseRow({
  exerciseId,
  title,
  sets,
  weightUnitLabel,
  onOpen,
}: FocusedExerciseRowProps) {
  const { enteredCount, summary } = summarizeExerciseSets(sets, weightUnitLabel);
  const setsLabel = `${enteredCount} of ${sets.length} ${sets.length === 1 ? "set" : "sets"}`;

  return (
    <button
      type="button"
      className={focused.row}
      aria-expanded={false}
      aria-label={`Open ${title}`}
      data-exercise-switch={exerciseId}
      onClick={onOpen}
    >
      <span className={focused.rowMain}>
        <span className={focused.rowName}>{title}</span>
        {summary ? <span className={focused.rowMeta}>{summary}</span> : null}
      </span>
      <span className={focused.rowCount}>{setsLabel}</span>
      <ChevronRight className={focused.rowChevron} strokeWidth={1.9} />
    </button>
  );
}
