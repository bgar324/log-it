"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { LegacyDialog } from "@/app/components/ui/legacy-dialog";
import { USERNAME_RULE_MESSAGE } from "@/lib/username";
import { styles } from "@/app/_legacy/dashboard/dashboard.styles";
import type { DashboardProfileFormState } from "@/app/dashboard/_hooks/use-dashboard-profile-form";

type DashboardProfileEditDialogProps = {
  state: DashboardProfileFormState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DashboardProfileEditDialog({
  state,
  open,
  onOpenChange,
}: DashboardProfileEditDialogProps) {
  return (
    <LegacyDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit profile"
      overlayClassName={styles.avatarModalOverlay}
      contentClassName={styles.avatarModal}
      // A profile save is in flight: the scrim, Escape, and the X all hold
      // until it lands, so the dialog cannot outlive its own request.
      busy={state.isSaving}
    >
      <DashboardProfileEditForm
        state={state}
        onClose={() => onOpenChange(false)}
      />
    </LegacyDialog>
  );
}

/**
 * The edited fields live in the panel, so they are read from the saved profile
 * every time the dialog opens and they survive the exit animation instead of
 * blanking out under the closing panel.
 */
function DashboardProfileEditForm({
  state,
  onClose,
}: {
  state: DashboardProfileFormState;
  onClose: () => void;
}) {
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

  return (
    <>
      <div className={styles.avatarModalHead}>
        <h2 className={styles.sectionTitle}>
          Edit profile
        </h2>
        <button
          type="button"
          aria-label="Close edit profile"
          className={styles.avatarModalClose}
          disabled={state.isSaving}
          onClick={onClose}
        >
          <X className={styles.buttonInlineIcon} strokeWidth={1.9} />
        </button>
      </div>

      <form className={styles.accountDisclosure} onSubmit={handleSubmit}>
        <label className={styles.profileField}>
          <span>First name</span>
          <input
            className={styles.profileInput}
            disabled={state.isSaving}
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
            disabled={state.isSaving}
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
            disabled={state.isSaving}
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
            disabled={state.isSaving}
            value={isPublic ? "public" : "private"}
            onChange={(event) => setIsPublic(event.target.value === "public")}
          >
            <option value="public">Public profile</option>
            <option value="private">Private profile</option>
          </select>
        </label>

        <div className={styles.avatarModalFooter}>
          <button
            type="submit"
            className={styles.profileSaveButton}
            disabled={state.isSaving}
          >
            Save changes
          </button>
        </div>
      </form>
    </>
  );
}
