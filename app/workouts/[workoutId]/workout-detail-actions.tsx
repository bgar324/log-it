"use client";

import { Copy, Ellipsis, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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

      toast.success("Workout deleted.", { id: toastId });
      router.push("/workouts");
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
        <Link href={editHref} className={`relative ${styles.actionLink}`} aria-label="Edit workout">
          <SquarePen
            className={styles.actionButtonIcon}
            aria-hidden="true"
            strokeWidth={1.9}
          />
          <span className={styles.actionButtonLabel}>Edit workout</span>
          <LinkPendingOverlay />
        </Link>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => void handleCopy()}
          disabled={status !== "idle"}
          aria-label="Copy workout"
        >
          <Copy className={styles.actionButtonIcon} aria-hidden="true" strokeWidth={1.9} />
          <span className={`${styles.actionButtonLabel} text-[0.76rem]`}>Copy workout</span>
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.dangerActionButton}`}
          onClick={handleDelete}
          disabled={status !== "idle"}
          aria-label={status === "deleting" ? "Deleting workout" : "Delete workout"}
          aria-busy={status === "deleting"}
        >
          <Trash2 className={styles.actionButtonIcon} aria-hidden="true" strokeWidth={1.9} />
          <span className={styles.actionButtonLabel}>Delete workout</span>
        </button>
      </div>
      <div className={styles.mobileActionMenu} ref={menuRef}>
        <button
          type="button"
          className={styles.mobileActionToggle}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label="More workout actions"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
        >
          <Ellipsis className={styles.actionButtonIcon} aria-hidden="true" strokeWidth={1.9} />
        </button>
        {isMenuOpen ? (
          <div className={styles.mobileActionDropdown} role="menu">
            <Link
              href={editHref}
              className={`relative ${styles.mobileActionMenuItem}`}
              role="menuitem"
              onClick={() => setIsMenuOpen(false)}
            >
              <SquarePen
                className={styles.actionButtonIcon}
                aria-hidden="true"
                strokeWidth={1.9}
              />
              <span>Edit workout</span>
              <LinkPendingOverlay />
            </Link>
            <button
              type="button"
              className={styles.mobileActionMenuItem}
              onClick={() => void handleCopy()}
              disabled={status !== "idle"}
              role="menuitem"
            >
              <Copy className={styles.actionButtonIcon} aria-hidden="true" strokeWidth={1.9} />
              <span>Copy workout</span>
            </button>
            <button
              type="button"
              className={`${styles.mobileActionMenuItem} ${styles.mobileActionDangerItem}`}
              onClick={handleDelete}
              disabled={status !== "idle"}
              role="menuitem"
              aria-busy={status === "deleting"}
            >
              <Trash2 className={styles.actionButtonIcon} aria-hidden="true" strokeWidth={1.9} />
              <span>Delete workout</span>
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
