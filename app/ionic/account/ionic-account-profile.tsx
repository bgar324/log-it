"use client";

import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonToggle,
} from "@ionic/react";
import { openOutline, pencilOutline } from "ionicons/icons";
import { useState } from "react";
import { IonicAccountSecurity } from "./ionic-account-security";
import { IonicAvatarEditor } from "./ionic-avatar-editor";
import { IonicDeleteAccount } from "./ionic-delete-account";
import { IonicProfileEditModal } from "./ionic-profile-edit-modal";
import type { IonicNotify, IonicProfileFormState } from "./ionic-account.types";

type IonicAccountProfileProps = {
  state: IonicProfileFormState;
  notify: IonicNotify;
  onRefresh: () => void;
};

export function IonicAccountProfile({
  state,
  notify,
  onRefresh,
}: IonicAccountProfileProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [pendingPublic, setPendingPublic] = useState<boolean | null>(null);
  const isPublicInput = pendingPublic ?? state.profile.publicProfileEnabled;

  const displayName =
    [state.profile.firstName, state.profile.lastName]
      .map((value) => (value ?? "").trim())
      .filter(Boolean)
      .join(" ") || state.profile.username;

  // The toggle moves first and rolls back on failure: a preference write only
  // ever carries the stored profile, so nothing else can ride along with it.
  async function togglePublicProfile(nextValue: boolean) {
    setPendingPublic(nextValue);
    await state.savePreference({ publicProfileEnabled: nextValue });
    setPendingPublic(null);
  }

  return (
    <>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "16px",
          padding: "8px 4px 4px",
        }}
      >
        <IonicAvatarEditor
          displayedAvatarUrl={state.displayedAvatarUrl}
          hasAvatar={state.hasAvatar}
          isSaving={state.isSaving}
          onAvatarDelete={state.handleAvatarDelete}
          onAvatarFileChange={state.handleAvatarFileChange}
        />

        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0 }}>{displayName}</h1>
          <IonNote>
            @{state.profile.username} · joined {state.profile.joinedAtLabel}
          </IonNote>
        </div>

        <IonButton
          aria-label="Edit profile"
          fill="clear"
          style={{ marginInlineStart: "auto" }}
          onClick={() => setIsEditOpen(true)}
        >
          <IonIcon slot="icon-only" icon={pencilOutline} />
        </IonButton>
      </div>

      <IonListHeader>
        <IonLabel>Public profile</IonLabel>
      </IonListHeader>

      <IonList inset>
        <IonItem>
          <IonToggle
            checked={isPublicInput}
            disabled={state.isSaving}
            onIonChange={(event) =>
              void togglePublicProfile(event.detail.checked)
            }
          >
            Show my profile publicly
          </IonToggle>
        </IonItem>
        {isPublicInput ? (
          <IonItem
            detail
            href={`/u/${encodeURIComponent(state.profile.username)}`}
            rel="noreferrer"
            target="_blank"
            detailIcon={openOutline}
          >
            <IonLabel>
              <h3>View public profile</h3>
              <p>/u/{state.profile.username}</p>
            </IonLabel>
          </IonItem>
        ) : null}
      </IonList>

      <IonNote className="ion-margin-start">
        {isPublicInput
          ? "Anyone with your link can see your training summary. Your email stays private."
          : "Your profile is private. Nobody else can open your training summary."}
      </IonNote>

      <IonListHeader>
        <IonLabel>Account</IonLabel>
      </IonListHeader>

      <IonicAccountSecurity
        currentEmail={state.profile.email}
        notify={notify}
        onRefresh={onRefresh}
      />

      <IonListHeader>
        <IonLabel color="danger">Danger zone</IonLabel>
      </IonListHeader>

      <div className="ion-padding-horizontal">
        <IonNote>
          Deleting your account removes every workout, split, and nutrition
          entry. This cannot be undone.
        </IonNote>

        <div className="ion-margin-top">
          <IonicDeleteAccount
            username={state.profile.username}
            notify={notify}
          />
        </div>
      </div>

      <IonicProfileEditModal
        isOpen={isEditOpen}
        profile={state.profile}
        isSaving={state.isSaving}
        onClose={() => setIsEditOpen(false)}
        onSave={state.saveIdentity}
      />
    </>
  );
}
