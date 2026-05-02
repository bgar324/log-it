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
        publicProfileEnabled: boolean;
        profileImageUpdatedAt: string | null;
      };
    }
  | {
      ok?: false;
      error?: string;
    };

type AvatarResponse =
  | {
      ok: true;
      profileImageUpdatedAt: string | null;
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
  publicProfileEnabledInput: boolean;
  avatarFileInput: File | null;
  avatarPreviewUrl: string | null;
  avatarRemovalPending: boolean;
  saveState: SaveState;
  setFirstNameInput: (value: string) => void;
  setLastNameInput: (value: string) => void;
  setPreferredWeightUnitInput: (value: WeightUnit) => void;
  setPublicProfileEnabledInput: (value: boolean) => void;
  handleProfileSave: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleAvatarFileChange: (file: File | null) => void;
  handleAvatarDelete: () => void;
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
  const [publicProfileEnabledInput, setPublicProfileEnabledInput] = useState(
    user.publicProfileEnabled,
  );
  const [avatarFileInput, setAvatarFileInput] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarRemovalPending, setAvatarRemovalPending] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({
    kind: "idle",
    message: "",
  });

  useEffect(() => {
    setProfile(user);
    setFirstNameInput(user.firstName ?? "");
    setLastNameInput(user.lastName ?? "");
    setPreferredWeightUnitInput(user.preferredWeightUnit);
    setPublicProfileEnabledInput(user.publicProfileEnabled);
    setAvatarFileInput(null);
    setAvatarRemovalPending(false);
  }, [user]);

  useEffect(() => {
    if (!avatarFileInput) {
      setAvatarPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(avatarFileInput);
    setAvatarPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [avatarFileInput]);

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
          publicProfileEnabled: publicProfileEnabledInput,
        }),
      });

      const payload = (await response.json()) as ProfileResponse;

      if (!response.ok || !payload || !("ok" in payload && payload.ok)) {
        throw new Error(payload && "error" in payload ? payload.error : "Unable to save profile.");
      }

      let profileImageUpdatedAt = payload.user.profileImageUpdatedAt;

      if (avatarFileInput) {
        const formData = new FormData();
        formData.set("image", avatarFileInput);

        const avatarResponse = await fetch("/api/profile/avatar", {
          method: "POST",
          body: formData,
        });
        const avatarPayload = (await avatarResponse.json()) as AvatarResponse;

        if (
          !avatarResponse.ok ||
          !avatarPayload ||
          !("ok" in avatarPayload && avatarPayload.ok)
        ) {
          throw new Error(
            avatarPayload && "error" in avatarPayload
              ? avatarPayload.error
              : "Unable to upload profile picture.",
          );
        }

        profileImageUpdatedAt = avatarPayload.profileImageUpdatedAt;
      } else if (avatarRemovalPending) {
        const avatarResponse = await fetch("/api/profile/avatar", {
          method: "DELETE",
        });
        const avatarPayload = (await avatarResponse.json()) as AvatarResponse;

        if (
          !avatarResponse.ok ||
          !avatarPayload ||
          !("ok" in avatarPayload && avatarPayload.ok)
        ) {
          throw new Error(
            avatarPayload && "error" in avatarPayload
              ? avatarPayload.error
              : "Unable to remove profile picture.",
          );
        }

        profileImageUpdatedAt = avatarPayload.profileImageUpdatedAt;
      }

      setProfile((current) => ({
        ...current,
        firstName: payload.user.firstName,
        lastName: payload.user.lastName,
        preferredWeightUnit: payload.user.preferredWeightUnit,
        publicProfileEnabled: payload.user.publicProfileEnabled,
        profileImageUpdatedAt,
      }));
      setFirstNameInput(payload.user.firstName ?? "");
      setLastNameInput(payload.user.lastName ?? "");
      setPreferredWeightUnitInput(payload.user.preferredWeightUnit);
      setPublicProfileEnabledInput(payload.user.publicProfileEnabled);
      setAvatarFileInput(null);
      setAvatarRemovalPending(false);
      setSaveState({ kind: "success", message: "Profile updated." });
      onProfileSaved();
    } catch (error) {
      setSaveState({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to save profile.",
      });
    }
  }

  function handleAvatarFileChange(file: File | null) {
    if (!file) {
      return;
    }

    setAvatarFileInput(file);
    setAvatarRemovalPending(false);
    setSaveState({ kind: "idle", message: "" });
  }

  function handleAvatarDelete() {
    if (avatarFileInput) {
      setAvatarFileInput(null);
    } else if (profile.profileImageUpdatedAt) {
      setAvatarRemovalPending(true);
    }

    setSaveState({ kind: "idle", message: "" });
  }

  return {
    profile,
    firstNameInput,
    lastNameInput,
    preferredWeightUnitInput,
    publicProfileEnabledInput,
    avatarFileInput,
    avatarPreviewUrl,
    avatarRemovalPending,
    saveState,
    setFirstNameInput,
    setLastNameInput,
    setPreferredWeightUnitInput,
    setPublicProfileEnabledInput,
    handleProfileSave,
    handleAvatarFileChange,
    handleAvatarDelete,
  };
}
