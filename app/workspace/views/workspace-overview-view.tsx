"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/workspace-ui/card";
import { Skeleton } from "@/app/components/workspace-ui/skeleton";
import { Button } from "@/app/components/workspace-ui/button";
import { formatWeightWithUnit } from "@/lib/weight-unit";
import { countLabel } from "@/app/dashboard/dashboard-client.shared";
import type { DashboardOverviewViewProps } from "@/app/dashboard/_components/dashboard-overview-view";
import { WorkspaceLinkPending } from "./workspace-link-pending";

type TodayPlan = DashboardOverviewViewProps["todayPlan"];

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

export function WorkspaceOverviewView({
  overview,
  todayPlan,
  greetingName,
  weightUnit,
  onNavigateToView,
}: DashboardOverviewViewProps) {
  const hasSplit = todayPlan.workoutTypeSlug !== null;
  const actionLabel =
    hasSplit && !todayPlan.isRestDay && todayPlan.workoutType.length <= 16
      ? `Log ${todayPlan.workoutType}`
      : "Log a workout";

  return (
    <div className="flex flex-col gap-6">
      <section>
        <p className="text-sm text-muted-foreground">Hi, {greetingName}.</p>
        <h2 className="mt-1 text-2xl leading-snug font-medium tracking-tight text-foreground">
          {planSentence(todayPlan)}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{todayPlan.subtitle}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {todayPlan.isLoggedToday ? (
            <p className="text-sm text-muted-foreground">Logged for today.</p>
          ) : todayPlan.isRestDay ? (
            <Button asChild variant="outline" size="lg" className="relative max-sm:w-full">
              <Link href="/workouts/new?from=dashboard">
                Log an unscheduled workout
                <WorkspaceLinkPending />
              </Link>
            </Button>
          ) : hasSplit ? (
            <Button asChild size="lg" className="relative max-sm:w-full">
              <Link href="/workouts/new?from=dashboard">
                {actionLabel}
                <WorkspaceLinkPending />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="relative max-sm:w-full">
                <Link href="/workouts/new?from=dashboard">
                  Log a workout
                  <WorkspaceLinkPending />
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="max-sm:w-full"
                onClick={() => onNavigateToView("split")}
              >
                Set up a split
              </Button>
            </>
          )}
        </div>
      </section>

      {overview.todaySession.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Where you left off</CardTitle>
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
  );
}

/**
 * The workout tab's own fallback, for the client's first load of this view. The
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
