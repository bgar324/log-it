"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import posthog from "posthog-js";
import { LegacyDialog } from "@/app/components/ui/legacy-dialog";
import { styles } from "@/app/_legacy/dashboard/dashboard.styles";

type DashboardDeleteAccountProps = {
  username: string;
  className?: string;
};

export function DashboardDeleteAccount({
  username,
  className,
}: DashboardDeleteAccountProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(confirmValue: string) {
    setIsDeleting(true);
    const toastId = toast.loading("Deleting account...");

    try {
      const response = await fetch("/api/profile/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: confirmValue }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error ?? "Unable to delete account.");
      }

      posthog.capture("account_deleted");
      posthog.reset();
      toast.success("Account deleted.", { id: toastId });
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete account.", {
        id: toastId,
      });
      setIsDeleting(false);
    }
  }

  // The delete is already in flight and the page is about to be replaced: no
  // control in this dialog — scrim, Escape, X, or Cancel — may drop it.
  function requestOpenChange(next: boolean) {
    if (isDeleting) {
      return;
    }

    setIsOpen(next);
  }

  return (
    <>
      <button
        type="button"
        className={className ?? styles.dangerButton}
        onClick={() => setIsOpen(true)}
      >
        Delete account
      </button>

      <LegacyDialog
        open={isOpen}
        onOpenChange={requestOpenChange}
        title="Delete account"
        overlayClassName={styles.avatarModalOverlay}
        contentClassName={styles.avatarModal}
        // A delete in flight cannot be dismissed: the request is already gone
        // and the page is about to be replaced.
        busy={isDeleting}
      >
        <DashboardDeleteAccountForm
          username={username}
          isDeleting={isDeleting}
          onCancel={() => requestOpenChange(false)}
          onDelete={(confirmValue) => void handleDelete(confirmValue)}
        />
      </LegacyDialog>
    </>
  );
}

/**
 * The typed confirmation lives in the panel, so it is empty again every time
 * the dialog opens and is never left sitting behind a closed dialog.
 */
function DashboardDeleteAccountForm({
  username,
  isDeleting,
  onCancel,
  onDelete,
}: {
  username: string;
  isDeleting: boolean;
  onCancel: () => void;
  onDelete: (confirmValue: string) => void;
}) {
  const [confirmValue, setConfirmValue] = useState("");
  const matches = confirmValue.trim().toLowerCase() === username.toLowerCase();

  return (
    <>
      <div className={styles.avatarModalHead}>
        <h2 className={styles.dangerTitle}>
          Delete account
        </h2>
        <button
          type="button"
          aria-label="Close delete account"
          className={styles.avatarModalClose}
          disabled={isDeleting}
          onClick={onCancel}
        >
          <X className={styles.buttonInlineIcon} strokeWidth={1.9} />
        </button>
      </div>

      <p className={styles.deleteModalText}>
        This permanently deletes your account and all workouts, splits, and
        nutrition data. This cannot be undone.
      </p>

      <form
        className={styles.accountDisclosure}
        onSubmit={(event) => {
          event.preventDefault();

          if (isDeleting || !matches) {
            return;
          }

          onDelete(confirmValue);
        }}
      >
        <label className={styles.profileField}>
          <span>
            Type your username{" "}
            <span className={styles.deleteModalStrong}>{username}</span> to confirm
          </span>
          <input
            className={styles.profileInput}
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={confirmValue}
            onChange={(event) => setConfirmValue(event.target.value)}
          />
        </label>
        <div className={styles.avatarModalFooter}>
          <button
            type="button"
            className={styles.dialogCancelButton}
            disabled={isDeleting}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.dangerButton}
            disabled={!matches || isDeleting}
          >
            Permanently delete
          </button>
        </div>
      </form>
    </>
  );
}
