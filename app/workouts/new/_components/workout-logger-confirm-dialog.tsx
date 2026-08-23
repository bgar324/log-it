"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { styles } from "../workout-logger.styles";

type WorkoutLoggerConfirmDialogProps = {
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function WorkoutLoggerConfirmDialog({
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: WorkoutLoggerConfirmDialogProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={styles.confirmOverlay} onClick={onCancel}>
      <div
        className={styles.confirmDialog}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className={styles.confirmTitle}>
          {title}
        </h2>
        <p className={styles.confirmBody}>
          {description}
        </p>
        <div className={styles.confirmActions}>
          <button
            type="button"
            className={styles.confirmSecondaryButton}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={styles.confirmPrimaryButton}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
