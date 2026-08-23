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
  const [openSection, setOpenSection] = useState<"email" | "password" | null>(null);

  const [emailValue, setEmailValue] = useState(currentEmail);
  const [emailPassword, setEmailPassword] = useState("");
  const [emailPending, setEmailPending] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);

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

  return (
    <>
      {/* Two always-open forms made this the heaviest screen in the app. Each is
          now a row that states the current value and opens on request. */}
      <div className={styles.accountRow}>
        <span className={styles.accountRowLabel}>Email</span>
        <span className={styles.accountRowValue}>{currentEmail}</span>
        <button
          type="button"
          className={styles.accountRowAction}
          onClick={() => setOpenSection(openSection === "email" ? null : "email")}
        >
          {openSection === "email" ? "Cancel" : "Change"}
        </button>
      </div>

      {openSection === "email" ? (
        <form className={styles.accountDisclosure} onSubmit={handleEmailSubmit}>
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
          <button
            type="submit"
            className={styles.profileSaveButton}
            disabled={emailPending}
          >
            Update email
          </button>
        </form>
      ) : null}

      <div className={styles.accountRow}>
        <span className={styles.accountRowLabel}>Password</span>
        <span className={styles.accountRowValue}>••••••••</span>
        <button
          type="button"
          className={styles.accountRowAction}
          onClick={() => setOpenSection(openSection === "password" ? null : "password")}
        >
          {openSection === "password" ? "Cancel" : "Change"}
        </button>
      </div>

      {openSection === "password" ? (
        <form className={styles.accountDisclosure} onSubmit={handlePasswordSubmit}>
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
          <p className={styles.statLineMuted}>Use at least 8 characters.</p>
          <button
            type="submit"
            className={styles.profileSaveButton}
            disabled={passwordPending}
          >
            Update password
          </button>
        </form>
      ) : null}
    </>
  );
}
