"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/workspace-ui/alert-dialog";
import { Button } from "@/app/components/workspace-ui/button";
import { WorkspaceFrame } from "@/app/components/workspace-frame";

export type WorkspaceRestDayNoticeProps = {
  benEnabled: boolean;
  backHref: string;
  onLogUnscheduledWorkout: () => void;
};

/**
 * The split plans no workout for this day. Say so, and offer the one thing
 * that is still true: an unscheduled workout can be logged anyway.
 */
export function WorkspaceRestDayNotice({
  benEnabled,
  backHref,
  onLogUnscheduledWorkout,
}: WorkspaceRestDayNoticeProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <WorkspaceFrame
      activeView="dashboard"
      benEnabled={benEnabled}
      backHref={backHref}
      contentKey="workout-logger-rest-day"
    >
      <section className="flex flex-col gap-3" aria-label="Rest day">
        <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
          Rest day
        </h1>
        <p className="text-sm text-muted-foreground">
          Your split keeps this day clear. You can leave it that way, or log a
          workout you did anyway.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="lg"
            onClick={() => setIsConfirmOpen(true)}
          >
            Log an unscheduled workout
          </Button>
        </div>
      </section>

      <AlertDialog
        open={isConfirmOpen}
        onOpenChange={nextOpen => {
          if (!nextOpen) {
            setIsConfirmOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log on a rest day?</AlertDialogTitle>
            <AlertDialogDescription>
              This workout is saved as an unscheduled session, and your weekly
              split stays as it is.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep rest day</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onLogUnscheduledWorkout();
                setIsConfirmOpen(false);
              }}
            >
              Log anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspaceFrame>
  );
}

export type WorkspaceLoggedWorkoutNoticeProps = {
  benEnabled: boolean;
  backHref: string;
  loggedWorkoutId: string;
  loggedLabel: string;
  loggedDateLabel: string;
  canLogAnotherWorkoutType: boolean;
  onLogAnotherWorkout: () => void;
};

/**
 * The planned workout for this date is already saved. Say it once, and offer
 * what actually works: open it, and — only when a second workout of a
 * different type is possible — start another one.
 */
export function WorkspaceLoggedWorkoutNotice({
  benEnabled,
  backHref,
  loggedWorkoutId,
  loggedLabel,
  loggedDateLabel,
  canLogAnotherWorkoutType,
  onLogAnotherWorkout,
}: WorkspaceLoggedWorkoutNoticeProps) {
  return (
    <WorkspaceFrame
      activeView="dashboard"
      benEnabled={benEnabled}
      backHref={backHref}
      contentKey="workout-logger-already-logged"
    >
      <section className="flex flex-col gap-3" aria-label="Already logged">
        <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
          Already logged
        </h1>
        <p className="text-sm text-muted-foreground">
          {canLogAnotherWorkoutType
            ? `${loggedLabel} is already saved for ${loggedDateLabel}. Open it to change what you logged, or log a different workout for the same day.`
            : `${loggedLabel} is already saved for ${loggedDateLabel}. Open it to change what you logged.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" asChild>
            <Link href={`/workouts/${loggedWorkoutId}`}>Open workout</Link>
          </Button>
          {canLogAnotherWorkoutType ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onLogAnotherWorkout}
            >
              Log a different workout
            </Button>
          ) : null}
        </div>
      </section>
    </WorkspaceFrame>
  );
}
