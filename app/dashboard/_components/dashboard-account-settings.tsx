"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { styles } from "../dashboard.styles";

type DashboardAccountSettingsProps = {
  currentEmail: string;
};

type MutationResponse = { ok?: boolean; error?: string; email?: string };

async function readResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as MutationResponse | null;
  const ok = response.ok && payload?.ok === true;
  return { ok, payload };
}

export function DashboardAccountSettings({ currentEmail }: DashboardAccountSettingsProps) {
  const router = useRouter();

  const [emailValue, setEmailValue] = useState(currentEmail);
  const [emailPassword, setEmailPassword] = useState("");
  const [emailPending, setEmailPending] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePending, setDeletePending] = useState(false);

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (emailPending) return;

    setEmailPending(true);
    const toastId = toast.loading("Updating email...");

    try {
      const response = await fetch("/api/profile/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, currentPassword: emailPassword }),
      });
      const { ok, payload } = await readResponse(response);

      if (!ok) {
        throw new Error(payload?.error ?? "Unable to change email.");
      }

      setEmailPassword("");
      toast.success("Email updated.", { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to change email.", { id: toastId });
    } finally {
      setEmailPending(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (passwordPending) return;

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setPasswordPending(true);
    const toastId = toast.loading("Updating password...");

    try {
      const response = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const { ok, payload } = await readResponse(response);

      if (!ok) {
        throw new Error(payload?.error ?? "Unable to change password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to change password.", { id: toastId });
    } finally {
      setPasswordPending(false);
    }
  }

  async function handleDeleteSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (deletePending) return;

    setDeletePending(true);
    const toastId = toast.loading("Deleting account...");

    try {
      const response = await fetch("/api/profile/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: deletePassword }),
      });
      const { ok, payload } = await readResponse(response);

      if (!ok) {
        throw new Error(payload?.error ?? "Unable to delete account.");
      }

      toast.success("Account deleted.", { id: toastId });
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete account.", { id: toastId });
      setDeletePending(false);
    }
  }

  return (
    <div className={styles.accountBody}>
      <section className={styles.accountSection} aria-label="Change email">
        <div>
          <h3 className={styles.accountSectionTitle}>Change email</h3>
          <p className={styles.accountSectionHint}>
            Confirm with your current password. Your username stays the same.
          </p>
        </div>
        <form className={styles.accountForm} onSubmit={handleEmailSubmit}>
          <label className={styles.profileField}>
            <span>New email</span>
            <input
              className={styles.profileInput}
              type="email"
              autoComplete="email"
              value={emailValue}
              onChange={(event) => setEmailValue(event.target.value)}
            />
          </label>
          <label className={styles.profileField}>
            <span>Current password</span>
            <input
              className={styles.profileInput}
              type="password"
              autoComplete="current-password"
              value={emailPassword}
              onChange={(event) => setEmailPassword(event.target.value)}
            />
          </label>
        </form>
        <div className={styles.accountActions}>
          <button
            type="button"
            className={styles.accountActionButton}
            disabled={emailPending}
            aria-busy={emailPending}
            onClick={handleEmailSubmit}
          >
            Update email
          </button>
        </div>
      </section>

      <section className={styles.accountSection} aria-label="Change password">
        <div>
          <h3 className={styles.accountSectionTitle}>Change password</h3>
          <p className={styles.accountSectionHint}>Use at least 8 characters.</p>
        </div>
        <form className={styles.accountForm} onSubmit={handlePasswordSubmit}>
          <label className={styles.profileField}>
            <span>Current password</span>
            <input
              className={styles.profileInput}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
          <span aria-hidden="true" className="hidden min-[900px]:block" />
          <label className={styles.profileField}>
            <span>New password</span>
            <input
              className={styles.profileInput}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <label className={styles.profileField}>
            <span>Confirm new password</span>
            <input
              className={styles.profileInput}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
        </form>
        <div className={styles.accountActions}>
          <button
            type="button"
            className={styles.accountActionButton}
            disabled={passwordPending}
            aria-busy={passwordPending}
            onClick={handlePasswordSubmit}
          >
            Update password
          </button>
        </div>
      </section>

      <section className={styles.dangerSection} aria-label="Delete account">
        <div>
          <h3 className={styles.dangerTitle}>Delete account</h3>
          <p className={styles.accountSectionHint}>
            Permanently removes your account and all workouts, splits, and nutrition
            data. This cannot be undone.
          </p>
        </div>

        {deleteOpen ? (
          <form className={styles.accountForm} onSubmit={handleDeleteSubmit}>
            <label className={styles.profileField}>
              <span>Confirm password</span>
              <input
                className={styles.profileInput}
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
              />
            </label>
            <div className={`${styles.accountActions} min-[900px]:col-span-2`}>
              <button
                type="button"
                className={styles.accountActionButton}
                onClick={() => {
                  setDeleteOpen(false);
                  setDeletePassword("");
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.dangerButton}
                disabled={deletePending || deletePassword.length === 0}
                aria-busy={deletePending}
              >
                Permanently delete
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.accountActions}>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => setDeleteOpen(true)}
            >
              Delete account
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
