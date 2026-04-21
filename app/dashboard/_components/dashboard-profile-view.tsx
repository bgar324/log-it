import type { WeightUnit } from "@/lib/weight-unit";
import { styles } from "../dashboard.styles";
import type { DashboardProfileFormState } from "../_hooks/use-dashboard-profile-form";

type DashboardProfileViewProps = {
  state: DashboardProfileFormState;
};

export function DashboardProfileView({ state }: DashboardProfileViewProps) {
  return (
    <section className={styles.panel}>
      <form id="profileSettingsForm" className={styles.profileForm} onSubmit={state.handleProfileSave}>
        <label className={styles.profileField} htmlFor="profileFirstName">
          <span>First name</span>
          <input
            id="profileFirstName"
            className={styles.profileInput}
            value={state.firstNameInput}
            onChange={(event) => state.setFirstNameInput(event.target.value)}
            maxLength={40}
          />
        </label>

        <label className={styles.profileField} htmlFor="profileLastName">
          <span>Last name</span>
          <input
            id="profileLastName"
            className={styles.profileInput}
            value={state.lastNameInput}
            onChange={(event) => state.setLastNameInput(event.target.value)}
            maxLength={40}
          />
        </label>

        <label className={styles.profileField}>
          <span>Username</span>
          <input className={styles.profileInput} value={state.profile.username} readOnly />
        </label>

        <label className={styles.profileField}>
          <span>Email</span>
          <input className={styles.profileInput} value={state.profile.email} readOnly />
        </label>

        <label className={styles.profileField}>
          <span>Joined</span>
          <input className={styles.profileInput} value={state.profile.joinedAtLabel} readOnly />
        </label>

        <label className={styles.profileField} htmlFor="profileWeightUnit">
          <span>Weight unit</span>
          <select
            id="profileWeightUnit"
            className={styles.profileInput}
            value={state.preferredWeightUnitInput}
            onChange={(event) =>
              state.setPreferredWeightUnitInput(event.target.value as WeightUnit)
            }
          >
            <option value="LB">Pounds (lb)</option>
            <option value="KG">Kilograms (kg)</option>
          </select>
        </label>
      </form>

      <div className={styles.profileActions}>
        <button
          type="submit"
          form="profileSettingsForm"
          className={styles.primaryButton}
          disabled={state.saveState.kind === "saving"}
        >
          {state.saveState.kind === "saving" ? "Saving..." : "Save profile"}
        </button>

        <form method="post" action="/auth/signout" className={styles.profileActionForm}>
          <button type="submit" className={styles.secondaryButton}>
            Sign out
          </button>
        </form>
      </div>

      {state.saveState.kind !== "idle" ? (
        <p
          className={styles.profileStatus}
          data-state={state.saveState.kind}
          role={state.saveState.kind === "error" ? "alert" : undefined}
        >
          {state.saveState.message}
        </p>
      ) : null}
    </section>
  );
}
