"use client";

import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonNote,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useState } from "react";
import { USERNAME_RULE_MESSAGE } from "@/lib/username";
import type {
  IonicAccountUser,
  IonicProfileIdentityInput,
} from "./ionic-account.types";

type IonicProfileEditModalProps = {
  isOpen: boolean;
  profile: IonicAccountUser;
  isSaving: boolean;
  onClose: () => void;
  onSave: (next: IonicProfileIdentityInput) => Promise<boolean>;
};

export function IonicProfileEditModal({
  isOpen,
  profile,
  isSaving,
  onClose,
  onSave,
}: IonicProfileEditModalProps) {
  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
  const [username, setUsername] = useState(profile.username);

  async function handleSave() {
    const saved = await onSave({
      firstName,
      lastName,
      username: username.trim(),
      // Visibility is owned by the toggle on the profile list; an identity save
      // must carry the stored value forward rather than flip it.
      publicProfileEnabled: profile.publicProfileEnabled,
    });

    if (saved) {
      onClose();
    }
  }

  return (
    <IonModal
      isOpen={isOpen}
      canDismiss={!isSaving}
      onIonModalWillPresent={() => {
        // Re-seed on every open so a cancelled edit never comes back as a
        // stale draft that a later save could commit.
        setFirstName(profile.firstName ?? "");
        setLastName(profile.lastName ?? "");
        setUsername(profile.username);
      }}
      onIonModalDidDismiss={onClose}
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton disabled={isSaving} onClick={onClose}>Cancel</IonButton>
          </IonButtons>
          <IonTitle>Edit profile</IonTitle>
          <IonButtons slot="end">
            <IonButton
              strong
              disabled={isSaving || username.trim() === ""}
              onClick={() => void handleSave()}
            >
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" inert={isSaving}>
        <IonList inset>
          <IonItem>
            <IonInput
              autocomplete="given-name"
              label="First name"
              labelPlacement="stacked"
              maxlength={40}
              value={firstName}
              onIonInput={(event) => setFirstName(event.detail.value ?? "")}
            />
          </IonItem>
          <IonItem>
            <IonInput
              autocomplete="family-name"
              label="Last name"
              labelPlacement="stacked"
              maxlength={40}
              value={lastName}
              onIonInput={(event) => setLastName(event.detail.value ?? "")}
            />
          </IonItem>
          <IonItem>
            <IonInput
              autocapitalize="none"
              autocomplete="username"
              label="Username"
              labelPlacement="stacked"
              maxlength={24}
              spellcheck={false}
              value={username}
              onIonInput={(event) => setUsername(event.detail.value ?? "")}
            />
          </IonItem>
        </IonList>

        <IonNote className="ion-margin-start">{USERNAME_RULE_MESSAGE}</IonNote>
      </IonContent>
    </IonModal>
  );
}
