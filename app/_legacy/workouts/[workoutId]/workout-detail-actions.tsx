"use client";

import { Copy, Ellipsis, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { InlineFeedback, type Feedback } from "@/app/components/inline-feedback";
import { DeleteConfirmDialog } from "@/app/components/delete-confirm-dialog";
import { forgetWorkoutPersonalRecords } from "@/app/workouts/workout-personal-records";
import { invalidateWorkoutDetails } from "@/app/dashboard/workout-detail-cache";
import posthog from "posthog-js";
import { copyTextToClipboard } from "@/lib/clipboard";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import { styles } from "@/app/_legacy/workouts/[workoutId]/workout-detail.styles";

type WorkoutDetailActionsProps = {
  editHref: string;
  workoutId: string;
  workoutExport: string;
  workoutLabel: string;
};

export function WorkoutDetailActions({
  editHref,
  workoutId,
  workoutExport,
  workoutLabel,
}: WorkoutDetailActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "copying" | "deleting">("idle");
  const busyRef = useRef(false);
  const [copyFeedback, setCopyFeedback] = useState<Feedback | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 760px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setIsMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  async function handleCopy() {
    if (busyRef.current) return;
    busyRef.current = true;
    setStatus("copying");
    setCopyFeedback({ tone: "info", message: "Copying workout..." });
    setIsMenuOpen(false);
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

  function handleDelete() {
    if (busyRef.current) return;
    setIsMenuOpen(false);
    setDeleteError(null);
    setConfirmOpen(true);
  }

  return (
    <div className="flex min-w-0 max-w-full flex-col items-end gap-2">
      <div className={styles.detailActionsGroup}>
        <Link href={editHref} className={`relative ${styles.actionButton}`} aria-disabled={status !== "idle"}
          onClick={event => { if (busyRef.current) event.preventDefault(); }}>
          <SquarePen className={styles.actionButtonIcon} strokeWidth={1.9} />
          <span className={styles.actionButtonLabel}>Edit workout</span>
          <LinkPendingOverlay />
        </Link>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => void handleCopy()}
          disabled={status !== "idle"}
        >
          <Copy className={styles.actionButtonIcon} strokeWidth={1.9} />
          <span className={styles.actionButtonLabel}>Copy workout</span>
        </button>
        <button
          type="button"
          className={styles.dangerActionButton}
          onClick={handleDelete}
          disabled={status !== "idle"}
        >
          <Trash2 className={styles.actionButtonIcon} strokeWidth={1.9} />
          <span className={styles.actionButtonLabel}>Delete workout</span>
        </button>
      </div>
      <div className={styles.mobileActionMenu}>
        <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <PopoverTrigger
            aria-label="Workout options"
            className={styles.mobileActionToggle}
            disabled={status !== "idle"}
          >
            <Ellipsis className={styles.actionButtonIcon} strokeWidth={1.9} />
          </PopoverTrigger>
          <PopoverContent align="end" className={styles.mobileActionDropdown} preserveInputFocus>
            <Link
              href={editHref}
              className={`relative ${styles.mobileActionMenuItem}`}
              aria-disabled={status !== "idle"}
              onClick={event => { if (busyRef.current) event.preventDefault(); else setIsMenuOpen(false); }}
            >
              <SquarePen className={styles.actionButtonIcon} strokeWidth={1.9} />
              <span>Edit workout</span>
              <LinkPendingOverlay />
            </Link>
            <button
              type="button"
              className={styles.mobileActionMenuItem}
              onClick={() => void handleCopy()}
              disabled={status !== "idle"}
            >
              <Copy className={styles.actionButtonIcon} strokeWidth={1.9} />
              <span>Copy workout</span>
            </button>
            <button
              type="button"
              className={styles.mobileActionDangerItem}
              onClick={handleDelete}
              disabled={status !== "idle"}
            >
              <Trash2 className={styles.actionButtonIcon} strokeWidth={1.9} />
              <span>Delete workout</span>
            </button>
          </PopoverContent>
        </Popover>
      </div>
      <InlineFeedback feedback={copyFeedback} className="w-[min(16rem,55vw)] text-left" />
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
