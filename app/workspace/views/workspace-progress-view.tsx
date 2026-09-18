"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/workspace-ui/alert";
import { Button } from "@/app/components/workspace-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/workspace-ui/card";
import { Input } from "@/app/components/workspace-ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/workspace-ui/select";
import { Skeleton } from "@/app/components/workspace-ui/skeleton";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import { countLabel, daysAgoLabel } from "@/app/dashboard/dashboard-client.shared";
import type { DashboardProgressViewProps } from "@/app/dashboard/_components/dashboard-progress-view";
import {
  EXERCISES_PER_PAGE,
  type ExerciseSortMode,
} from "@/app/dashboard/_hooks/use-dashboard-progress";
import { WorkspaceLinkPending } from "./workspace-link-pending";
import { WorkspaceDetailSheetProvider } from "@/app/workspace/details/workspace-detail-sheet";
import {
  isPlainRowActivation,
  useWorkspaceDetailSheet,
} from "@/app/workspace/details/workspace-detail-sheet.context";

const WorkspaceProgressChart = dynamic(() =>
  import("./workspace-progress-charts").then((module) => module.WorkspaceProgressChart),
);

// Four named orderings in one control. The old pair of chevron toggles carried
// the same four states, but "Recent" meant three different things depending on
// which button was already active.
const EXERCISE_SORT_OPTIONS = [
  { value: "recent-desc", label: "Most recent" },
  { value: "recent-asc", label: "Least recent" },
  { value: "sessions-desc", label: "Most sessions" },
  { value: "sessions-asc", label: "Fewest sessions" },
] as const satisfies ReadonlyArray<{ value: ExerciseSortMode; label: string }>;

function ProgressSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-4 w-[min(100%,20rem)]" />
        <Skeleton className="mt-2.5 h-3.5 w-[min(100%,17rem)]" />
      </div>

      <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-[8.5rem]" />
              <Skeleton className="mt-1.5 h-3.5 w-[11rem]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[15rem] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-[6.2rem]" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-9 w-full" />
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3.5 w-[5rem]" />
            <Skeleton className="h-9 w-[9.5rem]" />
          </div>
        </CardContent>
        <CardContent className="px-0">
          <div className="divide-y divide-foreground/10 border-t border-foreground/10">
            {/* Exactly one page, derived from the list's own page size. */}
            {Array.from({ length: EXERCISES_PER_PAGE }, (_, index) => (
              <div
                key={index}
                className="flex min-h-[3.25rem] items-center gap-3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-[8.5rem]" />
                  <Skeleton className="mt-1.5 h-3 w-[9.5rem]" />
                </div>
                <div className="shrink-0">
                  <Skeleton className="ml-auto h-3.5 w-[4rem]" />
                  <Skeleton className="mt-1.5 ml-auto h-3 w-[7.5rem]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardContent className="flex items-center justify-between gap-3">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="h-3.5 w-[4.5rem]" />
          <Skeleton className="size-11 rounded-full" />
        </CardContent>
      </Card>
    </div>
  );
}

type ExerciseIndexRowsProps = {
  exercises: DashboardProgressViewProps["state"]["visibleExercises"];
  weightUnit: WeightUnit;
};

/**
 * The rows are their own component because they have to be a descendant of the
 * detail sheet's provider to reach it, and the view that renders that provider
 * cannot read its own context.
 */
function ExerciseIndexRows({ exercises, weightUnit }: ExerciseIndexRowsProps) {
  const detailSheet = useWorkspaceDetailSheet();

  return (
    <div className="divide-y divide-foreground/10 border-t border-foreground/10">
      {exercises.map((exercise) => (
        <Link
          key={exercise.key}
          href={`/exercises/${encodeURIComponent(exercise.routeKey)}`}
          className="relative flex min-h-[3.25rem] items-center gap-3 px-3 py-2.5 outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
          onClick={(event) => {
            if (!detailSheet || !isPlainRowActivation(event)) {
              return;
            }

            event.preventDefault();
            detailSheet.openDetail({
              kind: "exercise",
              routeKey: exercise.routeKey,
              label: exercise.name,
            }, event.currentTarget);
          }}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">
              {exercise.name}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {countLabel(exercise.sessionCount, "session")} ·{" "}
              {countLabel(exercise.setCount, "set")} ·{" "}
              {countLabel(exercise.totalReps, "rep")}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-sm text-foreground tabular-nums">
              {/* Bodyweight-only history has no external load, and "0 lb" reads
                  as a measurement rather than the absence of one. */}
              {exercise.bestWeight > 0
                ? formatWeightWithUnit(exercise.bestWeight, weightUnit)
                : "Bodyweight"}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              last hit {exercise.lastPerformedAtLabel} ·{" "}
              {daysAgoLabel(exercise.daysSinceLastHit)}
            </span>
          </span>
          <WorkspaceLinkPending />
        </Link>
      ))}
    </div>
  );
}

export function WorkspaceProgressView({
  progress,
  exercises,
  weightUnit,
  state,
  isLoading = false,
  error = null,
  onRetry,
}: DashboardProgressViewProps) {
  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="destructive">
          <AlertTitle>Progress could not load</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        {onRetry ? (
          <Button type="button" variant="outline" className="self-start" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  if (isLoading) {
    return <ProgressSkeleton />;
  }

  const thisWeek = `${progress.currentWeek} ${
    progress.currentWeek === 1 ? "workout" : "workouts"
  }`;
  const weekComparison =
    progress.weekDelta === 0
      ? "the same as last week"
      : progress.weekDelta > 0
        ? `${progress.weekDelta} more than last week`
        : `${Math.abs(progress.weekDelta)} fewer than last week`;
  // Product rule: round up. A fractional average reads like a rounding error,
  // and "0 per week" reads like you never trained.
  const weeklyAverage = Math.ceil(progress.avgWeekly);

  return (
    <WorkspaceDetailSheetProvider>
      <div className="flex flex-col gap-6">
        <section>
          <p className="text-[0.95rem] leading-relaxed text-foreground">
            You have logged {thisWeek} this week, {weekComparison}.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Over the past 12 weeks you have averaged {weeklyAverage}{" "}
            {weeklyAverage === 1 ? "workout" : "workouts"} a week.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Workout frequency</CardTitle>
              <CardDescription>Sessions started per week.</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkspaceProgressChart
                weeklySeries={progress.weeklySeries}
                metric="sessions"
                weightUnit={weightUnit}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Volume trend</CardTitle>
              <CardDescription>Total weekly load, weight times reps.</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkspaceProgressChart
                weeklySeries={progress.weeklySeries}
                metric="volume"
                weightUnit={weightUnit}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exercises</CardTitle>
            <CardDescription>
              Every exercise you have logged, newest first. Open one for its full
              history.
            </CardDescription>
          </CardHeader>

          {/* Search leads: with dozens of exercises, naming one beats ordering
              them all. The sort sits on the count line as a single named choice. */}
          <CardContent className="flex flex-col gap-3">
            <Input
              type="search"
              value={state.exerciseSearch}
              aria-label="Search exercises by name"
              placeholder="Search exercise"
              onChange={(event) => state.handleExerciseSearchChange(event.target.value)}
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {state.filteredExercises.length}{" "}
                {state.filteredExercises.length === 1 ? "exercise" : "exercises"}
              </p>
              <Select
                value={state.exerciseSortMode}
                onValueChange={(value) =>
                  state.handleExerciseSortChange(value as ExerciseSortMode)
                }
              >
                <SelectTrigger aria-label="Sort exercises" className="w-[10.5rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXERCISE_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          {state.filteredExercises.length > 0 ? (
            <>
              <CardContent className="px-0">
                <ExerciseIndexRows
                  exercises={state.visibleExercises}
                  weightUnit={weightUnit}
                />
              </CardContent>

              {state.hasPreviousPage || state.hasNextPage ? (
                <CardContent
                  className="flex items-center justify-between gap-3"
                  data-pager="exercises"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Previous page of exercises"
                    onClick={state.goToPreviousPage}
                    disabled={!state.hasPreviousPage}
                  >
                    <ChevronLeft />
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {state.rangeLabel}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Next page of exercises"
                    onClick={state.goToNextPage}
                    disabled={!state.hasNextPage}
                  >
                    <ChevronRight />
                  </Button>
                </CardContent>
              ) : null}
            </>
          ) : (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {exercises.length > 0
                  ? "No exercise matches your search."
                  : "No exercise data yet."}
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </WorkspaceDetailSheetProvider>
  );
}
