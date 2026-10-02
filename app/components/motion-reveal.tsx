"use client";

import { useState, type ReactNode } from "react";

/** Transitions.dev skeleton handoff, driven by readiness rather than a demo timer. */
export function MotionReveal({ loading, label, children, className = "" }: {
  loading: boolean;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const [phase, setPhase] = useState({ loading, reveal: false });
  if (phase.loading !== loading) {
    setPhase({ loading, reveal: !loading });
  }
  return (
    <div className={`${className}${phase.reveal ? " motion-reveal-values" : ""}`} aria-busy={loading}>
      {loading ? <span role="status" className="sr-only">Loading {label}…</span> : null}
      {children}
    </div>
  );
}
