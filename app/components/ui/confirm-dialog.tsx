"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { buttonVariants, confirmDialogStyles } from "./controls.styles";
import { cn } from "./helpers";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  /**
   * Runs on confirm. The dialog closes itself in the same interaction, so the
   * caller only has to do the work.
   */
  onConfirm: () => void;
  /** Paints the confirm action as destructive: colour, never a heavier border. */
  destructive?: boolean;
};

/**
 * A question that has to be answered: discarding a draft, deleting an
 * exercise, saving with sets left empty.
 *
 * Base UI's `AlertDialog` is the right primitive rather than `Dialog` because
 * it refuses to close on an outside press — a stray tap next to the popup must
 * not count as an answer — and it renders `role="alertdialog"`, so a screen
 * reader announces the question instead of just a container. Escape and the
 * cancel button both still mean "no".
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={confirmDialogStyles.backdrop} />
        <AlertDialog.Viewport className={confirmDialogStyles.viewport}>
          <AlertDialog.Popup
            className={confirmDialogStyles.popup}
            initialFocus={false}
            finalFocus={false}
          >
            <AlertDialog.Title className={confirmDialogStyles.title}>
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description
              className={confirmDialogStyles.description}
            >
              {description}
            </AlertDialog.Description>

            <div className={confirmDialogStyles.actions}>
              <AlertDialog.Close
                className={cn(
                  buttonVariants.outline,
                  confirmDialogStyles.action,
                )}
              >
                {cancelLabel}
              </AlertDialog.Close>
              <AlertDialog.Close
                className={cn(
                  destructive ? buttonVariants.danger : buttonVariants.filled,
                  confirmDialogStyles.action,
                )}
                onClick={onConfirm}
              >
                {confirmLabel}
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
