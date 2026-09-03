import { useEffect, useState } from "react";
import { toast } from "sonner";
import posthog from "posthog-js";
import type { WeightUnit } from "@/lib/weight-unit";
import type { DashboardClientData } from "../dashboard-types";


function avatarFormData(file: File) {
  const formData = new FormData();
  formData.set("image", file);
  return formData;
}
type DashboardUser = DashboardClientData["user"];

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" };

type ProfileResponse =
  | {
      ok: true;
      user: {
        username: string;
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
  isSaving: boolean;
  saveIdentity: (next: {
    firstName: string;
    lastName: string;
    username: string;
    publicProfileEnabled: boolean;
  }) => Promise<boolean>;
  savePreference: (overrides: {
    preferredWeightUnit?: WeightUnit;
    publicProfileEnabled?: boolean;
  }) => Promise<void>;
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

  async function patchProfile(body: {
    firstName: string;
    lastName: string;
    username?: string;
    preferredWeightUnit: WeightUnit;
    publicProfileEnabled: boolean;
  }) {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return (await response.json()) as ProfileResponse;
  }

  // Persists one preference from the *saved* profile values, never from the
  // profile form's inputs, and never touches a pending avatar. A units toggle
  // in Settings must not commit half-typed edits sitting on the Profile view.
  async function savePreference(overrides: {
    preferredWeightUnit?: WeightUnit;
    publicProfileEnabled?: boolean;
  }) {
    const toastId = toast.loading("Saving preference...");
    setSaveState({ kind: "saving" });

    try {
      const payload = await patchProfile({
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        preferredWeightUnit: overrides.preferredWeightUnit ?? profile.preferredWeightUnit,
        publicProfileEnabled:
          overrides.publicProfileEnabled ?? profile.publicProfileEnabled,
      });

      if (!payload || !("ok" in payload && payload.ok)) {
        throw new Error(
          payload && "error" in payload ? payload.error : "Unable to save preference.",
        );
      }

      setProfile((current) => ({
        ...current,
        preferredWeightUnit: payload.user.preferredWeightUnit,
        publicProfileEnabled: payload.user.publicProfileEnabled,
      }));
      setPreferredWeightUnitInput(payload.user.preferredWeightUnit);
      setPublicProfileEnabledInput(payload.user.publicProfileEnabled);
      toast.success("Preference saved.", { id: toastId });
      onProfileSaved();
    } catch (error) {
      // Roll the optimistic control back to what is actually stored.
      setPreferredWeightUnitInput(profile.preferredWeightUnit);
      setPublicProfileEnabledInput(profile.publicProfileEnabled);
      toast.error(error instanceof Error ? error.message : "Unable to save preference.", {
        id: toastId,
      });
    } finally {
      setSaveState({ kind: "idle" });
    }
  }

  // Identity edits (names, username, visibility) come from the profile modal as
  // one explicit save. Avatar bytes are a separate request and now apply on
  // their own, so there is no combined "save everything" path to reason about.
  async function saveIdentity(next: {
    firstName: string;
    lastName: string;
    username: string;
    publicProfileEnabled: boolean;
  }) {
    const toastId = toast.loading("Saving profile...");
    setSaveState({ kind: "saving" });

    try {
      const payload = await patchProfile({
        firstName: next.firstName,
        lastName: next.lastName,
        username: next.username,
        preferredWeightUnit: profile.preferredWeightUnit,
        publicProfileEnabled: next.publicProfileEnabled,
      });

      if (!payload || !("ok" in payload && payload.ok)) {
        throw new Error(
          payload && "error" in payload ? payload.error : "Unable to save profile.",
        );
      }

      setProfile((current) => ({
        ...current,
        username: payload.user.username,
        firstName: payload.user.firstName,
        lastName: payload.user.lastName,
        publicProfileEnabled: payload.user.publicProfileEnabled,
      }));
      setFirstNameInput(payload.user.firstName ?? "");
      setLastNameInput(payload.user.lastName ?? "");
      setPublicProfileEnabledInput(payload.user.publicProfileEnabled);
      posthog.capture("profile_updated", {
        public_profile_enabled: payload.user.publicProfileEnabled,
      });
      toast.success("Profile updated.", { id: toastId });
      onProfileSaved();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save profile.", {
        id: toastId,
      });
      return false;
    } finally {
      setSaveState({ kind: "idle" });
    }
  }

  async function commitAvatar(file: File | null) {
    const toastId = toast.loading(file ? "Uploading photo..." : "Removing photo...");
    setSaveState({ kind: "saving" });

    try {
      const response = file
        ? await fetch("/api/profile/avatar", { method: "POST", body: avatarFormData(file) })
        : await fetch("/api/profile/avatar", { method: "DELETE" });
      const payload = (await response.json()) as AvatarResponse;

      if (!response.ok || !payload || !("ok" in payload && payload.ok)) {
        throw new Error(
          payload && "error" in payload
            ? payload.error
            : file
              ? "Unable to upload profile picture."
              : "Unable to remove profile picture.",
        );
      }

      setProfile((current) => ({
        ...current,
        profileImageUpdatedAt: payload.profileImageUpdatedAt,
      }));
      setAvatarFileInput(null);
      setAvatarRemovalPending(false);
      toast.success(file ? "Photo updated." : "Photo removed.", { id: toastId });
      onProfileSaved();
    } catch (error) {
      setAvatarFileInput(null);
      setAvatarRemovalPending(false);
      toast.error(
        error instanceof Error ? error.message : "Unable to update profile picture.",
        { id: toastId },
      );
    } finally {
      setSaveState({ kind: "idle" });
    }
  }

  // A photo choice applies straight away: with the name form gone there is no
  // other control that would have committed it.
  function handleAvatarFileChange(file: File | null) {
    if (!file) {
      return;
    }

    setAvatarFileInput(file);
    setAvatarRemovalPending(false);
    void commitAvatar(file);
  }

  function handleAvatarDelete() {
    if (avatarFileInput) {
      setAvatarFileInput(null);
      return;
    }

    if (!profile.profileImageUpdatedAt) {
      return;
    }

    setAvatarRemovalPending(true);
    void commitAvatar(null);
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
    isSaving: saveState.kind === "saving",
    saveIdentity,
    savePreference,
    handleAvatarFileChange,
    handleAvatarDelete,
  };
}
