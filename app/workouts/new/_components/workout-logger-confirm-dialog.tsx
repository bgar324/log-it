"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { styles } from "../workout-logger.styles";

type WorkoutLoggerConfirmDialogProps = {
  titleId: string;
  descriptionId: string;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function WorkoutLoggerConfirmDialog({
  titleId,
  descriptionId,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: WorkoutLoggerConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={styles.confirmDialog}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className={styles.confirmTitle}>
          {title}
        </h2>
        <p id={descriptionId} className={styles.confirmBody}>
          {description}
        </p>
        <div className={styles.confirmActions}>
          <button
            ref={cancelButtonRef}
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
