"use client";

import { Copy, Ellipsis, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import posthog from "posthog-js";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/workspace-ui/dropdown-menu";
import { copyTextToClipboard } from "@/lib/clipboard";
import { WorkspaceLinkPending } from "@/app/workspace/views/workspace-link-pending";

export type WorkspaceWorkoutDetailActionsProps = {
  editHref: string;
  workoutId: string;
  workoutExport: string;
};

/**
 * Edit is the action people came for, so it stays a button at every width. Copy
 * and delete sit in one menu instead of the old desktop button row plus a
 * separate hand-rolled phone dropdown, and delete confirms in an alert dialog
 * rather than a toast with buttons in it.
 */
export function WorkspaceWorkoutDetailActions({
  editHref,
  workoutId,
  workoutExport,
}: WorkspaceWorkoutDetailActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "deleting">("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleCopy() {
    if (status !== "idle") {
      return;
    }

    const toastId = toast.loading("Copying workout...");

    try {
      const result = await copyTextToClipboard(workoutExport);
      posthog.capture("workout_exported");
      toast.success(
        result === "clipboard"
          ? "Copied workout to clipboard."
          : "Clipboard blocked. Workout text opened for manual copy.",
        { id: toastId },
      );
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error ? caughtError.message : "Unable to copy workout.",
        { id: toastId },
      );
    }
  }

  async function deleteWorkout() {
    if (status !== "idle") {
      return;
    }

    const toastId = toast.loading("Deleting workout...");
    setStatus("deleting");

    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete workout.");
      }

      posthog.capture("workout_deleted");
      toast.success("Workout deleted.", { id: toastId });
      router.push("/dashboard?view=workouts");
      router.refresh();
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error ? caughtError.message : "Unable to delete workout.",
        { id: toastId },
      );
      setStatus("idle");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm" className="relative">
        <Link href={editHref}>
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
              setConfirmOpen(true);
            }}
          >
            <Trash2 />
            Delete workout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this workout?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The sets logged in this workout are removed
              from your history and your totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={status !== "idle"}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={status !== "idle"}
              onClick={() => void deleteWorkout()}
            >
              Delete workout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
