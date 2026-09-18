"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/workspace-ui/alert";
import { Button } from "@/app/components/workspace-ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/app/components/workspace-ui/sheet";
import { WorkspaceLinkPending } from "@/app/workspace/views/workspace-link-pending";
import {
  WorkspaceExerciseDetailBodySkeleton,
  WorkspaceWorkoutDetailBodySkeleton,
} from "./workspace-detail-skeletons";
import { WorkspaceExerciseDetailBody } from "./workspace-exercise-detail";
import type { WorkspaceExerciseDetailProjection } from "./workspace-exercise-detail.data";
import { WorkspaceWorkoutDetailBody } from "./workspace-workout-detail";
import type { WorkspaceWorkoutDetailProjection } from "./workspace-workout-detail.data";
import {
  WorkspaceDetailSheetContext,
  type WorkspaceDetailTarget,
} from "./workspace-detail-sheet.context";

type DetailState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; kind: "workout"; workout: WorkspaceWorkoutDetailProjection }
  | { status: "ready"; kind: "exercise"; exercise: WorkspaceExerciseDetailProjection };

function detailUrl(target: WorkspaceDetailTarget) {
  return target.kind === "workout"
    ? `/api/workspace/workouts/${encodeURIComponent(target.id)}`
    : `/api/workspace/exercises/${encodeURIComponent(target.routeKey)}`;
}

function pageHref(target: WorkspaceDetailTarget) {
  return target.kind === "workout"
    ? `/workouts/${target.id}`
    : `/exercises/${encodeURIComponent(target.routeKey)}`;
}

/**
 * Reading a workout or an exercise from a list should not cost you the list.
 * A plain click opens this sheet over the history you were scrolling, with the
 * search, the filters and the scroll position all still behind it; the row is
 * still a real link, so a modifier click, a middle click or a copied address
 * all lead to the full page.
 *
 * The sheet keeps the last thing it showed after it closes, so the panel is
 * never blank on the way out, and a second request aborts the first rather than
 * racing it.
 */
export function WorkspaceDetailSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<WorkspaceDetailTarget | null>(null);
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const requestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(
    () => () => {
      requestRef.current?.abort();
    },
    [],
  );

  const load = useCallback(async (next: WorkspaceDetailTarget) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState({ status: "loading" });

    try {
      const response = await fetch(detailUrl(next), {
        signal: controller.signal,
        headers: { accept: "application/json" },
      });

      // A newer request has already taken over; this answer is stale.
      if (requestId !== requestIdRef.current) {
        return;
      }

      if (response.status === 404) {
        setState({ status: "missing" });
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { detail?: unknown; error?: string }
        | null;

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok || !payload?.detail) {
        setState({
          status: "error",
          message: payload?.error ?? "Unable to load this detail.",
        });
        return;
      }

      setState(
        next.kind === "workout"
          ? {
              status: "ready",
              kind: "workout",
              workout: payload.detail as WorkspaceWorkoutDetailProjection,
            }
          : {
              status: "ready",
              kind: "exercise",
              exercise: payload.detail as WorkspaceExerciseDetailProjection,
            },
      );
    } catch (error) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to load this detail.",
      });
    }
  }, []);

  const openDetail = useCallback(
    (next: WorkspaceDetailTarget, trigger: HTMLElement) => {
      if (!open) openerRef.current = trigger;
      setTarget(next);
      setOpen(true);
      void load(next);
    },
    [load, open],
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      // Stop the fetch, but keep the content: Radix animates the panel out, and
      // clearing it here would empty the panel mid-exit.
      requestRef.current?.abort();
      requestIdRef.current += 1;
    }
  }

  return (
    <WorkspaceDetailSheetContext.Provider value={{ openDetail }}>
      {children}

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[560px]"
          onCloseAutoFocus={event => {
            event.preventDefault();
            if (openerRef.current?.isConnected) {
              openerRef.current.focus({ preventScroll: true });
            }
          }}
        >
          <SheetHeader className="px-4 pt-4 pr-14 pb-3">
            <SheetTitle>{target?.label ?? "Detail"}</SheetTitle>
            <SheetDescription>
              {state.status === "ready"
                ? state.kind === "workout"
                  ? state.workout.summarySentence
                  : state.exercise.summarySentence
                : state.status === "missing"
                  ? "This is no longer in your history."
                  : state.status === "error"
                    ? state.message
                    : "Loading."}
            </SheetDescription>
            {state.status === "ready" ? (
              <p className="text-sm text-muted-foreground">
                {state.kind === "workout"
                  ? `${
                      state.workout.workoutType &&
                      state.workout.workoutType !== state.workout.title
                        ? `${state.workout.workoutType} · `
                        : ""
                    }${state.workout.summaryMeta}`
                  : state.exercise.summaryMeta}
              </p>
            ) : null}
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {state.status === "loading" ? (
              target?.kind === "exercise" ? (
                <WorkspaceExerciseDetailBodySkeleton />
              ) : (
                <WorkspaceWorkoutDetailBodySkeleton />
              )
            ) : state.status === "missing" ? (
              <p className="text-sm text-muted-foreground">
                It may have been deleted from another device.
              </p>
            ) : state.status === "error" ? (
              <div className="flex flex-col gap-3">
                <Alert variant="destructive">
                  <AlertTitle>Detail could not load</AlertTitle>
                  <AlertDescription>{state.message}</AlertDescription>
                </Alert>
                {target ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="self-start"
                    onClick={() => void load(target)}
                  >
                    Retry
                  </Button>
                ) : null}
              </div>
            ) : state.kind === "workout" ? (
              <WorkspaceWorkoutDetailBody detail={state.workout} />
            ) : (
              <WorkspaceExerciseDetailBody detail={state.exercise} />
            )}
          </div>

          {target ? (
            <SheetFooter className="flex-row gap-2 px-4 pt-3 pb-4">
              {target.kind === "workout" ? (
                <Button asChild className="relative flex-1">
                  <Link href={`/workouts/${target.id}/edit`}>
                    Edit workout
                    <WorkspaceLinkPending />
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" className="relative flex-1">
                <Link href={pageHref(target)}>
                  {target.kind === "workout" ? "Open workout page" : "Open exercise page"}
                  <WorkspaceLinkPending />
                </Link>
              </Button>
            </SheetFooter>
          ) : null}
        </SheetContent>
      </Sheet>
    </WorkspaceDetailSheetContext.Provider>
  );
}
