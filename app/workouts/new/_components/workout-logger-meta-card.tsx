"use client";

import { LegacyDialog } from "@/app/components/ui/legacy-dialog";
import { formatDatabaseDateValue, getCurrentPacificDate } from "@/lib/workout-utils";
import { styles } from "../workout-logger.styles";

export type WorkoutLoggerMetaCardProps = {
  title: string;
  performedAt?: string;
  workoutType?: string;
  workoutTypeOptions?: string[];
  onTitleChange: (value: string) => void;
  onPerformedAtChange?: (value: string) => void;
  onWorkoutTypeChange?: (value: string) => void;
  showEditFields?: boolean;
};

// Two surfaces, one set of fields: the desktop column has room to show them
// beside the sets, and the phone reaches the same fields through the header's
// details control. `idPrefix` keeps the two copies from sharing input ids when
// a wide window has the dialog open as well.
//
// None of these inputs carry `required`. A field that can live behind a dialog
// can be absent from the DOM, which makes native constraint validation a
// coin flip — `buildWorkoutLoggerPayload` is the one place the date and type
// are actually checked, for every caller.
function WorkoutLoggerMetaFields({
  idPrefix,
  title,
  performedAt,
  workoutType,
  workoutTypeOptions = [],
  onTitleChange,
  onPerformedAtChange,
  onWorkoutTypeChange,
  showEditFields = false,
}: WorkoutLoggerMetaCardProps & { idPrefix: string }) {
  const latestAllowedDate = formatDatabaseDateValue(getCurrentPacificDate());

  return (
    <>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-title`}>
          Workout title
        </label>
        <input
          id={`${idPrefix}-title`}
          className={styles.nameInput}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Push day"
        />
      </div>

      {showEditFields ? (
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-type`}>
            Workout type
          </label>
          <select
            id={`${idPrefix}-type`}
            className={styles.input}
            value={workoutType ?? ""}
            onChange={(event) => onWorkoutTypeChange?.(event.target.value)}
            disabled={workoutTypeOptions.length === 0}
          >
            {workoutType ? null : (
              <option value="" disabled>
                Select workout type
              </option>
            )}
            {workoutTypeOptions.length > 0 ? (
              workoutTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No workout types
              </option>
            )}
          </select>
        </div>
      ) : null}

      {showEditFields ? (
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-date`}>
            Workout date
          </label>
          <input
            id={`${idPrefix}-date`}
            className={`${styles.input} ${styles.dateInput}`}
            type="date"
            value={performedAt ?? ""}
            max={latestAllowedDate}
            onChange={(event) => onPerformedAtChange?.(event.target.value)}
          />
        </div>
      ) : null}
    </>
  );
}

/**
 * The workout's own fields, inline. Desktop only: a phone gives its width to
 * the exercise in focus, and reaches these through the details dialog instead.
 */
export function WorkoutLoggerMetaCard(props: WorkoutLoggerMetaCardProps) {
  return (
    <section className={styles.desktopOnlyCard} aria-label="Workout details">
      <div className={props.showEditFields ? styles.metaGrid : styles.singleMetaField}>
        <WorkoutLoggerMetaFields {...props} idPrefix="workout" />
      </div>
    </section>
  );
}

export type WorkoutLoggerDetailsDialogProps = WorkoutLoggerMetaCardProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * The same fields where a phone can reach them. The shared dialog owns presence
 * and dismissal and moves focus nowhere, so opening this never closes the
 * keyboard on the field the user was already in.
 */
export function WorkoutLoggerDetailsDialog({
  open,
  onOpenChange,
  ...fields
}: WorkoutLoggerDetailsDialogProps) {
  return (
    <LegacyDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Workout details"
      description="Name this workout, and set the date and type it was trained on."
      overlayClassName={styles.confirmOverlay}
      contentClassName={styles.confirmDialog}
    >
      <h2 className={styles.confirmTitle}>Workout details</h2>
      <div className={styles.detailsFields}>
        <WorkoutLoggerMetaFields {...fields} idPrefix="workout-details" />
      </div>
      <div className={styles.detailsActions}>
        <button
          type="button"
          className={styles.detailsDoneButton}
          onClick={() => onOpenChange(false)}
        >
          Done
        </button>
      </div>
    </LegacyDialog>
  );
}
