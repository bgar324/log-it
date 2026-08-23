"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { styles } from "../dashboard.styles";
import type { DashboardProfileFormState } from "../_hooks/use-dashboard-profile-form";
import { DashboardAccountSettings } from "./dashboard-account-settings";
import { DashboardDeleteAccount } from "./dashboard-delete-account";
import { DashboardProfileAvatarEditor } from "./dashboard-profile-avatar-editor";
import { DashboardProfileEditDialog } from "./dashboard-profile-edit-dialog";

type DashboardProfileViewProps = {
  state: DashboardProfileFormState;
};

export function DashboardProfileView({ state }: DashboardProfileViewProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const avatarUrl = state.profile.profileImageUpdatedAt
    ? `/api/profile/avatar?v=${encodeURIComponent(state.profile.profileImageUpdatedAt)}`
    : null;
  const displayedAvatarUrl = state.avatarRemovalPending
    ? null
    : state.avatarPreviewUrl ?? avatarUrl;
  const displayName =
    [state.profile.firstName, state.profile.lastName]
      .map((value) => (value ?? "").trim())
      .filter(Boolean)
      .join(" ") || state.profile.username;

  return (
    <>
      <section className={styles.profileIdentity}>
        <DashboardProfileAvatarEditor
          displayedAvatarUrl={displayedAvatarUrl}
          hasAvatar={Boolean(displayedAvatarUrl)}
          isSaving={state.isSaving}
          onAvatarDelete={state.handleAvatarDelete}
          onAvatarFileChange={state.handleAvatarFileChange}
        />

        <div className={styles.profileIdentityText}>
          <div className={styles.profileNameRow}>
            <p className={styles.profileName}>{displayName}</p>
            <button
              type="button"
              className={styles.profileEditButton}
              onClick={() => setIsEditOpen(true)}
            >
              <Pencil className={styles.buttonInlineIcon} strokeWidth={1.9} />
            </button>
          </div>
          <p className={styles.profileMeta}>
            @{state.profile.username} · joined {state.profile.joinedAtLabel}
            {state.profile.publicProfileEnabled ? " · public" : " · private"}
          </p>
        </div>
      </section>

      <section>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Account</h2>
        </div>
        <DashboardAccountSettings currentEmail={state.profile.email} />
      </section>

      {/* Irreversible actions get their own tinted, bordered zone so they read
          as a different class of control from everything above. */}
      <section className={styles.dangerZone}>
        <h2 className={styles.dangerZoneTitle}>Danger zone</h2>
        <p className={styles.dangerZoneText}>
          Deleting your account removes every workout, split, and nutrition entry.
          This cannot be undone.
        </p>
        <DashboardDeleteAccount
          username={state.profile.username}
          className={styles.profileDeleteButton}
        />
      </section>

      {isEditOpen ? (
        <DashboardProfileEditDialog state={state} onClose={() => setIsEditOpen(false)} />
      ) : null}
    </>
  );
}
