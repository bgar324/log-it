"use client";

import { Copy, Ellipsis, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { copyTextToClipboard } from "@/lib/clipboard";
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
  const [feedback, setFeedback] = useState<{
    kind: "idle" | "success" | "error";
    message: string;
  }>({ kind: "idle", message: "" });

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

  useEffect(() => {
    if (feedback.kind !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback({ kind: "idle", message: "" });
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [feedback.kind]);

  async function handleCopy() {
    if (status !== "idle") {
      return;
    }

    try {
      setIsMenuOpen(false);
      const result = await copyTextToClipboard(workoutExport);
      setFeedback({
        kind: "success",
        message:
          result === "clipboard"
            ? "Copied workout to clipboard."
            : "Clipboard blocked. Workout text opened for manual copy.",
      });
    } catch (caughtError) {
      setFeedback({
        kind: "error",
        message:
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to copy workout.",
      });
    }
  }

  async function handleDelete() {
    if (status !== "idle") {
      return;
    }

    const confirmed = window.confirm(
      "Delete this workout? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setStatus("deleting");
    setFeedback({ kind: "idle", message: "" });
    setIsMenuOpen(false);

    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete workout.");
      }

      router.push("/workouts");
      router.refresh();
    } catch (caughtError) {
      setFeedback({
        kind: "error",
        message:
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to delete workout.",
      });
      setStatus("idle");
    }
  }

  return (
    <>
      <div className={styles.detailActionsGroup}>
        <Link href={editHref} className={styles.actionLink} aria-label="Edit workout">
          <SquarePen
            className={styles.actionButtonIcon}
            aria-hidden="true"
            strokeWidth={1.9}
          />
          <span className={styles.actionButtonLabel}>Edit workout</span>
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
        >
          <Trash2 className={styles.actionButtonIcon} aria-hidden="true" strokeWidth={1.9} />
          <span className={styles.actionButtonLabel}>
            {status === "deleting" ? "Deleting..." : "Delete workout"}
          </span>
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
              className={styles.mobileActionMenuItem}
              role="menuitem"
              onClick={() => setIsMenuOpen(false)}
            >
              <SquarePen
                className={styles.actionButtonIcon}
                aria-hidden="true"
                strokeWidth={1.9}
              />
              <span>Edit workout</span>
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
            >
              <Trash2 className={styles.actionButtonIcon} aria-hidden="true" strokeWidth={1.9} />
              <span>{status === "deleting" ? "Deleting..." : "Delete workout"}</span>
            </button>
          </div>
        ) : null}
      </div>
      {feedback.kind === "success" ? (
        <div className={styles.copyToast} role="status" aria-live="polite">
          {feedback.message}
        </div>
      ) : null}
      {feedback.kind === "error" ? (
        <p
          className={`${styles.actionStatus} ${
            styles.actionStatusError
          }`}
          role="alert"
        >
          {feedback.message}
        </p>
      ) : null}
    </>
  );
}
