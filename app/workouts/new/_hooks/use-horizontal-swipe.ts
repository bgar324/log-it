"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";

const SWIPE_DISTANCE_PX = 56;
// Horizontal has to clearly win, or a diagonal thumb-scroll would change what
// is on screen while the user was only trying to reach the last set.
const SWIPE_DOMINANCE = 1.6;
const SWIPE_TIMEOUT_MS = 900;
// Anything you can type in, press or drag owns its own gesture. A swipe is only
// ever read from the page's own background and headings.
const INTERACTIVE_SELECTOR =
  'input, textarea, select, button, a, [role="button"], [data-swipe-ignore="true"]';

type Gesture = { pointerId: number; x: number; y: number; startedAt: number };

// Callers reserve horizontal gestures only on noninteractive header/blank areas
// with touch-action: pan-y pinch-zoom. Numeric fields keep native touch behavior.
export function useHorizontalSwipe(options: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const gestureRef = useRef<Gesture | null>(null);

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(INTERACTIVE_SELECTOR)) {
      gestureRef.current = null;
      return;
    }

    gestureRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startedAt: event.timeStamp,
    };
  }

  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    const gesture = gestureRef.current;
    gestureRef.current = null;

    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    if (event.timeStamp - gesture.startedAt > SWIPE_TIMEOUT_MS) {
      return;
    }

    const horizontal = event.clientX - gesture.x;
    const vertical = event.clientY - gesture.y;
    if (
      Math.abs(horizontal) < SWIPE_DISTANCE_PX ||
      Math.abs(horizontal) < Math.abs(vertical) * SWIPE_DOMINANCE
    ) {
      return;
    }

    if (horizontal < 0) {
      options.onSwipeLeft();
      return;
    }

    options.onSwipeRight();
  }

  function cancel() {
    gestureRef.current = null;
  }

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
  };
}
