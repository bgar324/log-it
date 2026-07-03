"use client";

import Link from "next/link";
import type { WeightUnit } from "@/lib/weight-unit";
import { styles } from "../dashboard.styles";
import type { DashboardProfileFormState } from "../_hooks/use-dashboard-profile-form";
import { DashboardAccountSettings } from "./dashboard-account-settings";
import { DashboardDeleteAccount } from "./dashboard-delete-account";
import { DashboardProfileAvatarEditor } from "./dashboard-profile-avatar-editor";

type DashboardProfileViewProps = {
  state: DashboardProfileFormState;
};

export function DashboardProfileView({ state }: DashboardProfileViewProps) {
  const avatarUrl =
    state.profile.profileImageUpdatedAt
      ? `/api/profile/avatar?v=${encodeURIComponent(state.profile.profileImageUpdatedAt)}`
      : null;
  const displayedAvatarUrl = state.avatarRemovalPending
    ? null
    : state.avatarPreviewUrl ?? avatarUrl;
  const hasAvatar = Boolean(displayedAvatarUrl);
  const isSaving = state.saveState.kind === "saving";
  const displayName =
    [state.firstNameInput, state.lastNameInput].map((value) => value.trim()).filter(Boolean).join(" ") ||
    state.profile.username;

  return (
    <section className={styles.profilePanel}>
      <div className={styles.profileBody}>
        <aside className={styles.profileIdentityPanel}>
          <DashboardProfileAvatarEditor
            displayedAvatarUrl={displayedAvatarUrl}
            hasAvatar={hasAvatar}
            isSaving={isSaving}
            onAvatarDelete={state.handleAvatarDelete}
            onAvatarFileChange={state.handleAvatarFileChange}
          />

          <div className={styles.profileIdentityText}>
            <p className={styles.profileRailName}>{displayName}</p>
            <Link
              href={`/u/${encodeURIComponent(state.profile.username)}`}
              className={styles.profileRailMeta}
            >
              @{state.profile.username}
            </Link>
          </div>

          <p className={styles.profileJoinedMeta}>Joined {state.profile.joinedAtLabel}</p>
        </aside>

        <div className={styles.profileEditorPanel}>
          <form
            id="profileSettingsForm"
            className={styles.profileForm}
            onSubmit={state.handleProfileSave}
          >
            <label className={styles.profileField} htmlFor="profileFirstName">
              <span>First name</span>
              <input
                id="profileFirstName"
                className={styles.profileInput}
                value={state.firstNameInput}
                onChange={(event) => state.setFirstNameInput(event.target.value)}
                maxLength={40}
              />
            </label>

            <label className={styles.profileField} htmlFor="profileLastName">
              <span>Last name</span>
              <input
                id="profileLastName"
                className={styles.profileInput}
                value={state.lastNameInput}
                onChange={(event) => state.setLastNameInput(event.target.value)}
                maxLength={40}
              />
            </label>

            <label className={styles.profileField}>
              <span>Username</span>
              <input className={styles.profileInput} value={state.profile.username} readOnly />
            </label>

            <label className={styles.profileField}>
              <span>Email</span>
              <input className={styles.profileInput} value={state.profile.email} readOnly />
            </label>

            <label className={styles.profileField} htmlFor="profileWeightUnit">
              <span>Weight unit</span>
              <select
                id="profileWeightUnit"
                className={styles.profileInput}
                value={state.preferredWeightUnitInput}
                onChange={(event) =>
                  state.setPreferredWeightUnitInput(event.target.value as WeightUnit)
                }
              >
                <option value="LB">Pounds (lb)</option>
                <option value="KG">Kilograms (kg)</option>
              </select>
            </label>

            <label className={styles.profileField} htmlFor="profileVisibility">
              <span>Visibility</span>
              <select
                id="profileVisibility"
                className={styles.profileInput}
                value={state.publicProfileEnabledInput ? "public" : "private"}
                onChange={(event) =>
                  state.setPublicProfileEnabledInput(event.target.value === "public")
                }
              >
                <option value="public">Public profile</option>
                <option value="private">Private profile</option>
              </select>
            </label>
          </form>

          <div className={styles.profileFooter}>
            <div className={styles.profileActions}>
              <button
                type="submit"
                form="profileSettingsForm"
                className={styles.profileSaveButton}
                disabled={isSaving}
                aria-busy={isSaving}
              >
                Save profile
              </button>

              <form method="post" action="/auth/signout" className={styles.profileActionForm}>
                <button type="submit" className={styles.profileSignOutButton}>
                  Sign out
                </button>
              </form>
            </div>

            <DashboardDeleteAccount username={state.profile.username} />
          </div>
        </div>
      </div>

      <DashboardAccountSettings currentEmail={state.profile.email} />
    </section>
  );
}
