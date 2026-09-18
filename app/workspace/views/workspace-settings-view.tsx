"use client";

import { Label } from "@/app/components/workspace-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/workspace-ui/select";
import { useThemePreference, type ThemePreference } from "@/app/components/theme-toggle";
import type { DashboardSettingsViewProps } from "@/app/dashboard/_components/dashboard-settings-view";
import type { WeightUnit } from "@/lib/weight-unit";

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "system", label: "Match my device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const WEIGHT_UNIT_OPTIONS: Array<{ value: WeightUnit; label: string }> = [
  { value: "LB", label: "Pounds" },
  { value: "KG", label: "Kilograms" },
];

/**
 * Preferences only. Identity, email, password, and deletion live on Profile,
 * and signing out belongs to the account menu in the frame.
 */
export function WorkspaceSettingsView({ state }: DashboardSettingsViewProps) {
  // The shared hook stays the only writer of the stored theme, so this screen
  // and the rest of the app can never disagree about which theme is set.
  const { preference, setPreference } = useThemePreference();

  function selectWeightUnit(unit: WeightUnit) {
    if (unit === state.preferredWeightUnitInput) {
      return;
    }

    // savePreference PATCHes the *saved* profile plus this unit, so choosing a
    // unit here can never commit a half-typed name or a pending avatar sitting
    // in the shared profile form.
    state.setPreferredWeightUnitInput(unit);
    void state.savePreference({ preferredWeightUnit: unit });
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="cn-font-heading text-xl leading-tight font-medium">Settings</h1>
        <p className="text-sm text-muted-foreground">
          How the app looks and which units it speaks in. Both apply the moment
          you choose them.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="cn-font-heading text-base font-medium">Appearance</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="workspaceThemePreference">Theme</Label>
            <p className="text-sm text-muted-foreground">
              Matching your device follows it when it switches at sunset.
            </p>
          </div>
          <Select
            value={preference}
            onValueChange={(value) => setPreference(value as ThemePreference)}
          >
            <SelectTrigger
              id="workspaceThemePreference"
              className="w-full sm:w-48"
              aria-label="Theme"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="cn-font-heading text-base font-medium">Units</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="workspaceWeightUnit">Weight</Label>
            <p className="text-sm text-muted-foreground">
              Switching units changes what you see. Nothing you have already
              logged is rewritten.
            </p>
          </div>
          <Select
            value={state.preferredWeightUnitInput}
            disabled={state.isSaving}
            onValueChange={(value) => selectWeightUnit(value as WeightUnit)}
          >
            <SelectTrigger
              id="workspaceWeightUnit"
              className="w-full sm:w-48"
              aria-label="Weight unit"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEIGHT_UNIT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>
    </div>
  );
}
