"use client";

import {
  ArrowLeft,
  ArrowUpDown,
  Ellipsis,
  Loader2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  SkipForward,
  Timer,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  REST_PRESETS_SECONDS,
  formatRestClock,
  formatRestPreset,
  useRestTimer,
} from "../_hooks/use-rest-timer";
import { styles } from "../workout-logger.styles";

const STAGGER_MS = 45;

type ToolsFabAction = {
  key: string;
  label: string;
  icon: typeof Plus;
  onClick?: () => void;
  submit?: boolean;
  primary?: boolean;
  disabled?: boolean;
  busy?: boolean;
  // Timer controls keep the dial open so you can add time or pause twice.
  keepOpen?: boolean;
};

type WorkoutLoggerToolsFabProps = {
  formId: string;
  submitLabel: string;
  isSaving: boolean;
  canReorder: boolean;
  canResetFromSplit: boolean;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onAddExercise: () => void;
  onReorder: () => void;
  onResetFromSplit: () => void;
};

/**
 * Every action this screen offers, revealed as a staggered column instead of a
 * panel. There is no sheet: the actions sit directly on a blurred page, so the
 * only thing in focus while the dial is open is the list of things you can do.
 *
 * The actions reveal bottom-up in sequence and retract in reverse, which reads
 * as one gesture rather than a menu appearing. Delays are inline because the
 * count varies with what the workout supports.
 */
export function WorkoutLoggerToolsFab({
  formId,
  submitLabel,
  isSaving,
  canReorder,
  canResetFromSplit,
  isOpen,
  onToggle,
  onAddExercise,
  onReorder,
  onResetFromSplit,
}: WorkoutLoggerToolsFabProps) {
  // Entering animates, leaving does not: the dial unmounts the moment it
  // closes. A staggered exit reads as the menu hesitating on the way out, which
  // is the opposite of what you want after committing to an action.
  //
  // The rows still mount in the closed state and flip to open on the next
  // frame — without that frame the browser has no start value to transition
  // from, so the stagger renders instantly and the animation is never seen.
  const [revealed, setRevealed] = useState(false);
  const [pane, setPane] = useState<"actions" | "timer">("actions");
  const timer = useRestTimer();

  // Reset during render, not in an effect. Closing unmounts immediately, so if
  // `revealed` were only cleared afterwards a fast reopen could mount the rows
  // while it was still true — they would render in their final state and skip
  // the intro. Adjusting state during render is React's sanctioned pattern for
  // exactly this and removes any dependence on when effects flush.
  if (!isOpen && revealed) {
    setRevealed(false);
  }

  // Reopening lands on the pane that matters: the timer's controls while a rest
  // is running, the workout's actions otherwise. Without this, pausing a rest
  // costs two taps.
  const restingPane = timer.isRunning ? "timer" : "actions";

  if (!isOpen && pane !== restingPane) {
    setPane(restingPane);
  }

  const state = revealed ? "open" : "closed";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => setRevealed(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onToggle(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onToggle]);

  // Two panes behind one trigger. The default pane is the workout's actions;
  // picking "Rest timer" swaps to the durations, and choosing one starts the
  // clock and closes the dial so the trigger itself becomes the timer.
  const timerActions: ToolsFabAction[] = timer.isRunning
    ? [
        { key: "skip", label: "Skip rest", icon: SkipForward, onClick: timer.stop },
        {
          key: "pause",
          label: timer.isPaused ? "Resume rest" : "Pause rest",
          icon: timer.isPaused ? Play : Pause,
          onClick: timer.togglePause,
          keepOpen: true,
        },
        {
          key: "add30",
          label: "Add 30 seconds",
          icon: Plus,
          onClick: () => timer.addSeconds(30),
          keepOpen: true,
        },
      ]
    : REST_PRESETS_SECONDS.map((seconds) => ({
        key: `preset-${seconds}`,
        label: `Rest ${formatRestPreset(seconds)}`,
        icon: Timer,
        onClick: () => timer.start(seconds),
      }));

  const actions: ToolsFabAction[] =
    pane === "timer"
      ? timerActions
      : [
          ...(canResetFromSplit
            ? [
                {
                  key: "reset",
                  label: "Reset from split",
                  icon: RotateCcw,
                  onClick: onResetFromSplit,
                  disabled: isSaving,
                },
              ]
            : []),
          ...(canReorder
            ? [
                {
                  key: "reorder",
                  label: "Reorder exercises",
                  icon: ArrowUpDown,
                  onClick: onReorder,
                },
              ]
            : []),
          {
            key: "timer",
            label: timer.isRunning ? "Rest timer" : "Start rest timer",
            icon: Timer,
            onClick: () => setPane("timer"),
            keepOpen: true,
          },
          {
            key: "add",
            label: "Add another exercise",
            icon: Plus,
            onClick: onAddExercise,
          },
          {
            key: "save",
            label: submitLabel,
            icon: Save,
            submit: true,
            primary: true,
            disabled: isSaving,
            busy: isSaving,
          },
        ];

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className={styles.fabScrim}
          data-state={state}
          onClick={() => onToggle(false)}
          tabIndex={-1}
        />
      ) : null}

      <div className={styles.fabDial}>
        {isOpen ? (
          <div className={styles.fabStack}>
            {actions.map((action, index) => {
              const Icon = action.busy ? Loader2 : action.icon;

              return (
                <button
                  key={action.key}
                  type={action.submit ? "submit" : "button"}
                  form={action.submit ? formId : undefined}
                  className={styles.fabAction}
                  data-state={state}
                  data-primary={action.primary ? "true" : undefined}
                  // Reveal runs up from the thumb, so the row nearest the
                  // trigger leads. Only the open direction needs a delay now
                  // that closing unmounts. Inline because the count varies.
                  style={{
                    transitionDelay: `${
                      (actions.length - 1 - index) * STAGGER_MS
                    }ms`,
                  }}
                  disabled={action.disabled}
                  onClick={() => {
                    action.onClick?.();

                    if (!action.keepOpen) {
                      onToggle(false);
                    }
                  }}
                >
                  <span className={styles.fabActionLabel}>{action.label}</span>
                  <span className={styles.fabActionIcon}>
                    <Icon
                      className={
                        action.busy ? styles.spinningIcon : styles.fabActionGlyph
                      }
                      strokeWidth={1.9}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* The trigger does three jobs. Closed with a rest running it IS the
            timer, showing the clock. Open in a sub-pane it steps back to the
            action list rather than dismissing everything — losing your place
            because you wanted out of the durations is the wrong default. Open
            on the action list, it closes. */}
        <button
          type="button"
          className={styles.fabTrigger}
          data-state={state}
          data-timing={timer.isRunning ? "true" : undefined}
          data-fab-trigger="true"
          onClick={() => {
            if (!isOpen) {
              onToggle(true);
              return;
            }

            if (pane !== "actions") {
              setPane("actions");
              return;
            }

            onToggle(false);
          }}
        >
          {isOpen ? (
            pane === "actions" ? (
              <X className={styles.fabTriggerIcon} strokeWidth={1.9} />
            ) : (
              <ArrowLeft className={styles.fabTriggerIcon} strokeWidth={1.9} />
            )
          ) : timer.isRunning ? (
            <span className={styles.fabTriggerClock}>
              {formatRestClock(timer.remaining ?? 0)}
            </span>
          ) : (
            <Ellipsis className={styles.fabTriggerIcon} strokeWidth={1.9} />
          )}
        </button>
      </div>
    </>
  );
}
