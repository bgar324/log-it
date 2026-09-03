"use client";

import { Copy, Ellipsis, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import posthog from "posthog-js";
import { copyTextToClipboard } from "@/lib/clipboard";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import { styles } from "./workout-detail.styles";

type WorkoutDetailActionsProps = {
  editHref: string;
  workoutId: string;
  workoutExport: string;
};

export function WorkoutDetailActions({
  editHref,
  workoutId,
  workoutExport,
}: WorkoutDetailActionsProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"idle" | "deleting">("idle");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isMenuOpen]);

  async function handleCopy() {
    if (status !== "idle") {
      return;
    }

    const toastId = toast.loading("Copying workout...");

    try {
      setIsMenuOpen(false);
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
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to copy workout.",
        { id: toastId },
      );
    }
  }

  async function deleteWorkout(toastId: string | number) {
    if (status !== "idle") {
      return;
    }

    toast.loading("Deleting workout...", { id: toastId });
    setStatus("deleting");
    setIsMenuOpen(false);

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
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to delete workout.",
        { id: toastId },
      );
      setStatus("idle");
    }
  }

  function handleDelete() {
    if (status !== "idle") {
      return;
    }

    setIsMenuOpen(false);
    const toastId = toast("Delete this workout?", {
      description: "This cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => void deleteWorkout(toastId),
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.dismiss(toastId),
      },
    });
  }

  return (
    <>
      <div className={styles.detailActionsGroup}>
        <Link href={editHref} className={`relative ${styles.actionButton}`}>
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
      <div className={styles.mobileActionMenu} ref={menuRef}>
        <button
          type="button"
          className={styles.mobileActionToggle}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <Ellipsis className={styles.actionButtonIcon} strokeWidth={1.9} />
        </button>
        {isMenuOpen ? (
          <div className={styles.mobileActionDropdown}>
            <Link
              href={editHref}
              className={`relative ${styles.mobileActionMenuItem}`}
              onClick={() => setIsMenuOpen(false)}
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
          </div>
        ) : null}
      </div>
    </>
  );
}
