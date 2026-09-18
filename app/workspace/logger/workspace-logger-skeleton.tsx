"use client";

import { Skeleton } from "@/app/components/workspace-ui/skeleton";
import { WorkspaceFrame } from "@/app/components/workspace-frame";
import { useWorkspaceBenEnabled } from "@/app/components/workspace-design-context";

function ExerciseBlockSkeleton() {
  return (
    <section className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-1">
        <Skeleton className="mt-0.5 size-8 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-11 w-full rounded-lg md:h-8" />
          <Skeleton className="mt-1.5 ml-1.5 h-3 w-32" />
        </div>
        <Skeleton className="mt-0.5 size-8 shrink-0 rounded-lg" />
      </div>

      <div className="mt-2 flex flex-col gap-2 pl-[2.25rem]">
        <Skeleton className="h-3 w-40" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-11 w-full rounded-lg md:h-8" />
        ))}
        <Skeleton className="h-7 w-24 rounded-md" />
      </div>
    </section>
  );
}

/**
 * The logger's shape while it loads: the same heading, sentence, exercise
 * blocks and action bar the document renders, so nothing jumps when the real
 * one arrives. No rest timer and no nutrition anywhere — the workspace logger
 * has neither.
 */
export function WorkspaceLoggerSkeleton() {
  const benEnabled = useWorkspaceBenEnabled();
  return (
    <WorkspaceFrame
      benEnabled={benEnabled}
      activeView="dashboard"
      contentKey="workout-logger-loading"
    >
      <div className="flex flex-col gap-5" aria-busy="true">
        <header className="flex flex-col gap-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-[min(20rem,80%)]" />
        </header>

        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }, (_, index) => (
            <ExerciseBlockSkeleton key={index} />
          ))}
        </div>

        <Skeleton className="h-9 w-full rounded-lg" />

        <div className="flex items-center gap-2 border-t border-border pt-3">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
        </div>
      </div>
    </WorkspaceFrame>
  );
}
