"use client";

import { useEffect, useState, type RefObject } from "react";

/** Retain a closing surface until its actual motion finishes, not a second timer. */
export function usePresence(open: boolean, motionRef: RefObject<HTMLElement | null>) {
  const [present, setPresent] = useState(open);

  if (open && !present) {
    setPresent(true);
  }

  useEffect(() => {
    if (open || !present) return;

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      const animations = motionRef.current?.getAnimations() ?? [];
      void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
        if (!cancelled) setPresent(false);
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [open, present, motionRef]);

  return present;
}
