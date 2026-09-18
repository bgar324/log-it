"use client";

import Link from "next/link";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import type { WorkoutTableRow } from "@/app/dashboard/dashboard-client.shared";
import {
  isPlainRowActivation,
  useWorkspaceDetailSheet,
} from "@/app/workspace/details/workspace-detail-sheet.context";
import { WorkspaceLinkPending } from "./workspace-link-pending";

type WorkspaceWorkoutHistoryListProps = {
  rows: WorkoutTableRow[];
  weightUnit: WeightUnit;
};

/**
 * One row per logged workout: what it was and when on the left, what it added
 * up to on the right. The old table's five columns collapsed into stacked
 * labelled spans on a phone, which is where this list is actually read, so the
 * stacked shape is the only shape — the date stays spelled out instead of being
 * abbreviated to fit a column that no longer exists.
 *
 * A row is a real link to the workout's page, but a plain click opens it in the
 * detail sheet instead, so the history you were reading stays where it was.
 */
export function WorkspaceWorkoutHistoryList({
  rows,
  weightUnit,
}: WorkspaceWorkoutHistoryListProps) {
  const detailSheet = useWorkspaceDetailSheet();

  return (
    <div className="divide-y divide-foreground/10">
      {rows.map((workout) => (
        <Link
          key={workout.id}
          href={`/workouts/${workout.id}`}
          className="relative flex min-h-[3.25rem] items-center gap-3 px-3 py-2.5 outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
          onClick={(event) => {
            if (!detailSheet || !isPlainRowActivation(event)) {
              return;
            }

            event.preventDefault();
            detailSheet.openDetail({
              kind: "workout",
              id: workout.id,
              label: workout.title,
            }, event.currentTarget);
          }}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">
              {workout.title}
              {workout.workoutType && workout.workoutType !== workout.title ? (
                <span className="font-normal text-muted-foreground">
                  {" · "}
                  {workout.workoutType}
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {workout.performedAtLabel}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-sm text-foreground tabular-nums">
              {formatWeightWithUnit(workout.volume, weightUnit, {
                maximumFractionDigits: 0,
              })}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">
              {workout.exerciseCount} ex · {workout.setCount} sets
            </span>
          </span>
          <WorkspaceLinkPending />
        </Link>
      ))}
    </div>
  );
}
