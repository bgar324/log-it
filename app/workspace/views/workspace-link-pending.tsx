"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "cn";

/**
 * Tap acknowledgement for a pending <Link> navigation, in the workspace token
 * vocabulary. The legacy overlay hardcodes the warm `--bg`/`--text` pair, which
 * reads as a cream flash over a neutral Nova surface, so the workspace carries
 * its own. Drop it inside a positioned Link.
 */
export function WorkspaceLinkPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus();

  if (!pending) {
    return null;
  }

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-[2] flex items-center justify-center rounded-[inherit] bg-background/55 backdrop-blur-[1px]",
        className,
      )}
    >
      <Loader2 className="size-4 animate-spin text-muted-foreground" />
    </span>
  );
}
