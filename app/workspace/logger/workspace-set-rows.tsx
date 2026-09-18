"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/workspace-ui/alert-dialog";
import { Button } from "@/app/components/workspace-ui/button";
import { Input } from "@/app/components/workspace-ui/input";
import type { WeightUnit } from "@/lib/weight-unit";
import {
  formatLoggedSetSnapshot,
  formatPredictedWeightPlaceholder,
  sanitizeDurationInput,
  sanitizeRepsInput,
  sanitizeWeightInput,
  type ExerciseDraft,
  type ExerciseInsightState,
  type ExerciseSetDraft,
} from "@/app/workouts/new/workout-logger.utils";

export type WorkspaceSetRowsProps = {
  exercise: ExerciseDraft;
  insightState?: ExerciseInsightState;
  weightUnit: WeightUnit;
  weightUnitLabel: string;
  bodyWeightDisplay: number | null;
  showOptionalSetControls: boolean;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: <K extends keyof ExerciseSetDraft>(
    setId: string,
    field: K,
    value: ExerciseSetDraft[K],
  ) => void;
};

type PendingSetRemoval = {
  setId: string;
  setNumber: number;
};

// Column labels are written once above the rows instead of on every field, so
// a ten-set exercise reads as a table rather than forty repeated words. The
// inputs keep their own `aria-label`, so the visual header is decoration.
// Height and text size stay with the shared control styles, which is where
// the phone minimums live.
const setInput = "tabular-nums";

export function WorkspaceSetRows({
  exercise,
  insightState,
  weightUnit,
  weightUnitLabel,
  bodyWeightDisplay,
  showOptionalSetControls,
  onRemoveSet,
  onUpdateSet,
}: WorkspaceSetRowsProps) {
  const [pendingRemoval, setPendingRemoval] =
    useState<PendingSetRemoval | null>(null);
  // The dialog's open state is separate from what it describes: clearing the
  // pending set on close would empty the dialog while it is still animating
  // out.
  const [isRemovalOpen, setIsRemovalOpen] = useState(false);

  const bodyWeightLabel =
    bodyWeightDisplay === null ? null : `${Number(bodyWeightDisplay.toFixed(1))}`;
  const insight = insightState?.data;
  const lastSets = insight?.lastSession?.sets ?? [];
  const predictedSets = insight?.prediction?.predictedSets ?? [];
  // Reserve the history line while the comparison is in flight, and keep it
  // once there is history to show, so the inputs never move under a thumb.
  const showHistoryLine =
    insightState?.status === "loading" || Boolean(insight?.lastSession);
  const canRemoveSet = exercise.sets.length > 1;
  const rowGrid = showOptionalSetControls
    ? "grid grid-cols-[1.25rem_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-1.5"
    : "grid grid-cols-[1.25rem_minmax(0,1.4fr)_minmax(0,1fr)_2.25rem] items-center gap-2";

  return (
    <div className="flex flex-col">
      <div
        className={`${rowGrid} pb-1 text-xs text-muted-foreground`}
        aria-hidden="true"
      >
        <span>#</span>
        <span>Weight ({weightUnitLabel})</span>
        <span>Reps</span>
        {showOptionalSetControls ? <span>Time</span> : null}
        <span />
      </div>

      <ol className="flex flex-col">
        {exercise.sets.map((setItem, setIndex) => {
          const isBodyweight = setItem.usesBodyweight;
          const bodyweightPlaceholder = bodyWeightLabel
            ? `BW (${bodyWeightLabel})`
            : "BW";
          const lastSet = lastSets[setIndex];
          const predictedSet = predictedSets[setIndex];
          const weightPlaceholder =
            predictedSet && predictedSet.weightLb !== null
              ? formatPredictedWeightPlaceholder(
                  predictedSet.weightLb,
                  weightUnit,
                )
              : weightUnitLabel;
          const repsPlaceholder =
            predictedSet && predictedSet.reps !== null
              ? `${predictedSet.reps}`
              : "Reps";

          return (
            <li
              key={setItem.id}
              className="border-t border-border/60 py-1.5 first:border-t-0"
            >
              <div className={rowGrid}>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {setIndex + 1}
                </span>

                <div className="relative">
                  <Input
                    id={`${exercise.id}-${setItem.id}-weight`}
                    aria-label={`Set ${setIndex + 1} weight in ${weightUnitLabel}`}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="next"
                    className={`${setInput} ${showOptionalSetControls ? "pr-11" : ""}`}
                    placeholder={
                      isBodyweight ? bodyweightPlaceholder : weightPlaceholder
                    }
                    value={setItem.weightLb}
                    disabled={showOptionalSetControls && isBodyweight}
                    onChange={event => {
                      onUpdateSet(setItem.id, "usesBodyweight", false);
                      onUpdateSet(
                        setItem.id,
                        "weightLb",
                        sanitizeWeightInput(event.target.value),
                      );
                    }}
                  />
                  {showOptionalSetControls ? (
                    // The toggle sits in an absolutely positioned wrapper, not
                    // on the button itself: the button's own press transform
                    // would otherwise replace the centering one.
                    <span className="absolute top-1/2 right-1 -translate-y-1/2">
                      <Button
                        type="button"
                        variant={isBodyweight ? "secondary" : "ghost"}
                        size="xs"
                        aria-label={`Set ${setIndex + 1} bodyweight`}
                        aria-pressed={isBodyweight}
                        onClick={() => {
                          if (isBodyweight) {
                            onUpdateSet(setItem.id, "usesBodyweight", false);
                            return;
                          }

                          onUpdateSet(setItem.id, "weightLb", "");
                          onUpdateSet(setItem.id, "usesBodyweight", true);
                        }}
                      >
                        BW
                      </Button>
                    </span>
                  ) : null}
                </div>

                <Input
                  id={`${exercise.id}-${setItem.id}-reps`}
                  aria-label={`Set ${setIndex + 1} reps`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="done"
                  className={setInput}
                  placeholder={repsPlaceholder}
                  value={setItem.reps}
                  onChange={event =>
                    onUpdateSet(
                      setItem.id,
                      "reps",
                      sanitizeRepsInput(event.target.value),
                    )
                  }
                />

                {showOptionalSetControls ? (
                  <Input
                    id={`${exercise.id}-${setItem.id}-duration`}
                    aria-label={`Set ${setIndex + 1} time in seconds`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="done"
                    className={setInput}
                    placeholder="Sec"
                    value={setItem.durationSeconds}
                    onChange={event =>
                      onUpdateSet(
                        setItem.id,
                        "durationSeconds",
                        sanitizeDurationInput(event.target.value),
                      )
                    }
                  />
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="justify-self-end text-muted-foreground"
                  aria-label={`Delete set ${setIndex + 1}`}
                  disabled={!canRemoveSet}
                  onClick={() => {
                    setPendingRemoval({
                      setId: setItem.id,
                      setNumber: setIndex + 1,
                    });
                    setIsRemovalOpen(true);
                  }}
                >
                  <Trash2 />
                </Button>
              </div>

              {showHistoryLine ? (
                <p className="min-h-4 pl-[1.75rem] text-xs text-muted-foreground">
                  {lastSet
                    ? `Last time: ${formatLoggedSetSnapshot(lastSet, weightUnit)}`
                    : ""}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      <AlertDialog
        open={isRemovalOpen}
        onOpenChange={nextOpen => {
          if (!nextOpen) {
            setIsRemovalOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {`Delete set ${pendingRemoval?.setNumber ?? 1}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the reps, weight, and time entered for this set.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep set</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingRemoval) {
                  onRemoveSet(pendingRemoval.setId);
                }

                setIsRemovalOpen(false);
              }}
            >
              Delete set
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
