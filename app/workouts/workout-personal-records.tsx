"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { convertStoredWeightToDisplay, formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import type { WorkoutPersonalRecord } from "./new/workout-logger.types";

const STORAGE_KEY = "logit-saved-workout-records-v1";
const CHANGE_EVENT = "logit-saved-workout-records-change";
let memorySnapshot: string | null | undefined;

type SavedWorkoutRecords = {
  userId: string;
  workoutId: string;
  title: string;
  records: WorkoutPersonalRecord[];
};

function snapshot() {
  if (memorySnapshot !== undefined) return memorySnapshot;
  try { return window.sessionStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function subscribe(notify: () => void) {
  window.addEventListener(CHANGE_EVENT, notify);
  return () => window.removeEventListener(CHANGE_EVENT, notify);
}

function parseRecords(raw: string | null): SavedWorkoutRecords | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || !("userId" in value) || typeof value.userId !== "string" ||
      !("workoutId" in value) || typeof value.workoutId !== "string" || !("title" in value) || typeof value.title !== "string" ||
      !("records" in value) || !Array.isArray(value.records)) return null;
    const records: WorkoutPersonalRecord[] = [];
    for (const record of value.records) {
      if (!record || typeof record !== "object" || !("name" in record) || typeof record.name !== "string" ||
        !("e1rmLb" in record) || typeof record.e1rmLb !== "number" || !Number.isFinite(record.e1rmLb)) return null;
      records.push({ name: record.name, e1rmLb: record.e1rmLb });
    }
    return { userId: value.userId, workoutId: value.workoutId, title: value.title, records };
  } catch { return null; }
}

/** Latest accepted save only. Storage is optional and never owns save success. */
export function rememberWorkoutPersonalRecords(value: SavedWorkoutRecords) {
  memorySnapshot = value.records.length ? JSON.stringify(value) : null;
  try {
    if (memorySnapshot) window.sessionStorage.setItem(STORAGE_KEY, memorySnapshot);
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* Same-page navigation can still read the in-memory result. */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function forgetWorkoutPersonalRecords(workoutId: string) {
  if (parseRecords(snapshot())?.workoutId !== workoutId) return;
  memorySnapshot = null;
  try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* Optional session handoff. */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function WorkoutPersonalRecords({ userId, workoutId, weightUnit }: {
  userId: string;
  workoutId?: string;
  weightUnit: WeightUnit;
}) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const saved = parseRecords(raw);
  if (!saved || saved.userId !== userId || (workoutId && saved.workoutId !== workoutId) || !saved.records.length) return null;
  return (
    <section role="status" aria-label="Personal records from this workout" className="my-4 space-y-2 text-sm text-[var(--text)]">
      <p className="font-medium">
        {workoutId ? "New personal records" : <Link className="underline underline-offset-4" href={`/workouts/${saved.workoutId}?from=dashboard`}>{saved.title}: new personal records</Link>}
      </p>
      <ul className="space-y-1">
        {saved.records.map((record, index) => (
          <li key={`${record.name}-${index}`}>
            {record.name} <span className="text-[var(--muted)]">· {formatWeightWithUnit(convertStoredWeightToDisplay(record.e1rmLb, weightUnit) ?? 0, weightUnit, { maximumFractionDigits: 0 })} estimated 1RM</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
