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
import posthog from "posthog-js";
import { useState } from "react";
import type { IonicNotify } from "./ionic-account.types";

type IonicDeleteAccountProps = {
  username: string;
  notify: IonicNotify;
};

export function IonicDeleteAccount({
  username,
  notify,
}: IonicDeleteAccountProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const matches = confirmValue.trim().toLowerCase() === username.toLowerCase();

  async function handleDelete() {
    if (isDeleting || !matches) {
      return;
    }

    setIsDeleting(true);

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

      posthog.capture("account_deleted");
      posthog.reset();
      // The route clears the session cookie, so the app shell no longer has an
      // account to render: leave the Ionic router entirely.
      window.location.replace("/");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to delete account.",
        "error",
      );
      setIsDeleting(false);
    }
  }

  return (
    <>
      <IonButton
        expand="block"
        color="danger"
        fill="outline"
        onClick={() => setIsOpen(true)}
      >
        Delete account
      </IonButton>

      <IonModal
        // A delete in flight replaces the session; dismissing mid-request would
        // strand the confirmation without cancelling anything.
        backdropDismiss={!isDeleting}
        canDismiss={!isDeleting}
        isOpen={isOpen}
        onIonModalWillPresent={() => setConfirmValue("")}
        onIonModalDidDismiss={() => {
          setIsOpen(false);
          setConfirmValue("");
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton
                disabled={isDeleting}
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </IonButton>
            </IonButtons>
            <IonTitle>Delete account</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding" inert={isDeleting}>
          <p>
            This permanently deletes your account and every workout, split, and
            nutrition entry. It cannot be undone.
          </p>

          <IonList inset>
            <IonItem>
              <IonInput
                autocapitalize="none"
                autocomplete="off"
                label={`Type ${username} to confirm`}
                labelPlacement="stacked"
                spellcheck={false}
                value={confirmValue}
                onIonInput={(event) =>
                  setConfirmValue(event.detail.value ?? "")
                }
              />
            </IonItem>
          </IonList>

          <IonNote className="ion-margin-start">
            The username has to match exactly.
          </IonNote>

          <IonButton
            expand="block"
            color="danger"
            className="ion-margin-top"
            disabled={!matches || isDeleting}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? "Deleting..." : "Permanently delete"}
          </IonButton>
        </IonContent>
      </IonModal>
    </>
  );
}
