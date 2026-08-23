"use client";

import type { WeightUnit } from "@/lib/weight-unit";
import { ThemeToggle } from "@/app/components/theme-toggle";
import type { DashboardProfileFormState } from "../_hooks/use-dashboard-profile-form";
import { styles } from "../dashboard.styles";

const WEIGHT_UNITS: Array<{ value: WeightUnit; label: string }> = [
  { value: "LB", label: "Pounds" },
  { value: "KG", label: "Kilograms" },
];

type DashboardSettingsViewProps = {
  state: DashboardProfileFormState;
};

/**
 * Preferences only. Account actions (email, password, sign out, delete) stay on
 * the profile view; this is the surface a user opens to change how the app
 * behaves, not who they are.
 */
export function DashboardSettingsView({ state }: DashboardSettingsViewProps) {
  // Persisted through a preference-only action: it PATCHes the saved profile
  // plus this unit, so it can never commit unsaved Profile edits or a pending
  // avatar from the shared form state.
  function selectWeightUnit(unit: WeightUnit) {
    if (unit === state.preferredWeightUnitInput) {
      return;
    }

    state.setPreferredWeightUnitInput(unit);
    void state.savePreference({ preferredWeightUnit: unit });
  }

  return (
    <>
      <section>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Appearance</h2>
        </div>
        {/* A row, not a <p>: ThemeToggle renders a div and <div> inside <p> is
            invalid HTML, which React reports as a hydration error. */}
        <div className={styles.settingRow}>
          <span className={styles.settingLabel}>Theme</span>
          <ThemeToggle />
        </div>
      </section>

      <section>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Units</h2>
        </div>
        <div className={styles.settingRow}>
          <span className={styles.settingLabel}>Weight</span>
          <select
            className={styles.settingSelect}
            value={state.preferredWeightUnitInput}
            disabled={state.isSaving}
            onChange={(event) => selectWeightUnit(event.target.value as WeightUnit)}
          >
            {WEIGHT_UNITS.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>
        <p className={styles.statLineMuted}>
          Weights are stored in pounds and converted for display.
        </p>
      </section>
    </>
  );
}
