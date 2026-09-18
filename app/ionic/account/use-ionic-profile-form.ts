"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import type { WeightUnit } from "@/lib/weight-unit";
import type {
  IonicAccountUser,
  IonicNotify,
  IonicProfileFormState,
  IonicProfileIdentityInput,
  IonicProfilePreferenceInput,
} from "./ionic-account.types";

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

/**
 * The /ionic account form. Same requests and same field semantics as the
 * dashboard profile form, with two deliberate differences: feedback goes
 * through the caller's IonToast presenter, and a successful write calls
 * `onRefresh` (the shell's data invalidation) instead of Next's
 * `router.refresh()`, which would not touch the shell's fetched data.
 */
export function useIonicProfileForm(
  user: IonicAccountUser,
  onRefresh: () => void,
  notify: IonicNotify,
): IonicProfileFormState {
  const [profile, setProfile] = useState(user);
  const [avatarFileInput, setAvatarFileInput] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarRemovalPending, setAvatarRemovalPending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setProfile(user);
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

    return (await response.json().catch(() => null)) as ProfileResponse | null;
  }

  // Preferences persist from the *saved* profile values so a units or
  // visibility switch can never commit a half-typed identity edit.
  async function savePreference(overrides: IonicProfilePreferenceInput) {
    if (isSaving) {
      return false;
    }

    setIsSaving(true);

    try {
      const payload = await patchProfile({
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        preferredWeightUnit:
          overrides.preferredWeightUnit ?? profile.preferredWeightUnit,
        publicProfileEnabled:
          overrides.publicProfileEnabled ?? profile.publicProfileEnabled,
      });

      if (!payload || !("ok" in payload && payload.ok)) {
        throw new Error(
          (payload && "error" in payload ? payload.error : null) ??
            "Unable to save preference.",
        );
      }

      setProfile((current) => ({
        ...current,
        preferredWeightUnit: payload.user.preferredWeightUnit,
        publicProfileEnabled: payload.user.publicProfileEnabled,
      }));
      notify("Preference saved.", "success");
      onRefresh();
      return true;
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to save preference.",
        "error",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function saveIdentity(next: IonicProfileIdentityInput) {
    if (isSaving) {
      return false;
    }

    setIsSaving(true);

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
          (payload && "error" in payload ? payload.error : null) ??
            "Unable to save profile.",
        );
      }

      setProfile((current) => ({
        ...current,
        username: payload.user.username,
        firstName: payload.user.firstName,
        lastName: payload.user.lastName,
        publicProfileEnabled: payload.user.publicProfileEnabled,
      }));
      posthog.capture("profile_updated", {
        public_profile_enabled: payload.user.publicProfileEnabled,
      });
      notify("Profile updated.", "success");
      onRefresh();
      return true;
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to save profile.",
        "error",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function commitAvatar(file: File | null) {
    setIsSaving(true);

    try {
      const uploadBody = new FormData();

      if (file) {
        uploadBody.set("image", file);
      }

      const response = file
        ? await fetch("/api/profile/avatar", { method: "POST", body: uploadBody })
        : await fetch("/api/profile/avatar", { method: "DELETE" });
      const payload = (await response
        .json()
        .catch(() => null)) as AvatarResponse | null;

      if (!response.ok || !payload || !("ok" in payload && payload.ok)) {
        throw new Error(
          (payload && "error" in payload ? payload.error : null) ??
            (file
              ? "Unable to upload profile picture."
              : "Unable to remove profile picture."),
        );
      }

      setProfile((current) => ({
        ...current,
        profileImageUpdatedAt: payload.profileImageUpdatedAt,
      }));
      setAvatarFileInput(null);
      setAvatarRemovalPending(false);
      notify(file ? "Photo updated." : "Photo removed.", "success");
      onRefresh();
    } catch (error) {
      // Drop the optimistic preview so the avatar shows what is stored.
      setAvatarFileInput(null);
      setAvatarRemovalPending(false);
      notify(
        error instanceof Error
          ? error.message
          : "Unable to update profile picture.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  }

  // A photo choice applies immediately: nothing else on this screen would
  // commit it.
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

  const displayedAvatarUrl = avatarRemovalPending
    ? null
    : avatarPreviewUrl ??
      (profile.profileImageUpdatedAt
        ? `/api/profile/avatar?v=${encodeURIComponent(profile.profileImageUpdatedAt)}`
        : null);

  return {
    profile,
    isSaving,
    displayedAvatarUrl,
    hasAvatar: Boolean(displayedAvatarUrl),
    saveIdentity,
    savePreference,
    handleAvatarFileChange,
    handleAvatarDelete,
  };
}
