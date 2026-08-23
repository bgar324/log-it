"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useId, useState } from "react";
import { USERNAME_RULE_MESSAGE } from "@/lib/username";
import { styles } from "../dashboard.styles";
import type { DashboardProfileFormState } from "../_hooks/use-dashboard-profile-form";

type DashboardProfileEditDialogProps = {
  state: DashboardProfileFormState;
  onClose: () => void;
};

export function DashboardProfileEditDialog({
  state,
  onClose,
}: DashboardProfileEditDialogProps) {
  const titleId = useId();
  const [firstName, setFirstName] = useState(state.profile.firstName ?? "");
  const [lastName, setLastName] = useState(state.profile.lastName ?? "");
  const [username, setUsername] = useState(state.profile.username);
  const [isPublic, setIsPublic] = useState(state.profile.publicProfileEnabled);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const saved = await state.saveIdentity({
      firstName,
      lastName,
      username: username.trim(),
      publicProfileEnabled: isPublic,
    });

    if (saved) {
      onClose();
    }
  }
  return createPortal(
    <div className={styles.avatarModalOverlay} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.avatarModal}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.avatarModalHead}>
          <h2 id={titleId} className={styles.sectionTitle}>
            Edit profile
          </h2>
          <button
            type="button"
            className={styles.avatarModalClose}
            onClick={onClose}
            aria-label="Close edit profile dialog"
          >
            <X className={styles.buttonInlineIcon} aria-hidden="true" strokeWidth={1.9} />
          </button>
        </div>

      <form className={styles.accountDisclosure} onSubmit={handleSubmit}>
        <label className={styles.profileField}>
          <span>First name</span>
          <input
            className={styles.profileInput}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            maxLength={40}
            autoComplete="given-name"
          />
        </label>

        <label className={styles.profileField}>
          <span>Last name</span>
          <input
            className={styles.profileInput}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            maxLength={40}
            autoComplete="family-name"
          />
        </label>

        <label className={styles.profileField}>
          <span>Username</span>
          <input
            className={styles.profileInput}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={24}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="username"
          />
          <span>{USERNAME_RULE_MESSAGE}</span>
        </label>

        <label className={styles.profileField}>
          <span>Profile visibility</span>
          <select
            className={styles.profileInput}
            value={isPublic ? "public" : "private"}
            onChange={(event) => setIsPublic(event.target.value === "public")}
          >
            <option value="public">Public profile</option>
            <option value="private">Private profile</option>
          </select>
        </label>

        <div className={styles.avatarModalFooter}>
          <button
            type="button"
            className={styles.dialogCancelButton}
            onClick={onClose}
            disabled={state.isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.profileSaveButton}
            disabled={state.isSaving}
            aria-busy={state.isSaving}
          >
            Save changes
          </button>
        </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
