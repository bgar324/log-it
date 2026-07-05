"use client";

import {
  ArrowUpDown,
  Clock,
  Loader2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  SkipForward,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePresence } from "@/app/hooks/use-presence";
import { styles } from "../workout-logger.styles";
import {
  REST_PRESETS_SECONDS,
  formatRestClock,
  formatRestPreset,
  useRestTimer,
} from "../_hooks/use-rest-timer";

const FAB_EXIT_MS = 300;

function popStyle(index: number, open: boolean, count: number) {
  return {
    animationDelay: open
      ? `${index * 40}ms`
      : `${(count - 1 - index) * 26}ms`,
  };
}

type WorkoutLoggerMobileActionsProps = {
  addExerciseLabel: string;
  formId: string;
  isSaving: boolean;
  reorderDisabled: boolean;
  submitLabel: string;
  canResetFromSplit?: boolean;
  resetDisabled?: boolean;
  onAddExercise: () => void;
  onOpenReorder: () => void;
  onResetFromSplit?: () => void;
};

export function WorkoutLoggerMobileActions({
  addExerciseLabel,
  formId,
  isSaving,
  reorderDisabled,
  submitLabel,
  canResetFromSplit = false,
  resetDisabled = false,
  onAddExercise,
  onOpenReorder,
  onResetFromSplit,
}: WorkoutLoggerMobileActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const timer = useRestTimer();
  const isControlsOpen = timer.isRunning && !isPresetsOpen;
  const stackMounted = usePresence(isOpen, FAB_EXIT_MS);
  const presetsMounted = usePresence(isPresetsOpen, FAB_EXIT_MS);
  const controlsMounted = usePresence(isControlsOpen, FAB_EXIT_MS);

  function handleAddExercise() {
    onAddExercise();
    setIsOpen(false);
  }

  function handleOpenReorder() {
    onOpenReorder();
    setIsOpen(false);
  }

  function handleOpenPresets() {
    setIsPresetsOpen(true);
    setIsOpen(false);
  }

  function handleOpenResetConfirm() {
    if (resetDisabled) {
      return;
    }

    setIsResetConfirmOpen(true);
    setIsOpen(false);
  }

  function handleConfirmReset() {
    onResetFromSplit?.();
    setIsResetConfirmOpen(false);
  }

  function handleStart(seconds: number) {
    timer.start(seconds);
    setIsPresetsOpen(false);
  }

  function handleMainButton() {
    if (isPresetsOpen) {
      setIsPresetsOpen(false);
      return;
    }

    setIsOpen((current) => !current);
  }

  if (!isMounted) {
    return null;
  }

  const isStackShowing = isOpen || isPresetsOpen;
  const showResetAction = Boolean(canResetFromSplit && onResetFromSplit);
  const stackCount = showResetAction ? 5 : 4;
  const presetCount = REST_PRESETS_SECONDS.length;
  const stackState = isOpen ? "open" : "closed";
  const presetState = isPresetsOpen ? "open" : "closed";
  const controlsState = isControlsOpen ? "open" : "closed";

  return createPortal(
    <>
    <div className={styles.mobileFabRoot}>
      {stackMounted ? (
        <div
          className={styles.mobileFabStack}
          data-state={stackState}
          aria-hidden={!isOpen}
        >
          <span
            className={styles.mobileFabPop}
            data-state={stackState}
            style={popStyle(0, isOpen, stackCount)}
          >
            <button
              type="submit"
              form={formId}
              className={styles.mobileFabAction}
              disabled={isSaving}
              tabIndex={isOpen ? 0 : -1}
              aria-label={submitLabel}
              title={submitLabel}
            >
              {isSaving ? (
                <Loader2 className={styles.mobileFabIconSpin} aria-hidden="true" strokeWidth={1.9} />
              ) : (
                <Save className={styles.mobileFabIcon} aria-hidden="true" strokeWidth={1.9} />
              )}
            </button>
          </span>
          <span
            className={styles.mobileFabPop}
            data-state={stackState}
            style={popStyle(1, isOpen, stackCount)}
          >
            <button
              type="button"
              className={styles.mobileFabAction}
              onClick={handleAddExercise}
              tabIndex={isOpen ? 0 : -1}
              aria-label={addExerciseLabel}
              title={addExerciseLabel}
            >
              <Plus className={styles.mobileFabIcon} aria-hidden="true" strokeWidth={1.9} />
            </button>
          </span>
          <span
            className={styles.mobileFabPop}
            data-state={stackState}
            style={popStyle(2, isOpen, stackCount)}
          >
            <button
              type="button"
              className={styles.mobileFabAction}
              disabled={reorderDisabled}
              onClick={handleOpenReorder}
              tabIndex={isOpen ? 0 : -1}
              aria-label="Reorder workout"
              title="Reorder workout"
            >
              <ArrowUpDown className={styles.mobileFabIcon} aria-hidden="true" strokeWidth={1.9} />
            </button>
          </span>
          <span
            className={styles.mobileFabPop}
            data-state={stackState}
            style={popStyle(3, isOpen, stackCount)}
          >
            <button
              type="button"
              className={styles.mobileFabAction}
              data-active={timer.isRunning}
              onClick={handleOpenPresets}
              tabIndex={isOpen ? 0 : -1}
              aria-label="Rest timer"
              title="Rest timer"
            >
              <Clock className={styles.mobileFabIcon} aria-hidden="true" strokeWidth={1.9} />
            </button>
          </span>
          {showResetAction ? (
            <span
              className={styles.mobileFabPop}
              data-state={stackState}
              style={popStyle(4, isOpen, stackCount)}
            >
              <button
                type="button"
                className={`${styles.mobileFabAction} ${styles.mobileFabActionDanger}`}
                disabled={resetDisabled}
                onClick={handleOpenResetConfirm}
                tabIndex={isOpen ? 0 : -1}
                aria-label="Reset exercises from your split"
                title="Reset exercises from your split"
              >
                <RotateCcw className={styles.mobileFabIcon} aria-hidden="true" strokeWidth={1.9} />
              </button>
            </span>
          ) : null}
        </div>
      ) : null}

      {presetsMounted ? (
        <div
          className={styles.mobileFabTimerBar}
          data-state={presetState}
          aria-hidden={!isPresetsOpen}
          aria-label="Rest interval"
        >
          {REST_PRESETS_SECONDS.map((seconds, index) => (
            <span
              key={seconds}
              className={styles.mobileFabPop}
              data-state={presetState}
              style={popStyle(index, isPresetsOpen, presetCount)}
            >
              <button
                type="button"
                className={styles.mobileFabAction}
                onClick={() => handleStart(seconds)}
                tabIndex={isPresetsOpen ? 0 : -1}
                aria-label={`Rest ${formatRestPreset(seconds)}`}
              >
                <span className={styles.mobileFabCountdown}>{formatRestPreset(seconds)}</span>
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {controlsMounted ? (
        <div
          className={styles.mobileFabTimerBar}
          data-state={controlsState}
          aria-hidden={!isControlsOpen}
          aria-label="Rest controls"
        >
          <span
            className={styles.mobileFabPop}
            data-state={controlsState}
            style={popStyle(0, isControlsOpen, 3)}
          >
            <button
              type="button"
              className={styles.mobileFabAction}
              onClick={() => timer.addSeconds(30)}
              tabIndex={isControlsOpen ? 0 : -1}
              aria-label="Add 30 seconds"
            >
              <span className={styles.mobileFabCountdown}>+30</span>
            </button>
          </span>
          <span
            className={styles.mobileFabPop}
            data-state={controlsState}
            style={popStyle(1, isControlsOpen, 3)}
          >
            <button
              type="button"
              className={styles.mobileFabAction}
              onClick={timer.togglePause}
              tabIndex={isControlsOpen ? 0 : -1}
              aria-label={timer.isPaused ? "Resume rest" : "Pause rest"}
            >
              {timer.isPaused ? (
                <Play className={styles.mobileFabIcon} aria-hidden="true" strokeWidth={1.9} />
              ) : (
                <Pause className={styles.mobileFabIcon} aria-hidden="true" strokeWidth={1.9} />
              )}
            </button>
          </span>
          <span
            className={styles.mobileFabPop}
            data-state={controlsState}
            style={popStyle(2, isControlsOpen, 3)}
          >
            <button
              type="button"
              className={styles.mobileFabAction}
              onClick={timer.stop}
              tabIndex={isControlsOpen ? 0 : -1}
              aria-label="Skip rest"
            >
              <SkipForward className={styles.mobileFabIcon} aria-hidden="true" strokeWidth={1.9} />
            </button>
          </span>
        </div>
      ) : null}

      <button
        type="button"
        className={styles.mobileFabButton}
        data-open={isStackShowing}
        data-running={timer.isRunning}
        onClick={handleMainButton}
        aria-expanded={isStackShowing}
        aria-label={isStackShowing ? "Close workout actions" : "Open workout actions"}
      >
        {timer.isRunning && !isStackShowing ? (
          <span className={styles.mobileFabCountdown}>
            {formatRestClock(timer.remaining ?? 0)}
          </span>
        ) : (
          <Plus
            className={`${styles.mobileFabMainIcon} transition-transform duration-200 ${
              isStackShowing ? "rotate-45" : "rotate-0"
            }`}
            aria-hidden="true"
            strokeWidth={2}
          />
        )}
      </button>
    </div>

    {isResetConfirmOpen ? (
      <div
        className={styles.confirmOverlay}
        onClick={() => setIsResetConfirmOpen(false)}
      >
        <div
          role="alertdialog"
          aria-modal="true"
          className={styles.confirmDialog}
          onClick={(event) => event.stopPropagation()}
        >
          <h2 className={styles.confirmTitle}>Replace the current exercises?</h2>
          <p className={styles.confirmBody}>
            This will replace every current exercise and set in this logger with the
            exercises and set counts from your split for today.
          </p>
          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.confirmSecondaryButton}
              onClick={() => setIsResetConfirmOpen(false)}
            >
              Keep current log
            </button>
            <button
              type="button"
              className={styles.confirmPrimaryButton}
              onClick={handleConfirmReset}
              disabled={resetDisabled}
            >
              Reset to split
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>,
    document.body,
  );
}
