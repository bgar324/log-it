"use client";

import { Filter, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/workspace-ui/alert";
import { Button } from "@/app/components/workspace-ui/button";
import { Card } from "@/app/components/workspace-ui/card";
import { Input } from "@/app/components/workspace-ui/input";
import { Label } from "@/app/components/workspace-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/workspace-ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/workspace-ui/sheet";
import { Skeleton } from "@/app/components/workspace-ui/skeleton";
import { countLabel } from "@/app/dashboard/dashboard-client.shared";
import type { DashboardWorkoutFilters } from "@/app/dashboard/dashboard-types";
import {
  getFilteredWorkoutMonths,
  getWorkoutCount,
  hasActiveWorkoutFilters,
  type DashboardWorkoutsViewProps,
  type WorkoutFiltersControlProps,
} from "@/app/dashboard/_components/dashboard-workouts-view";
import { WorkspaceWorkoutHistoryList } from "./workspace-workout-history-list";
import { WorkspaceDetailSheetProvider } from "@/app/workspace/details/workspace-detail-sheet";

// Radix Select has no empty-string item value, and "no type filter" is exactly
// the empty string in the filter object the dashboard owns.
const ANY_WORKOUT_TYPE = "__any_workout_type__";

export function WorkspaceWorkoutFiltersControl({
  filters,
  workoutTypes,
  filteredCount,
  hasFilters,
  onChange,
  onClear,
}: WorkoutFiltersControlProps) {
  const [open, setOpen] = useState(false);

  function updateFilter<Key extends keyof DashboardWorkoutFilters>(
    key: Key,
    value: DashboardWorkoutFilters[Key],
  ) {
    onChange({
      ...filters,
      [key]: value,
    });
  }

  // Search is the filter people reach for, so it is a field rather than a thing
  // to go find behind an icon. Date and type are the rarer pair and live in the
  // sheet, which also means they can never be clipped by a menu edge.
  const refinementCount = [filters.dateFrom, filters.dateTo, filters.workoutType].filter(
    Boolean,
  ).length;

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <Input
        type="search"
        value={filters.titleQuery}
        aria-label="Search workouts by title"
        placeholder="Search workouts"
        className="min-w-0 flex-1"
        onChange={(event) => updateFilter("titleQuery", event.target.value)}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            aria-label={
              refinementCount > 0
                ? `Date and type filters, ${refinementCount} active`
                : "Filter by date and type"
            }
          >
            <Filter />
            <span className="max-[479px]:hidden">Filters</span>
            {refinementCount > 0 ? (
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] leading-none text-primary-foreground tabular-nums">
                {refinementCount}
              </span>
            ) : null}
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="gap-0">
          <SheetHeader className="px-4 pt-4 pr-14 pb-3">
            <SheetTitle>Filter history</SheetTitle>
            <SheetDescription>
              Narrow the history to a date range or a single workout type.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="workspace-filter-date-from">From</Label>
                <Input
                  id="workspace-filter-date-from"
                  type="date"
                  value={filters.dateFrom}
                  max={filters.dateTo || undefined}
                  onChange={(event) => updateFilter("dateFrom", event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="workspace-filter-date-to">To</Label>
                <Input
                  id="workspace-filter-date-to"
                  type="date"
                  value={filters.dateTo}
                  min={filters.dateFrom || undefined}
                  onChange={(event) => updateFilter("dateTo", event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="workspace-filter-type">Type</Label>
              <Select
                value={filters.workoutType || ANY_WORKOUT_TYPE}
                onValueChange={(value) =>
                  updateFilter("workoutType", value === ANY_WORKOUT_TYPE ? "" : value)
                }
              >
                <SelectTrigger id="workspace-filter-type" className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_WORKOUT_TYPE}>All types</SelectItem>
                  {workoutTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="gap-3 px-4 pt-0 pb-4">
            <p className="text-sm text-muted-foreground">
              {countLabel(filteredCount, "workout")}{" "}
              {hasFilters
                ? `${filteredCount === 1 ? "matches" : "match"} these filters.`
                : "in your history."}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={onClear}
                disabled={!hasFilters}
              >
                Clear filters
              </Button>
              <SheetClose asChild>
                <Button type="button" className="flex-1">
                  Done
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// A full history renders one row per workout, which on a phone is thousands of
// elements to style and hydrate before the view is interactive. Mount the most
// recent months and let the rest be revealed on demand. Filtering still runs
// over the whole history — only the rendered slice is capped.
const INITIAL_MONTHS = 3;
const MONTHS_PER_REVEAL = 6;

function WorkoutHistorySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-4 w-[13rem]" />
        <Skeleton className="mt-2.5 h-3.5 w-[16rem]" />
      </div>
      {Array.from({ length: 2 }, (_, monthIndex) => (
        <div key={monthIndex} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-[7rem]" />
          <Card className="overflow-hidden py-0">
            <div className="divide-y divide-foreground/10">
              {Array.from({ length: 4 }, (_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex min-h-[3.25rem] items-center gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-3.5 w-[9rem]" />
                    <Skeleton className="mt-1.5 h-3 w-[6.5rem]" />
                  </div>
                  <div className="shrink-0">
                    <Skeleton className="ml-auto h-3.5 w-[4.5rem]" />
                    <Skeleton className="mt-1.5 ml-auto h-3 w-[5.5rem]" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}

export function WorkspaceWorkoutsView({
  workoutMonths,
  lifetime,
  displayWeightUnit,
  filters,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  remainingCount = 0,
  error = null,
  onLoadMore,
  onRetry,
}: DashboardWorkoutsViewProps) {
  const filteredWorkoutMonths = useMemo(
    () => getFilteredWorkoutMonths(workoutMonths, filters),
    [filters, workoutMonths],
  );
  const [visibleMonths, setVisibleMonths] = useState(INITIAL_MONTHS);
  const [renderedFilters, setRenderedFilters] = useState(filters);

  // A new filter should start from the most recent results again. Adjusting
  // during render rather than in an effect avoids rendering the stale slice
  // first and then immediately re-rendering.
  if (filters !== renderedFilters) {
    setRenderedFilters(filters);
    setVisibleMonths(INITIAL_MONTHS);
  }

  const renderedMonths = filteredWorkoutMonths.slice(0, visibleMonths);
  const hiddenWorkoutCount = getWorkoutCount(
    filteredWorkoutMonths.slice(visibleMonths),
  );
  // The button reveals a fixed number of months, so it promises the workouts in
  // those months rather than every hidden one.
  const revealWorkoutCount = getWorkoutCount(
    filteredWorkoutMonths.slice(visibleMonths, visibleMonths + MONTHS_PER_REVEAL),
  );
  const canLoadMore = hiddenWorkoutCount > 0 || (hasMore && Boolean(onLoadMore));

  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="destructive">
          <AlertTitle>History could not load</AlertTitle>
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
    return <WorkoutHistorySkeleton />;
  }

  const filterCount = getWorkoutCount(filteredWorkoutMonths);
  const filtersActive = hasActiveWorkoutFilters(filters);

  return (
    <WorkspaceDetailSheetProvider>
      <div className="flex flex-col gap-6">
        <section>
          <p className="text-[0.95rem] leading-relaxed text-foreground">
            {filtersActive
              ? `${countLabel(filterCount, "workout")} ${
                  filterCount === 1 ? "matches" : "match"
                } these filters.`
              : `You have logged ${countLabel(lifetime.workouts, "workout")}.`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {countLabel(lifetime.sets, "set")} across{" "}
            {countLabel(lifetime.exercises, "exercise")} all time.
          </p>
        </section>

        {filteredWorkoutMonths.length > 0 ? (
          <div className="flex flex-col gap-6">
            {renderedMonths.map((month) => (
              <section key={month.month} className="flex flex-col gap-2">
                <h3 className="text-xs font-medium text-muted-foreground">
                  {month.month}
                </h3>
                <Card className="overflow-hidden py-0">
                  <WorkspaceWorkoutHistoryList
                    rows={month.entries}
                    weightUnit={displayWeightUnit}
                  />
                </Card>
              </section>
            ))}

            {/* The reveal button is always in the flow, never an overflow-driven
                sentinel: a filtered history can be shorter than the viewport and
                still have older months behind it. */}
            {canLoadMore ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                disabled={hiddenWorkoutCount === 0 && isLoadingMore}
                onClick={() => {
                  if (hiddenWorkoutCount > 0) {
                    setVisibleMonths((count) => count + MONTHS_PER_REVEAL);
                  } else {
                    onLoadMore?.();
                  }
                }}
              >
                {hiddenWorkoutCount > 0 ? (
                  `Show ${countLabel(revealWorkoutCount, "older workout")}`
                ) : isLoadingMore ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Loading older workouts...
                  </>
                ) : (
                  `Load ${countLabel(remainingCount, "older workout")}`
                )}
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {filtersActive
              ? "No workouts match those filters."
              : "No workouts logged yet."}
          </p>
        )}
      </div>
    </WorkspaceDetailSheetProvider>
  );
}
