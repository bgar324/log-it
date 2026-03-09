"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./workout-detail.module.css";

type WorkoutDetailActionsProps = {
  workoutId: string;
};

export function WorkoutDetailActions({
  workoutId,
}: WorkoutDetailActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "duplicating" | "deleting">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleDuplicate() {
    if (status !== "idle") {
      return;
    }

    setStatus("duplicating");
    setError(null);

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
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to duplicate workout.",
      );
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
    setError(null);

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
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete workout.",
      );
      setStatus("idle");
    }
  }

  return (
    <div className={styles.detailActionsGroup}>
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
      {error ? (
        <p className={styles.actionError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
