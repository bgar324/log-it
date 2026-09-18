"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { Fragment, useRef, useState, type ReactNode } from "react";
import { useDisclosureKeyboard } from "@/app/hooks/use-disclosure-keyboard";

type LegacyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible name. Panels keep their own visible heading markup. */
  title: string;
  /** Accessible description for panels whose purpose is not already in view. */
  description?: string;
  overlayClassName: string;
  contentClassName: string;
  /** While true the dialog refuses every dismissal: a request is in flight. */
  busy?: boolean;
  children: ReactNode;
};

// Shared presence/dismissal without automatic focus transfer, which can close
// the phone keyboard. Nesting preserves each existing overlay's layout.
export function LegacyDialog({
  open,
  onOpenChange,
  title,
  description,
  overlayClassName,
  contentClassName,
  busy = false,
  children,
}: LegacyDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState({ open, id: 0 });
  if (session.open !== open) {
    setSession({ open, id: session.id + (open ? 1 : 0) });
  }
  useDisclosureKeyboard(open, contentRef);

  function handleOpenChange(next: boolean) {
    // A busy dialog owns an in-flight request; dropping it mid-flight is how
    // the old dialogs raced their own results.
    if (busy && !next) {
      return;
    }

    onOpenChange(next);
  }

  function preventFocusMove(event: Event) {
    event.preventDefault();
  }

  function rejectDismissWhileBusy(event: Event) {
    if (busy) {
      event.preventDefault();
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        {/* `inert` while closing: Radix pins the overlay to pointer-events:auto
            inline, which outranks the closed-state CSS, so the outgoing panel
            would still take clicks and keystrokes during its exit. */}
        <DialogPrimitive.Overlay
          className={`auth-dialog-overlay ${overlayClassName}`}
          inert={!open}
        >
          <DialogPrimitive.Content
            ref={contentRef}
            className={`auth-dialog-content ${contentClassName}`}
            {...(description ? {} : { "aria-describedby": undefined })}
            onOpenAutoFocus={preventFocusMove}
            onCloseAutoFocus={preventFocusMove}
            onEscapeKeyDown={rejectDismissWhileBusy}
            onInteractOutside={rejectDismissWhileBusy}
          >
            <DialogPrimitive.Title className="sr-only">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="sr-only">
                {description}
              </DialogPrimitive.Description>
            ) : null}
            <Fragment key={session.id}>{children}</Fragment>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
