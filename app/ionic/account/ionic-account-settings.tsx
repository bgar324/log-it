"use client";

import {
  IonLabel,
  IonListHeader,
  IonNote,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { useState } from "react";
import {
  useThemePreference,
  type ThemePreference,
} from "@/app/components/theme-toggle";
import { isWeightUnit, type WeightUnit } from "@/lib/weight-unit";
import type { IonicProfileFormState } from "./ionic-account.types";

type IonicAccountSettingsProps = {
  state: IonicProfileFormState;
};

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const WEIGHT_UNIT_OPTIONS: Array<{ value: WeightUnit; label: string }> = [
  { value: "LB", label: "Pounds" },
  { value: "KG", label: "Kilograms" },
];

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

/**
 * Preferences only. Identity, email, password, and deletion stay on the
 * profile view; sign out belongs to the shell.
 */
export function IonicAccountSettings({ state }: IonicAccountSettingsProps) {
  // The shared hook stays the only writer of the stored theme, so the app and
  // this screen can never disagree about which theme is set.
  const { preference, setPreference } = useThemePreference();
  const [pendingUnit, setPendingUnit] = useState<WeightUnit | null>(null);
  const unitInput = pendingUnit ?? state.profile.preferredWeightUnit;

  async function selectWeightUnit(unit: WeightUnit) {
    if (unit === unitInput) {
      return;
    }

    setPendingUnit(unit);
    await state.savePreference({ preferredWeightUnit: unit });
    setPendingUnit(null);
  }

  return (
    <>
      <IonListHeader>
        <IonLabel>Appearance</IonLabel>
      </IonListHeader>

      <div className="ion-padding-horizontal">
        <IonSegment
          value={preference}
          onIonChange={(event) => {
            const nextValue = event.detail.value;

            if (isThemePreference(nextValue)) {
              setPreference(nextValue);
            }
          }}
        >
          {THEME_OPTIONS.map((option) => (
            <IonSegmentButton key={option.value} value={option.value}>
              <IonLabel>{option.label}</IonLabel>
            </IonSegmentButton>
          ))}
        </IonSegment>
      </div>

      <IonNote className="ion-margin-start">
        System follows your phone. Light and dark stay put until you change
        them.
      </IonNote>

      <IonListHeader>
        <IonLabel>Units</IonLabel>
      </IonListHeader>

      <div className="ion-padding-horizontal">
        <IonSegment
          disabled={state.isSaving}
          value={unitInput}
          onIonChange={(event) => {
            const nextValue = event.detail.value;

            if (isWeightUnit(nextValue)) {
              void selectWeightUnit(nextValue);
            }
          }}
        >
          {WEIGHT_UNIT_OPTIONS.map((unit) => (
            <IonSegmentButton key={unit.value} value={unit.value}>
              <IonLabel>{unit.label}</IonLabel>
            </IonSegmentButton>
          ))}
        </IonSegment>
      </div>

      <IonNote className="ion-margin-start">
        Switching units changes what you see. Nothing you have already logged is
        rewritten.
      </IonNote>
    </>
  );
}
