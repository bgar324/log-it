"use client";

import { Check, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatWorkoutLoggerDateLabel } from "../workout-logger.formatters";
import { styles } from "../workout-logger.styles";

type HeaderProps = {
  title: string;
  performedAt: string;
  workoutType: string;
  workoutTypeOptions: string[];
  latestAllowedDate: string;
  canEditMetadata: boolean;
  onTitleChange: (value: string) => void;
  onPerformedAtChange: (value: string) => void;
  onWorkoutTypeChange: (value: string) => void;
};

export function WorkoutLoggerHeader({
  title, performedAt, workoutType, workoutTypeOptions, latestAllowedDate,
  canEditMetadata, onTitleChange, onPerformedAtChange, onWorkoutTypeChange,
}: HeaderProps) {
  const [editing, setEditing] = useState<"name" | "date" | "type" | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if (editing === "name") { nameRef.current?.focus(); nameRef.current?.select(); }
    if (editing === "date") dateRef.current?.focus();
    if (editing === "type") typeRef.current?.focus();
  }, [editing]);
  const dateLabel = formatWorkoutLoggerDateLabel(performedAt);
  const typeOptions = Array.from(new Set([workoutType, ...workoutTypeOptions].filter(Boolean)));

  return (
    <header className={styles.header}>
      <div className={styles.headerMetaRow}>
        {editing === "date" ? (
          <input ref={dateRef} type="date" aria-label="Workout date" className={styles.headerMetaInput}
            value={performedAt} max={latestAllowedDate} onChange={event => onPerformedAtChange(event.target.value)} onBlur={() => setEditing(null)} />
        ) : canEditMetadata ? (
          <button type="button" className={styles.headerMetaButton} aria-label="Edit workout date" onClick={() => setEditing("date")}>{dateLabel}</button>
        ) : <span>{dateLabel}</span>}
        {workoutType || canEditMetadata ? <span aria-hidden="true">·</span> : null}
        {editing === "type" ? (
          <select ref={typeRef} aria-label="Workout type" className={styles.headerMetaInput} value={workoutType}
            onChange={event => { onWorkoutTypeChange(event.target.value); setEditing(null); }} onBlur={() => setEditing(null)}>
            {!workoutType ? <option value="" disabled>Workout type</option> : null}
            {typeOptions.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        ) : canEditMetadata ? (
          <button type="button" className={styles.headerMetaButton} aria-label="Edit workout type" disabled={typeOptions.length === 0} onClick={() => setEditing("type")}>{workoutType || "No type"}</button>
        ) : workoutType ? <span>{workoutType}</span> : null}
      </div>
      <div className={styles.titleRow}>
        {editing === "name" ? (
          <input ref={nameRef} aria-label="Workout name" className={styles.titleInput} value={title}
            onChange={event => onTitleChange(event.target.value)} onBlur={() => setEditing(null)}
            onKeyDown={event => { if (event.key === "Enter" || event.key === "Escape") { event.preventDefault(); setEditing(null); } }} />
        ) : <h1 className={styles.title}>{title.trim() || "Untitled workout"}</h1>}
        <button type="button" className={styles.titleEditButton}
          aria-label={editing === "name" ? "Done editing workout name" : "Edit workout name"}
          onPointerDown={event => event.preventDefault()}
          onClick={() => setEditing(editing === "name" ? null : "name")}>
          {editing === "name" ? <Check className={styles.icon} strokeWidth={1.9} /> : <Pencil className={styles.icon} strokeWidth={1.9} />}
        </button>
      </div>
    </header>
  );
}
