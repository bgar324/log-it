import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { WeightUnit } from "@/lib/weight-unit";
import type { DashboardClientData } from "../dashboard-types";

type DashboardUser = DashboardClientData["user"];

type SaveState =
  | { kind: "idle"; message: string }
  | { kind: "saving"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type ProfileResponse =
  | {
      ok: true;
      user: {
        firstName: string | null;
        lastName: string | null;
        preferredWeightUnit: WeightUnit;
      };
    }
  | {
      ok?: false;
      error?: string;
    };

export type DashboardProfileFormState = {
  profile: DashboardUser;
  firstNameInput: string;
  lastNameInput: string;
  preferredWeightUnitInput: WeightUnit;
  saveState: SaveState;
  setFirstNameInput: (value: string) => void;
  setLastNameInput: (value: string) => void;
  setPreferredWeightUnitInput: (value: WeightUnit) => void;
  handleProfileSave: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function useDashboardProfileForm(
  user: DashboardUser,
  onProfileSaved: () => void,
): DashboardProfileFormState {
  const [profile, setProfile] = useState(user);
  const [firstNameInput, setFirstNameInput] = useState(user.firstName ?? "");
  const [lastNameInput, setLastNameInput] = useState(user.lastName ?? "");
  const [preferredWeightUnitInput, setPreferredWeightUnitInput] = useState<WeightUnit>(
    user.preferredWeightUnit,
  );
  const [saveState, setSaveState] = useState<SaveState>({
    kind: "idle",
    message: "",
  });

  useEffect(() => {
    setProfile(user);
    setFirstNameInput(user.firstName ?? "");
    setLastNameInput(user.lastName ?? "");
    setPreferredWeightUnitInput(user.preferredWeightUnit);
  }, [user]);

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaveState({ kind: "saving", message: "Saving profile..." });

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstNameInput,
          lastName: lastNameInput,
          preferredWeightUnit: preferredWeightUnitInput,
        }),
      });

      const payload = (await response.json()) as ProfileResponse;

      if (!response.ok || !payload || !("ok" in payload && payload.ok)) {
        throw new Error(payload && "error" in payload ? payload.error : "Unable to save profile.");
      }

      setProfile((current) => ({
        ...current,
        firstName: payload.user.firstName,
        lastName: payload.user.lastName,
        preferredWeightUnit: payload.user.preferredWeightUnit,
      }));
      setFirstNameInput(payload.user.firstName ?? "");
      setLastNameInput(payload.user.lastName ?? "");
      setPreferredWeightUnitInput(payload.user.preferredWeightUnit);
      setSaveState({ kind: "success", message: "Profile updated." });
      onProfileSaved();
    } catch (error) {
      setSaveState({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to save profile.",
      });
    }
  }

  return {
    profile,
    firstNameInput,
    lastNameInput,
    preferredWeightUnitInput,
    saveState,
    setFirstNameInput,
    setLastNameInput,
    setPreferredWeightUnitInput,
    handleProfileSave,
  };
}
