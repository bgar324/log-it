import type { DashboardClientData } from "@/app/dashboard/dashboard-types";
import type { WeightUnit } from "@/lib/weight-unit";

export type IonicAccountView = "profile" | "settings";

export type IonicAccountUser = DashboardClientData["user"];

export type IonicAccountProps = {
  data: DashboardClientData;
  onRefresh: () => void;
  view: IonicAccountView;
};

export type IonicNotifyTone = "success" | "error";

/** Account mutations report through Ionic's own feedback controls. */
export type IonicNotify = (message: string, tone: IonicNotifyTone) => void;

export type IonicProfileIdentityInput = {
  firstName: string;
  lastName: string;
  username: string;
  publicProfileEnabled: boolean;
};

export type IonicProfilePreferenceInput = {
  preferredWeightUnit?: WeightUnit;
  publicProfileEnabled?: boolean;
};

export type IonicProfileFormState = {
  profile: IonicAccountUser;
  isSaving: boolean;
  /** Pending crop preview, saved avatar, or null while a removal is in flight. */
  displayedAvatarUrl: string | null;
  hasAvatar: boolean;
  saveIdentity: (next: IonicProfileIdentityInput) => Promise<boolean>;
  savePreference: (overrides: IonicProfilePreferenceInput) => Promise<boolean>;
  handleAvatarFileChange: (file: File | null) => void;
  handleAvatarDelete: () => void;
};
