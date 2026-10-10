"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InlineFeedback, type Feedback } from "@/app/components/inline-feedback";
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
  const [emailFeedback, setEmailFeedback] = useState<Feedback | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback | null>(null);

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (emailPending) return;

    setEmailPending(true);
    setEmailFeedback(null);

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
      setOpenSection(null);
      router.refresh();
    } catch (error) {
      setEmailFeedback({ tone: "error", message: error instanceof Error ? error.message : "Unable to change email." });
    } finally {
      setEmailPending(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (passwordPending) return;
    setPasswordFeedback(null);

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ tone: "error", message: "New passwords do not match." });
      return;
    }

    setPasswordPending(true);

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
      setOpenSection(null);
    } catch (error) {
      setPasswordFeedback({ tone: "error", message: error instanceof Error ? error.message : "Unable to change password." });
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
          disabled={emailPending || passwordPending}
          onClick={() => {
            setEmailFeedback(null);
            setOpenSection(openSection === "email" ? null : "email");
          }}
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
              disabled={emailPending}
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
              disabled={emailPending}
              onChange={(event) => setEmailPassword(event.target.value)}
            />
          </label>
          <InlineFeedback feedback={emailFeedback} />
          <button
            type="submit"
            className={styles.profileSaveButton}
            disabled={emailPending}
          >
            {emailPending ? "Updating email..." : "Update email"}
          </button>
        </form>
      ) : null}

      <div className={styles.accountRow}>
        <span className={styles.accountRowLabel}>Password</span>
        <span className={styles.accountRowValue}>••••••••</span>
        <button
          type="button"
          className={styles.accountRowAction}
          disabled={emailPending || passwordPending}
          onClick={() => {
            setPasswordFeedback(null);
            setOpenSection(openSection === "password" ? null : "password");
          }}
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
              disabled={passwordPending}
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
              disabled={passwordPending}
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
              disabled={passwordPending}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          <p className={styles.statLineMuted}>Use at least 8 characters.</p>
          <InlineFeedback feedback={passwordFeedback} />
          <button
            type="submit"
            className={styles.profileSaveButton}
            disabled={passwordPending}
          >
            {passwordPending ? "Updating password..." : "Update password"}
          </button>
        </form>
      ) : null}
    </>
  );
}
