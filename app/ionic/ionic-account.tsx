"use client";

import { useIonToast } from "@ionic/react";
import { useCallback } from "react";
import { IonicAccountProfile } from "./account/ionic-account-profile";
import { IonicAccountSettings } from "./account/ionic-account-settings";
import type {
  IonicAccountProps,
  IonicNotify,
} from "./account/ionic-account.types";
import { useIonicProfileForm } from "./account/use-ionic-profile-form";

export type { IonicAccountProps, IonicAccountView } from "./account/ionic-account.types";

/**
 * Profile and Settings for the Ionic app. The shell owns the IonPage, header,
 * content, and sign out; this renders the two views' content only.
 */
export function IonicAccount({ data, onRefresh, view }: IonicAccountProps) {
  const [presentToast] = useIonToast();
  const notify = useCallback<IonicNotify>(
    (message, tone) => {
      void presentToast({
        buttons: [{ text: "Close", role: "cancel" }],
        color: tone === "error" ? "danger" : undefined,
        duration: tone === "error" ? 6000 : 2200,
        message,
        position: "bottom",
      });
    },
    [presentToast],
  );
  const state = useIonicProfileForm(data.user, onRefresh, notify);

  if (view === "settings") {
    return <IonicAccountSettings state={state} />;
  }

  return (
    <IonicAccountProfile state={state} notify={notify} onRefresh={onRefresh} />
  );
}
