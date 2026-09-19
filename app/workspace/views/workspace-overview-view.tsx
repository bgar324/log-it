"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/workspace-ui/card";
import { Skeleton } from "@/app/components/workspace-ui/skeleton";
import { Button } from "@/app/components/workspace-ui/button";
import { formatWeightWithUnit } from "@/lib/weight-unit";
import { countLabel } from "@/app/dashboard/dashboard-client.shared";
import type { DashboardClientData } from "@/app/dashboard/dashboard-types";
import type { DashboardOverviewViewProps } from "@/app/dashboard/_components/dashboard-overview-view";
import { formatWorkoutLoggerDateLabel } from "@/app/workouts/new/workout-logger.utils";
import { useStoredWorkoutDraft } from "@/app/workouts/new/_hooks/use-stored-workout-draft";
import { WorkspaceDetailSheetProvider } from "@/app/workspace/details/workspace-detail-sheet";
import { WorkspaceWorkoutHistoryList } from "./workspace-workout-history-list";
import { WorkspaceLinkPending } from "./workspace-link-pending";

type TodayPlan = DashboardOverviewViewProps["todayPlan"];

export type WorkspaceOverviewViewProps = DashboardOverviewViewProps & {
  /** The recent sessions the dashboard already loads, newest first. */
  workouts: DashboardClientData["workouts"];
};

const LOGGER_HREF = "/workouts/new?from=dashboard";

// The plan is a sentence, not a metric. Split day names are user-authored, so
// they are used verbatim rather than bent into grammar we cannot guarantee.
function planSentence(todayPlan: TodayPlan) {
  if (todayPlan.isRestDay) {
    return "Today is a rest day.";
  }

  if (todayPlan.workoutTypeSlug === null) {
    return todayPlan.workoutType === "No split"
      ? "You have not set a split yet."
      : "Today's plan is unavailable.";
  }

  return `Today is ${todayPlan.workoutType}.`;
}


/**
 * Home: what today asks for, the one thing to do about it, and what you have
 * been doing lately. The single action is the whole point — resume the draft
 * you left open, open the workout you already logged, or start a new one.
 */
export function WorkspaceOverviewView({
  overview,
  todayPlan,
  greetingName,
  weightUnit,
  workouts,
  onNavigateToView,
}: WorkspaceOverviewViewProps) {
  const draft = useStoredWorkoutDraft(weightUnit);
  const loggedWorkoutId = overview.loggedWorkoutId;

  // An open draft outranks a saved session: the draft is unsaved work that only
  // this device holds, and the logger will restore it whichever button is
  // pressed, so the label may as well say so.
  const primaryAction = draft
    ? { label: "Resume workout", href: LOGGER_HREF }
    : loggedWorkoutId
      ? { label: "Open workout", href: `/workouts/${loggedWorkoutId}` }
      : { label: "Start workout", href: LOGGER_HREF };

  const draftDateLabel = draft ? formatWorkoutLoggerDateLabel(draft.performedAt) : "";
  const status = draft
    ? draftDateLabel
      ? `Unsaved draft from ${draftDateLabel}.`
      : "Unsaved draft on this device."
    : loggedWorkoutId
      ? "Logged for today."
      : null;

  return (
    <WorkspaceDetailSheetProvider>
      <div className="flex flex-col gap-6">
        <section>
          <p className="text-sm text-muted-foreground">Hi, {greetingName}.</p>
          <h2 className="mt-1 text-2xl leading-snug font-medium tracking-tight text-foreground">
            {planSentence(todayPlan)}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{todayPlan.subtitle}</p>

          <div className="mt-4">
            <Button asChild size="lg" className="relative max-sm:w-full">
              <Link href={primaryAction.href}>
                {primaryAction.label}
                <WorkspaceLinkPending />
              </Link>
            </Button>
            {!draft && loggedWorkoutId && todayPlan.workoutTypeSlug !== null && !todayPlan.isRestDay ? (
              <Button asChild variant="ghost" className="relative mt-1 max-sm:w-full">
                <Link href={`${LOGGER_HREF}&another=1`}>
                  Log a different workout
                  <WorkspaceLinkPending />
                </Link>
              </Button>
            ) : null}
          </div>

          {status ? (
            <p className="mt-2 text-sm text-muted-foreground">{status}</p>
          ) : null}
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex min-h-8 items-center justify-between gap-3">
            <h3 className="text-xs font-medium text-muted-foreground">
              Recent sessions
            </h3>
            {workouts.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToView("workouts")}
              >
                View all
              </Button>
            ) : null}
          </div>

          {workouts.length > 0 ? (
            <Card className="overflow-hidden py-0">
              <WorkspaceWorkoutHistoryList rows={workouts} weightUnit={weightUnit} />
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">No workouts logged yet.</p>
          )}
        </section>

        {overview.todaySession.length > 0 ? (
          <Card>
            <CardHeader>
              {/* These are the exercises today's split plans, each with the last
                  time it was trained. Nothing here is an unsaved draft. */}
              <CardTitle>Today&apos;s exercises</CardTitle>
              <CardDescription>
                Planned by your split, with the last time you trained each.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y divide-foreground/10 border-t border-foreground/10">
                {overview.todaySession.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex min-h-[3.25rem] items-center gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {exercise.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {countLabel(exercise.plannedSets, "set")}
                      </p>
                    </div>
                    {/* Three honest states: never trained, trained with a set worth
                        quoting, and trained without one. "First time" keys off
                        history alone, never off a missing weight — a bodyweight set
                        has no weight and is still a session you did. The number is
                        the top set of that day, so the date under it says which day. */}
                    <div className="shrink-0 text-right">
                      {exercise.lastPerformedLabel === null ? (
                        <p className="text-xs text-muted-foreground">First time</p>
                      ) : (
                        <>
                          {exercise.lastReps !== null ? (
                            <p className="text-sm text-foreground tabular-nums">
                              {exercise.lastWeight !== null
                                ? formatWeightWithUnit(exercise.lastWeight, weightUnit)
                                : "BW"}{" "}
                              × {exercise.lastReps}
                            </p>
                          ) : null}
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            last hit {exercise.lastPerformedLabel}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </WorkspaceDetailSheetProvider>
  );
}

/**
 * Home's own fallback, for the client's first load of this view. The
 * dashboard's legacy skeleton is drawn in warm tokens and depends on
 * `--dashboard-border`, which only `DashboardShell` declares, so it cannot
 * stand in for this one.
 */
export function WorkspaceOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-3.5 w-[6.4rem]" />
        <Skeleton className="mt-2 h-7 w-[min(17rem,78%)]" />
        <Skeleton className="mt-2.5 h-3.5 w-[11.5rem]" />
        <Skeleton className="mt-4 h-11 w-[10.5rem] max-sm:w-full" />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex min-h-8 items-center justify-between gap-3">
          <Skeleton className="h-3 w-[6.5rem]" />
          <Skeleton className="h-3 w-[3.5rem]" />
        </div>
        <Card className="overflow-hidden py-0">
          <div className="divide-y divide-foreground/10">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="flex min-h-[3.25rem] items-center gap-3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-[8.5rem]" />
                  <Skeleton className="mt-1.5 h-3 w-[6.2rem]" />
                </div>
                <div className="shrink-0">
                  <Skeleton className="ml-auto h-3.5 w-[4.4rem]" />
                  <Skeleton className="mt-1.5 ml-auto h-3 w-[5.4rem]" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-[9.5rem]" />
        </CardHeader>
        <CardContent className="px-0">
          <div className="divide-y divide-foreground/10 border-t border-foreground/10">
            {Array.from({ length: 7 }, (_, index) => (
              <div
                key={index}
                className="flex min-h-[3.25rem] items-center gap-3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-[8.5rem]" />
                  <Skeleton className="mt-1.5 h-3 w-[3.2rem]" />
                </div>
                <div className="shrink-0">
                  <Skeleton className="ml-auto h-3.5 w-[4.4rem]" />
                  <Skeleton className="mt-1.5 ml-auto h-3 w-[3.9rem]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
