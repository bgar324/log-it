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

const STAGGER_MS = 35;
// The arc runs from "left and a little up" to "straight up": it stays inside
// the phone's left edge, clears the caption on the trigger's own baseline, and
// never reaches past the trigger toward the right edge.
const FAN_START_DEG = 165;
const FAN_END_DEG = 90;
// 3.25rem circles with real space between them, so neighbouring targets cannot
// be hit by accident however many actions the workout supports.
const FAN_ACTION_DIAMETER_PX = 52;
const FAN_ACTION_CLEARANCE_PX = 10;
const FAN_MIN_RADIUS_PX = 168;

type ToolsFabAction = {
  key: string;
  label: string;
  icon: typeof Plus;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
  busy?: boolean;
  // Timer controls keep the fan open so you can add time or pause twice.
  keepOpen?: boolean;
};

type WorkoutLoggerToolsFabProps = {
  onSave: () => void;
  submitLabel: string;
  isSaving: boolean;
  canReorder: boolean;
  canResetFromSplit: boolean;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onAddExercise: () => void;
  onReorder: () => void;
  onResetFromSplit: () => void;
  /** The rest timer is part of the optional set controls, not the personal interface. */
  showRestTimer?: boolean;
};

/**
 * Every action this screen offers, fanned out of the trigger on an arc instead
 * of stacked into a ladder. There is no sheet: the actions sit directly on a
 * blurred page, so the only thing in focus while the fan is open is the list of
 * things you can do.
 *
 * Save is the far end of the arc and the only filled circle — distinguishable
 * once the fan is open, and never under the finger that opened it. Reveal runs
 * outward from the thumb and retraction is instant, which reads as one gesture
 * rather than a menu that hesitates on the way out.
 */
export function WorkoutLoggerToolsFab({
  onSave,
  submitLabel,
  isSaving,
  canReorder,
  canResetFromSplit,
  isOpen,
  onToggle,
  onAddExercise,
  onReorder,
  onResetFromSplit,
  showRestTimer = true,
}: WorkoutLoggerToolsFabProps) {
  // Entering animates, leaving does not: the fan unmounts the moment it closes.
  //
  // The circles still mount in the closed state and flip to open on the next
  // frame — without that frame the browser has no start value to transition
  // from, so the stagger renders instantly and the animation is never seen.
  const [revealed, setRevealed] = useState(false);
  const [pane, setPane] = useState<"actions" | "timer">("actions");
  const [captionKey, setCaptionKey] = useState<string | null>(null);
  const timer = useRestTimer();

  // Reset during render, not in an effect. Closing unmounts immediately, so if
  // `revealed` were only cleared afterwards a fast reopen could mount the
  // circles while it was still true — they would render in their final state
  // and skip the intro. Adjusting state during render is React's sanctioned
  // pattern for exactly this and removes any dependence on effect timing.
  if (!isOpen && revealed) {
    setRevealed(false);
  }

  if (!isOpen && captionKey !== null) {
    setCaptionKey(null);
  }

  // Reopening lands on the pane that matters: the timer's controls while a rest
  // is running, the workout's actions otherwise. Without this, pausing a rest
  // costs two taps.
  const restingPane = timer.isRunning && showRestTimer ? "timer" : "actions";

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
  // clock and closes the fan so the trigger itself becomes the timer.
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
          ...(showRestTimer
            ? [
                {
                  key: "timer",
                  label: timer.isRunning ? "Rest timer" : "Start rest timer",
                  icon: Timer,
                  onClick: () => setPane("timer"),
                  keepOpen: true,
                },
              ]
            : []),
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
            onClick: onSave,
            primary: true,
            disabled: isSaving,
            busy: isSaving,
          },
        ];

  // Even spacing along the arc, with the radius widened when the count would
  // otherwise crowd the circles together. Geometry rather than a hand-tuned
  // table, because what the workout supports decides how many there are.
  const step =
    actions.length > 1 ? (FAN_END_DEG - FAN_START_DEG) / (actions.length - 1) : 0;
  const radius = Math.max(
    FAN_MIN_RADIUS_PX,
    actions.length > 1
      ? (FAN_ACTION_DIAMETER_PX + FAN_ACTION_CLEARANCE_PX) /
          (2 * Math.sin((Math.abs(step) * Math.PI) / 360))
      : 0,
  );

  const captionSource =
    actions.find((action) => action.key === captionKey) ?? null;
  const caption =
    captionSource?.label ?? (pane === "timer" ? "Rest timer" : "Workout tools");

  const triggerLabel = !isOpen
    ? timer.isRunning
      ? `Workout tools. Resting ${formatRestClock(timer.remaining ?? 0)}`
      : "Workout tools"
    : pane === "actions"
      ? "Close workout tools"
      : "Back to workout tools";

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className={styles.fanScrim}
          data-state={state}
          aria-label="Close workout tools"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => onToggle(false)}
          tabIndex={-1}
        />
      ) : null}

      <div className={styles.fanRoot}>
        {/* The trigger does three jobs. Closed with a rest running it IS the
            timer, showing the clock. Open in a sub-pane it steps back to the
            action list rather than dismissing everything — losing your place
            because you wanted out of the durations is the wrong default. Open
            on the action list, it closes. It also comes first in the DOM, so a
            keyboard reaches the fanned actions by tabbing forward from it. */}
        <button
          type="button"
          className={styles.fanTrigger}
          data-state={state}
          data-timing={timer.isRunning ? "true" : undefined}
          data-fab-trigger="true"
          aria-label={triggerLabel}
          aria-expanded={isOpen}
          onPointerDown={(event) => event.preventDefault()}
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
              <X className={styles.fanTriggerIcon} strokeWidth={1.9} />
            ) : (
              <ArrowLeft className={styles.fanTriggerIcon} strokeWidth={1.9} />
            )
          ) : timer.isRunning ? (
            <span className={styles.fanTriggerClock}>
              {formatRestClock(timer.remaining ?? 0)}
            </span>
          ) : (
            <Ellipsis className={styles.fanTriggerIcon} strokeWidth={1.9} />
          )}
        </button>

        {isOpen
          ? actions.map((action, index) => {
              const Icon = action.busy ? Loader2 : action.icon;
              const radians = ((FAN_START_DEG + index * step) * Math.PI) / 180;
              const offsetX = Math.cos(radians) * radius;
              const offsetY = -Math.sin(radians) * radius;

              return (
                <button
                  key={action.key}
                  // Never type="submit". Closing the fan unmounts this button
                  // during the click, and the browser skips the submit default
                  // action for a button that is no longer in the document, so
                  // Save silently did nothing. Save calls requestSubmit itself.
                  type="button"
                  className={styles.fanAction}
                  data-state={state}
                  data-primary={action.primary ? "true" : undefined}
                  title={action.label}
                  // The reveal sweeps along the arc, so the fan opens like a
                  // hand rather than appearing all at once — Save arrives last,
                  // at the far end. Transform and opacity only, and the circles
                  // are placed by transform, so nothing here can reflow.
                  style={{
                    transform:
                      state === "open"
                        ? `translate(${offsetX.toFixed(1)}px, ${offsetY.toFixed(1)}px)`
                        : "translate(0px, 0px) scale(0.55)",
                    transitionDelay: `${index * STAGGER_MS}ms`,
                  }}
                  disabled={action.disabled}
                  onPointerDown={(event) => event.preventDefault()}
                  onPointerEnter={() => setCaptionKey(action.key)}
                  onFocus={() => setCaptionKey(action.key)}
                  onClick={() => {
                    action.onClick?.();

                    if (!action.keepOpen) {
                      onToggle(false);
                    }
                  }}
                >
                  <span className="sr-only">{action.label}</span>
                  <Icon
                    className={
                      action.busy ? styles.spinningIcon : styles.fanActionGlyph
                    }
                    strokeWidth={1.9}
                  />
                </button>
              );
            })
          : null}

        {/* Names the circle the finger or the focus ring is on, on the
            trigger's own baseline where the eye already is. */}
        {isOpen ? (
          <div className={styles.fanCaption} data-state={state} aria-hidden="true">
            <span className={styles.fanCaptionText}>{caption}</span>
          </div>
        ) : null}
      </div>
    </>
  );
}
