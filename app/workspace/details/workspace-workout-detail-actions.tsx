"use client";

import { Copy, Ellipsis, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { InlineFeedback, type Feedback } from "@/app/components/inline-feedback";
import { DeleteConfirmDialog } from "@/app/components/delete-confirm-dialog";
import { forgetWorkoutPersonalRecords } from "@/app/workouts/workout-personal-records";
import posthog from "posthog-js";
import { Button } from "@/app/components/workspace-ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/workspace-ui/dropdown-menu";
import { copyTextToClipboard } from "@/lib/clipboard";
import { invalidateWorkoutDetails } from "@/app/dashboard/workout-detail-cache";
import { WorkspaceLinkPending } from "@/app/workspace/views/workspace-link-pending";

export type WorkspaceWorkoutDetailActionsProps = {
  editHref: string;
  workoutId: string;
  workoutExport: string;
  workoutLabel: string;
};

export function WorkspaceWorkoutDetailActions({
  editHref,
  workoutId,
  workoutExport,
  workoutLabel,
}: WorkspaceWorkoutDetailActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "copying" | "deleting">("idle");
  const busyRef = useRef(false);
  const [copyFeedback, setCopyFeedback] = useState<Feedback | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleCopy() {
    if (busyRef.current) return;
    busyRef.current = true;
    setStatus("copying");
    setCopyFeedback({ tone: "info", message: "Copying workout..." });
    try {
      const result = await copyTextToClipboard(workoutExport);
      posthog.capture("workout_exported");
      setCopyFeedback({
        tone: "success",
        message: result === "clipboard" ? "Copied workout to clipboard." : "Clipboard blocked. Workout text opened for manual copy.",
      });
    } catch (error) {
      setCopyFeedback({ tone: "error", message: error instanceof Error ? error.message : "Unable to copy workout." });
    } finally {
      busyRef.current = false;
      setStatus("idle");
    }
  }

  async function deleteWorkout() {
    if (busyRef.current) return;
    busyRef.current = true;
    setStatus("deleting");
    setDeleteError(null);
    try {
      const response = await fetch(`/api/workouts/${workoutId}`, { method: "DELETE" });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : "Unable to delete workout.");
      }
      invalidateWorkoutDetails(workoutId);
      forgetWorkoutPersonalRecords(workoutId);
      posthog.capture("workout_deleted");
      router.push("/dashboard?view=workouts");
      router.refresh();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete workout.");
      busyRef.current = false;
      setStatus("idle");
    }
  }

  return (
    <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
      <Button asChild variant="outline" size="sm" className="relative">
        <Link href={editHref} aria-disabled={status !== "idle"} onClick={event => { if (busyRef.current) event.preventDefault(); }}>
          <SquarePen />
          Edit
          <WorkspaceLinkPending />
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="More workout actions"
            disabled={status !== "idle"}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={status !== "idle"}
            onSelect={() => void handleCopy()}
          >
            <Copy />
            Copy workout
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={status !== "idle"}
            onSelect={(event) => {
              // The menu closes on select; opening the dialog in the same tick
              // would fight its own exit, so let the menu finish first.
              event.preventDefault();
              if (busyRef.current) return;
              setDeleteError(null);
              setConfirmOpen(true);
            }}
          >
            <Trash2 />
            Delete workout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <InlineFeedback feedback={copyFeedback} className="w-full max-w-xs text-left" />
      <DeleteConfirmDialog
        open={confirmOpen}
        title={`Delete ${workoutLabel}?`}
        description="This permanently removes the workout and all its sets from your history."
        busy={status === "deleting"}
        error={deleteError}
        onCancel={() => { if (!busyRef.current) setConfirmOpen(false); }}
        onConfirm={() => void deleteWorkout()}
      />
    </div>
  );
}
