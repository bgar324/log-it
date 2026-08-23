"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { styles } from "../dashboard.styles";

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
  const [confirmValue, setConfirmValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const matches = confirmValue.trim().toLowerCase() === username.toLowerCase();

  function close() {
    if (isDeleting) return;
    setIsOpen(false);
    setConfirmValue("");
  }

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isDeleting]);

  async function handleDelete(event: React.FormEvent) {
    event.preventDefault();
    if (isDeleting || !matches) return;

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

  const modal = isOpen ? (
    <div className={styles.avatarModalOverlay} onClick={close}>
      <div
        className={styles.avatarModal}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.avatarModalHead}>
          <h2 className={styles.dangerTitle}>
            Delete account
          </h2>
          <button
            type="button"
            className={styles.avatarModalClose}
            onClick={close}
          >
            <X className={styles.buttonInlineIcon} strokeWidth={1.9} />
          </button>
        </div>

        <p className={styles.deleteModalText}>
          This permanently deletes your account and all workouts, splits, and
          nutrition data. This cannot be undone.
        </p>

        <form className={styles.accountDisclosure} onSubmit={handleDelete}>
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
              autoFocus
            />
          </label>
          <div className={styles.avatarModalFooter}>
            <button type="button" className={styles.dialogCancelButton} onClick={close}>
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
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        className={className ?? styles.dangerButton}
        onClick={() => setIsOpen(true)}
      >
        Delete account
      </button>

      {modal && typeof document !== "undefined" ? createPortal(modal, document.body) : null}
    </>
  );
}
