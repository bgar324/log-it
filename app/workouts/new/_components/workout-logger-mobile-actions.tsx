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
import { styles } from "../workout-logger.styles";
import {
  REST_PRESETS_SECONDS,
  formatRestClock,
  formatRestPreset,
  useRestTimer,
} from "../_hooks/use-rest-timer";

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
  const stackItemStyle = (index: number) => ({
    transitionDelay: isOpen
      ? `${index * 45}ms`
      : `${(stackCount - 1 - index) * 30}ms`,
  });

  return createPortal(
    <>
    <div className={styles.mobileFabRoot}>
      <div
        className={styles.mobileFabStack}
        data-open={isOpen}
        aria-hidden={!isOpen}
      >
        <span
          className={styles.mobileFabStackItem}
          data-open={isOpen}
          style={stackItemStyle(0)}
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
          className={styles.mobileFabStackItem}
          data-open={isOpen}
          style={stackItemStyle(1)}
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
          className={styles.mobileFabStackItem}
          data-open={isOpen}
          style={stackItemStyle(2)}
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
          className={styles.mobileFabStackItem}
          data-open={isOpen}
          style={stackItemStyle(3)}
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
            className={styles.mobileFabStackItem}
            data-open={isOpen}
            style={stackItemStyle(4)}
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

      <div
        className={styles.mobileFabTimerBar}
        data-open={isPresetsOpen}
        aria-hidden={!isPresetsOpen}
        aria-label="Rest interval"
      >
        {REST_PRESETS_SECONDS.map((seconds) => (
          <button
            key={seconds}
            type="button"
            className={styles.mobileFabAction}
            onClick={() => handleStart(seconds)}
            tabIndex={isPresetsOpen ? 0 : -1}
            aria-label={`Rest ${formatRestPreset(seconds)}`}
          >
            <span className={styles.mobileFabCountdown}>{formatRestPreset(seconds)}</span>
          </button>
        ))}
      </div>

      <div
        className={styles.mobileFabTimerBar}
        data-open={timer.isRunning && !isPresetsOpen}
        aria-hidden={!timer.isRunning || isPresetsOpen}
        aria-label="Rest controls"
      >
        <button
          type="button"
          className={styles.mobileFabAction}
          onClick={() => timer.addSeconds(30)}
          tabIndex={timer.isRunning && !isPresetsOpen ? 0 : -1}
          aria-label="Add 30 seconds"
        >
          <span className={styles.mobileFabCountdown}>+30</span>
        </button>
        <button
          type="button"
          className={styles.mobileFabAction}
          onClick={timer.togglePause}
          tabIndex={timer.isRunning && !isPresetsOpen ? 0 : -1}
          aria-label={timer.isPaused ? "Resume rest" : "Pause rest"}
        >
          {timer.isPaused ? (
            <Play className={styles.mobileFabIcon} aria-hidden="true" strokeWidth={1.9} />
          ) : (
            <Pause className={styles.mobileFabIcon} aria-hidden="true" strokeWidth={1.9} />
          )}
        </button>
        <button
          type="button"
          className={styles.mobileFabAction}
          onClick={timer.stop}
          tabIndex={timer.isRunning && !isPresetsOpen ? 0 : -1}
          aria-label="Skip rest"
        >
          <SkipForward className={styles.mobileFabIcon} aria-hidden="true" strokeWidth={1.9} />
        </button>
      </div>

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
