"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { copyTextToClipboard } from "@/lib/clipboard";
import styles from "./workout-detail.module.css";

type WorkoutDetailActionsProps = {
  workoutId: string;
  workoutExport: string;
};

export function WorkoutDetailActions({
  workoutId,
  workoutExport,
}: WorkoutDetailActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "duplicating" | "deleting">(
    "idle",
  );
  const [feedback, setFeedback] = useState<{
    kind: "idle" | "success" | "error";
    message: string;
  }>({ kind: "idle", message: "" });

  async function handleCopy() {
    if (status !== "idle") {
      return;
    }

    try {
      await copyTextToClipboard(workoutExport);
      setFeedback({
        kind: "success",
        message: "Copied workout to clipboard.",
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

  async function handleDuplicate() {
    if (status !== "idle") {
      return;
    }

    setStatus("duplicating");
    setFeedback({ kind: "idle", message: "" });

    try {
      const response = await fetch(`/api/workouts/${workoutId}/duplicate`, {
        method: "POST",
      });
      const payload = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !payload.id) {
        throw new Error(payload.error ?? "Unable to duplicate workout.");
      }

      router.push(`/workouts/${payload.id}/edit`);
      router.refresh();
    } catch (caughtError) {
      setFeedback({
        kind: "error",
        message:
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to duplicate workout.",
      });
      setStatus("idle");
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
    <div className={styles.detailActionsGroup}>
      <button
        type="button"
        className={styles.actionButton}
        onClick={() => void handleCopy()}
        disabled={status !== "idle"}
      >
        Copy workout
      </button>
      <button
        type="button"
        className={styles.actionButton}
        onClick={handleDuplicate}
        disabled={status !== "idle"}
      >
        {status === "duplicating" ? "Duplicating..." : "Duplicate workout"}
      </button>
      <button
        type="button"
        className={`${styles.actionButton} ${styles.dangerActionButton}`}
        onClick={handleDelete}
        disabled={status !== "idle"}
      >
        {status === "deleting" ? "Deleting..." : "Delete workout"}
      </button>
      {feedback.kind !== "idle" ? (
        <p
          className={`${styles.actionStatus} ${
            feedback.kind === "success"
              ? styles.actionStatusSuccess
              : styles.actionStatusError
          }`}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
