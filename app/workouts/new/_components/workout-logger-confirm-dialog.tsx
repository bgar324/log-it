"use client";

import { LegacyDialog } from "@/app/components/ui/legacy-dialog";
import { styles } from "../workout-logger.styles";

type WorkoutLoggerConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function WorkoutLoggerConfirmDialog({
  open,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: WorkoutLoggerConfirmDialogProps) {
  return (
    <LegacyDialog
      open={open}
      onOpenChange={(next) => { if (!next) onCancel(); }}
      title={title}
      description={description}
      overlayClassName={styles.confirmOverlay}
      contentClassName={styles.confirmDialog}
    >
      <h2 className={styles.confirmTitle}>{title}</h2>
      <p className={styles.confirmBody}>{description}</p>
      <div className={styles.confirmActions}>
        <button type="button" className={styles.confirmSecondaryButton} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className={styles.confirmPrimaryButton} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </LegacyDialog>
  );
}
