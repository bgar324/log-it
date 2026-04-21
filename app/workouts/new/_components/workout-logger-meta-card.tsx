"use client";

import DatePicker from "react-datepicker";
import { formatDatabaseDateValue } from "@/lib/workout-utils";
import { styles } from "../workout-logger.styles";

type WorkoutLoggerMetaCardProps = {
  title: string;
  workoutType: string;
  performedAtDate: Date;
  onTitleChange: (value: string) => void;
  onWorkoutTypeChange: (value: string) => void;
  onPerformedAtChange: (value: string) => void;
};

export function WorkoutLoggerMetaCard({
  title,
  workoutType,
  performedAtDate,
  onTitleChange,
  onWorkoutTypeChange,
  onPerformedAtChange,
}: WorkoutLoggerMetaCardProps) {
  return (
    <section className={styles.card}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="workout-title">
          Workout title
        </label>
        <input
          id="workout-title"
          className={styles.input}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Push day"
        />
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="workout-type">
            Workout type
          </label>
          <input
            id="workout-type"
            className={styles.input}
            value={workoutType}
            onChange={(event) => onWorkoutTypeChange(event.target.value)}
            placeholder="Push"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="workout-performed-at">
            Date
          </label>
          <DatePicker
            id="workout-performed-at"
            selected={performedAtDate}
            onChange={(value: Date | null) => {
              if (value) {
                onPerformedAtChange(formatDatabaseDateValue(value));
              }
            }}
            dateFormat="MM/dd/yyyy"
            calendarClassName={styles.datePickerCalendar}
            wrapperClassName={styles.datePickerWrapper}
            popperClassName={styles.datePickerPopper}
            className={`${styles.input} ${styles.dateInput}`}
            showPopperArrow={false}
          />
        </div>
      </div>
    </section>
  );
}
