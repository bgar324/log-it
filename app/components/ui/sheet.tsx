"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { buttonVariants, sheetStyles } from "./controls.styles";

export type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the dialog: rendered as the heading and used as its accessible name. */
  title: string;
  description?: string;
  children: ReactNode;
  /** Pinned below the scrolling body — the sheet's own actions live here. */
  footer?: ReactNode;
  /**
   * Blocks Escape, outside press and focus-out while something inside the sheet
   * owns those gestures. The visible close button still closes. Used while a
   * drag is in flight, so the first Escape cancels the drag instead of throwing
   * the whole sheet away.
   */
  disableDismiss?: boolean;
};

/**
 * One overlay for the whole focused logger: a bottom sheet on a phone, a
 * centred dialog from 620px up.
 *
 * Built on Base UI's `Dialog` rather than its `Drawer` on purpose. A drawer
 * adds swipe-to-dismiss, and every gesture it claims is a gesture the sortable
 * list inside the sheet cannot have — a vertical drag on a row would be read
 * as a dismissal. Dialog claims no gestures, so drag-to-reorder keeps the
 * whole surface, and dismissal stays explicit: the close button, the backdrop,
 * or Escape.
 *
 * Base UI owns the modal parts: focus trap, page-scroll lock, `aria-modal`,
 * `aria-labelledby`/`aria-describedby` wiring, and unmount after the closing
 * transition. Nothing here re-implements them.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  disableDismiss = false,
}: SheetProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen, details) => {
        if (!nextOpen && disableDismiss && details.reason !== "close-press") {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={sheetStyles.backdrop} />
        <Dialog.Viewport className={sheetStyles.viewport}>
          <Dialog.Popup
            className={sheetStyles.popup}
            onKeyDown={event => {
              // dnd-kit's keyboard sensor listens on document. Base UI's
              // composite-key and Escape handlers must not consume its events.
              if (disableDismiss) event.preventBaseUIHandler();
            }}
            // Controlled opens have no Dialog.Trigger to report a touch origin.
            // Never steal focus from the set input behind the sheet.
            initialFocus={false}
            finalFocus={false}
          >
            <header className={sheetStyles.header}>
              <div className={sheetStyles.headerText}>
                <Dialog.Title className={sheetStyles.title}>
                  {title}
                </Dialog.Title>
                {description ? (
                  <Dialog.Description className={sheetStyles.description}>
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
              <Dialog.Close aria-label="Close" className={buttonVariants.icon}>
                <X className={sheetStyles.closeIcon} strokeWidth={1.9} />
              </Dialog.Close>
            </header>

            <div
              className={footer ? sheetStyles.body : sheetStyles.bodySafeArea}
            >
              {children}
            </div>

            {footer ? <div className={sheetStyles.footer}>{footer}</div> : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
