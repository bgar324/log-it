"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { splitStyles } from "./split-system.styles";

type SplitConfirmDialogProps = {
  titleId: string;
  descriptionId: string;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function SplitConfirmDialog({
  titleId,
  descriptionId,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: SplitConfirmDialogProps) {
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
    <div className={splitStyles.splitDialogOverlay} onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={splitStyles.splitDialog}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className={splitStyles.splitDialogTitle}>
          {title}
        </h2>
        <p id={descriptionId} className={splitStyles.splitDialogBody}>
          {description}
        </p>
        <div className={splitStyles.splitDialogActions}>
          <button
            ref={cancelButtonRef}
            type="button"
            className={splitStyles.splitDialogSecondaryButton}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={splitStyles.splitDialogDangerButton}
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
