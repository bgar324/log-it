"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

/**
 * Renders a spinner overlay over the enclosing <Link> while its navigation is
 * pending. Drop it inside a Link (which must be positioned, e.g. `relative`) so
 * the exact element the user tapped acknowledges the tap during a server fetch.
 */
export function LinkPendingOverlay({
  className = "",
}: {
  className?: string;
}) {
  const { pending } = useLinkStatus();

  if (!pending) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-[2] flex items-center justify-center rounded-[inherit] bg-[color-mix(in_srgb,var(--bg)_58%,transparent)] backdrop-blur-[1px] ${className}`}
    >
      <Loader2
        className="h-[1.15rem] w-[1.15rem] animate-spin text-[var(--text)]"
        strokeWidth={1.9}
      />
    </span>
  );
}
