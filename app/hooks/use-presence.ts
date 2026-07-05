"use client";

import { useEffect, useState } from "react";

/**
 * Keeps a component mounted while it plays an exit animation.
 *
 * Returns `true` as soon as `open` becomes true, and stays `true` for
 * `exitMs` after `open` flips back to false so the element can animate out
 * before it unmounts. Pair with a `data-state="open" | "closed"` attribute
 * that drives the enter/exit keyframes.
 */
export function usePresence(open: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(open);

  // Adjust state during render (React's sanctioned pattern) so opening mounts
  // synchronously without an extra frame. The effect only schedules unmount.
  if (open && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    if (open) {
      return;
    }

    const timer = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(timer);
  }, [open, exitMs]);

  return mounted;
}
