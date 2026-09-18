"use client";

import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useState } from "react";
import type { IonicNotify } from "./ionic-account.types";

type IonicAccountSecurityProps = {
  currentEmail: string;
  notify: IonicNotify;
  onRefresh: () => void;
};

type MutationResponse = { ok?: boolean; error?: string; email?: string };

export function IonicAccountSecurity({
  currentEmail,
  notify,
  onRefresh,
}: IonicAccountSecurityProps) {
  const [openSection, setOpenSection] = useState<"email" | "password" | null>(
    null,
  );
  const [emailValue, setEmailValue] = useState(currentEmail);
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function submit(
    path: string,
    body: Record<string, string>,
    failureMessage: string,
  ) {
    const response = await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as
      | MutationResponse
      | null;

    if (!response.ok || payload?.ok !== true) {
      throw new Error(payload?.error ?? failureMessage);
    }
  }

  async function handleEmailSubmit() {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      await submit(
        "/api/profile/email",
        { email: emailValue, currentPassword: emailPassword },
        "Unable to change email.",
      );
      setEmailPassword("");
      setOpenSection(null);
      notify("Email updated.", "success");
      onRefresh();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to change email.",
        "error",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function handlePasswordSubmit() {
    if (isPending) {
      return;
    }

    if (newPassword !== confirmPassword) {
      notify("New passwords do not match.", "error");
      return;
    }

    setIsPending(true);

    try {
      await submit(
        "/api/profile/password",
        { currentPassword, newPassword, confirmPassword },
        "Unable to change password.",
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOpenSection(null);
      notify("Password updated.", "success");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to change password.",
        "error",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <IonList inset>
        <IonItem button detail onClick={() => setOpenSection("email")}>
          <IonLabel>
            <h3>Email</h3>
            <p>{currentEmail}</p>
          </IonLabel>
        </IonItem>
        <IonItem button detail onClick={() => setOpenSection("password")}>
          <IonLabel>
            <h3>Password</h3>
            <p>Changing it needs your current password.</p>
          </IonLabel>
        </IonItem>
      </IonList>

      <IonModal
        isOpen={openSection === "email"}
        canDismiss={!isPending}
        onIonModalWillPresent={() => {
          setEmailValue(currentEmail);
          setEmailPassword("");
        }}
        onIonModalDidDismiss={() => setOpenSection(null)}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton disabled={isPending} onClick={() => setOpenSection(null)}>Cancel</IonButton>
            </IonButtons>
            <IonTitle>Change email</IonTitle>
            <IonButtons slot="end">
              <IonButton
                strong
                disabled={isPending || !emailValue.trim() || !emailPassword}
                onClick={() => void handleEmailSubmit()}
              >
                Update
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding" inert={isPending}>
          <IonList inset>
            <IonItem>
              <IonInput
                autocomplete="email"
                label="New email"
                labelPlacement="stacked"
                type="email"
                value={emailValue}
                onIonInput={(event) => setEmailValue(event.detail.value ?? "")}
              />
            </IonItem>
            <IonItem>
              <IonInput
                autocomplete="current-password"
                label="Current password"
                labelPlacement="stacked"
                type="password"
                value={emailPassword}
                onIonInput={(event) =>
                  setEmailPassword(event.detail.value ?? "")
                }
              />
            </IonItem>
          </IonList>
          <IonNote className="ion-margin-start">
            Your current password confirms the change. Sign-in uses the new
            address right away.
          </IonNote>
        </IonContent>
      </IonModal>

      <IonModal
        isOpen={openSection === "password"}
        canDismiss={!isPending}
        onIonModalWillPresent={() => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }}
        onIonModalDidDismiss={() => setOpenSection(null)}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton disabled={isPending} onClick={() => setOpenSection(null)}>Cancel</IonButton>
            </IonButtons>
            <IonTitle>Change password</IonTitle>
            <IonButtons slot="end">
              <IonButton
                strong
                disabled={
                  isPending ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
                onClick={() => void handlePasswordSubmit()}
              >
                Update
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding" inert={isPending}>
          <IonList inset>
            <IonItem>
              <IonInput
                autocomplete="current-password"
                label="Current password"
                labelPlacement="stacked"
                type="password"
                value={currentPassword}
                onIonInput={(event) =>
                  setCurrentPassword(event.detail.value ?? "")
                }
              />
            </IonItem>
            <IonItem>
              <IonInput
                autocomplete="new-password"
                label="New password"
                labelPlacement="stacked"
                type="password"
                value={newPassword}
                onIonInput={(event) => setNewPassword(event.detail.value ?? "")}
              />
            </IonItem>
            <IonItem>
              <IonInput
                autocomplete="new-password"
                label="Confirm new password"
                labelPlacement="stacked"
                type="password"
                value={confirmPassword}
                onIonInput={(event) =>
                  setConfirmPassword(event.detail.value ?? "")
                }
              />
            </IonItem>
          </IonList>
          <IonNote className="ion-margin-start">
            Use at least 8 characters.
          </IonNote>
        </IonContent>
      </IonModal>
    </>
  );
}
