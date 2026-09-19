"use client";

import {
  useWorkspaceBenEnabled,
  useWorkspaceDesign,
} from "@/app/components/workspace-design-context";
import LegacyWorkoutDetailLoading from "@/app/_legacy/workouts/[workoutId]/loading";
import NewWorkoutLoading from "../../new/loading";

/**
 * Editing reuses the logger, so its fallback is the logger's. That is a
 * redesign fallback: the shipped app has no loading file on this segment at
 * all, and an unflagged reader waits behind the nearest one above it — the
 * workout detail skeleton. Reproducing that here keeps the shipped wait
 * identical while the owner gets the focused logger stage.
 */
export default function EditWorkoutLoading() {
  const workspaceDesign = useWorkspaceDesign();
  const benEnabled = useWorkspaceBenEnabled();

  if (!workspaceDesign && !benEnabled) {
    return <LegacyWorkoutDetailLoading />;
  }

  return <NewWorkoutLoading />;
}
