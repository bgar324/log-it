"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function ResearchRouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="segment-transition-shell">
      {children}
    </div>
  );
}
