"use client";

import { ArrowUpDown, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog";
import { Sheet } from "@/app/components/ui/sheet";
import {
  REST_PRESETS_SECONDS,
  formatRestPreset,
  type RestTimer,
} from "../_hooks/use-rest-timer";
import { styles } from "../workout-logger.styles";
import {
  WorkoutLoggerMetaCard,
  type WorkoutLoggerMetaCardProps,
} from "./workout-logger-meta-card";
import { FocusedRestStrip } from "./focused-rest-strip";
import focused from "./focused-workout-logger.module.css";

type FocusedToolsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metadata: WorkoutLoggerMetaCardProps;
  restTimer: RestTimer;
  canReorder: boolean;
  onOpenOrder: () => void;
  onResetFromSplit?: () => void;
  onDiscardDraft?: () => void;
};

/**
 * Everything that is not logging a set: the workout's own fields, the rest
 * timer, the exercise order, and the two ways to throw this log away. One
 * sheet, one level deep — the running clock and its controls are also in the
 * footer, so nothing you need between sets is only in here.
 */
export function FocusedToolsSheet({
  open,
  onOpenChange,
  metadata,
  restTimer,
  canReorder,
  onOpenOrder,
  onResetFromSplit,
  onDiscardDraft,
}: FocusedToolsSheetProps) {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} title="Tools">
        <div className={focused.sheetBody}>
          <section className={focused.sheetSection}>
            <p className={focused.sheetSectionTitle}>Workout</p>
            <WorkoutLoggerMetaCard {...metadata} variant="focused" />
          </section>

          <section className={focused.sheetSection}>
            <p className={focused.sheetSectionTitle}>Rest timer</p>
            <FocusedRestStrip restTimer={restTimer} />
            <div className={focused.sheetChips}>
              {REST_PRESETS_SECONDS.map((seconds) => (
                <Button
                  key={seconds}
                  type="button"
                  variant="outline"
                  onClick={() => restTimer.start(seconds)}
                >
                  {formatRestPreset(seconds)}
                </Button>
              ))}
            </div>
          </section>

          <section className={focused.sheetSection}>
            <p className={focused.sheetSectionTitle}>Exercises</p>
            <div className={focused.sheetRows}>
              <Button
                type="button"
                variant="quiet"
                className={focused.sheetRowButton}
                aria-label="Reorder exercises"
                disabled={!canReorder}
                onClick={() => {
                  onOpenChange(false);
                  onOpenOrder();
                }}
              >
                <ArrowUpDown className={styles.icon} strokeWidth={1.9} />
                Reorder exercises
              </Button>

              {onResetFromSplit ? (
                <Button
                  type="button"
                  variant="quiet"
                  className={focused.sheetRowButton}
                  onClick={() => setIsResetConfirmOpen(true)}
                >
                  <RotateCcw className={styles.icon} strokeWidth={1.9} />
                  Reset from split
                </Button>
              ) : null}

              {onDiscardDraft ? (
                <Button
                  type="button"
                  variant="quiet"
                  className={focused.sheetRowButton}
                  onClick={() => setIsDiscardConfirmOpen(true)}
                >
                  <Trash2 className={styles.icon} strokeWidth={1.9} />
                  Discard draft
                </Button>
              ) : null}
            </div>
          </section>
        </div>

      <ConfirmDialog
        open={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        title="Replace the current exercises?"
        description="This will replace every current exercise and set in this logger with the exercises and set counts from your split for today."
        cancelLabel="Keep current log"
        confirmLabel="Reset to split"
        destructive
        onConfirm={() => {
          onResetFromSplit?.();
          setIsResetConfirmOpen(false);
          onOpenChange(false);
        }}
      />

      <ConfirmDialog
        open={isDiscardConfirmOpen}
        onOpenChange={setIsDiscardConfirmOpen}
        title="Discard this draft?"
        description="This clears everything typed here and returns the logger to what was loaded for this day."
        cancelLabel="Keep draft"
        confirmLabel="Discard draft"
        destructive
        onConfirm={() => {
          onDiscardDraft?.();
          setIsDiscardConfirmOpen(false);
          onOpenChange(false);
        }}
      />
      </Sheet>
    </>
  );
}
