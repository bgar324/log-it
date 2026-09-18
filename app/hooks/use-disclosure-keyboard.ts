"use client";

import { useEffect, type RefObject } from "react";

// Opening never transfers focus. An explicit Tab enters the topmost disclosure
// instead of traversing the page behind its portal.
export function useDisclosureKeyboard(open: boolean, contentRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      const content = contentRef.current;
      if (event.key !== "Tab" || !content || content.getAttribute("role") !== "dialog" || content.contains(document.activeElement)) return;
      const topmost = Array.from(document.querySelectorAll(
        '.auth-dialog-content[data-state="open"], .auth-popover-content[role="dialog"][data-state="open"]',
      )).filter((element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden").at(-1);
      if (topmost !== content) return;

      const controls = Array.from(content.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden" && !element.closest("[inert]"));
      const destination = event.shiftKey ? controls.at(-1) : controls[0];
      event.preventDefault();
      (destination ?? content).focus({ preventScroll: true });
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, contentRef]);
}
