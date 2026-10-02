"use client";

import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import { useReducedMotion } from "./use-reduced-motion";

/** Capture before a keyed row move; animate the committed order, never defer it. */
export function useReorderMotion(ref: RefObject<HTMLDivElement | null>, orderKey: string) {
  const previous = useRef<Map<string, DOMRect> | null>(null);
  const animations = useRef<Animation[]>([]);
  const reducedMotion = useReducedMotion();

  const capture = useCallback(() => {
    previous.current = new Map();
    for (const child of ref.current?.querySelectorAll<HTMLElement>("[data-motion-id]") ?? []) {
      if (child.dataset.motionId) {
        previous.current.set(child.dataset.motionId, child.getBoundingClientRect());
      }
    }
  }, [ref]);

  useLayoutEffect(() => {
    for (const animation of animations.current) animation.cancel();
    animations.current = [];
    const before = previous.current;
    previous.current = null;
    if (reducedMotion || !before || !ref.current || typeof Element.prototype.animate !== "function") return;
    const style = getComputedStyle(ref.current);
    // Production CSS can minify 250ms to .25s; WAAPI always expects milliseconds.
    const cssDuration = style.getPropertyValue("--ui-motion-enter").trim();
    const duration = Number.parseFloat(cssDuration) * (cssDuration.endsWith("ms") ? 1 : 1000);
    const easing = style.getPropertyValue("--ui-motion-ease").trim();
    const moves: { element: HTMLElement; x: number; y: number }[] = [];
    for (const child of ref.current.querySelectorAll<HTMLElement>("[data-motion-id]")) {
      const old = before.get(child.dataset.motionId ?? "");
      if (!old) continue;
      const next = child.getBoundingClientRect();
      if (old.left !== next.left || old.top !== next.top) {
        moves.push({ element: child, x: old.left - next.left, y: old.top - next.top });
      }
    }
    for (const { element, x, y } of moves) {
      animations.current.push(element.animate([
        { transform: `translate(${x}px, ${y}px)` },
        { transform: "translate(0, 0)" },
      ], { duration, easing }));
    }
    return () => {
      for (const animation of animations.current) animation.cancel();
      animations.current = [];
    };
  }, [ref, orderKey, reducedMotion]);

  return capture;
}
