"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/app/hooks/use-reduced-motion";

type Snapshot = { key: string; content: ReactNode };

/** Transitions.dev text swap; request state never waits for its visual exit. */
export function MotionState({ stateKey, children, className = "" }: {
  stateKey: string;
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<{
    current: Snapshot;
    outgoing: Snapshot | null;
    changed: boolean;
  }>({ current: { key: stateKey, content: children }, outgoing: null, changed: false });
  const outgoingRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const outgoing = state.outgoing;
    if (!outgoing) return;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      const animations = outgoingRef.current?.getAnimations?.() ?? [];
      void Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
        if (!cancelled) {
          setState(current => current.outgoing === outgoing ? { ...current, outgoing: null } : current);
        }
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [state.outgoing]);

  if (state.current.key !== stateKey) {
    setState({
      current: { key: stateKey, content: children },
      outgoing: reducedMotion ? null : state.current,
      changed: true,
    });
  } else if (reducedMotion && state.outgoing) {
    setState({ ...state, outgoing: null });
  }

  return (
    <span className={`motion-state ${className}`}>
      {state.outgoing ? (
        <span ref={outgoingRef} key={`out-${state.outgoing.key}`} className="motion-state-exit" aria-hidden="true" inert>
          {state.outgoing.content}
        </span>
      ) : null}
      <span key={stateKey} className={state.changed ? "motion-state-enter" : undefined}>
        {children}
      </span>
    </span>
  );
}
