import type { WeightUnit } from "@/lib/weight-unit";

// A set the user has logged in this session. `weightLb` holds the value the
// user typed, in their display unit — the same convention the existing logger
// uses, because /api/workouts converts with the `weightUnit` sent alongside.
//
// `isCompleted` is the one field the legacy draft never had, and the whole
// point of this logger: a set counts as a result only after the user says so.
// Seeded split rows, recovered drafts and prediction placeholders all start
// incomplete, so nothing the app guessed can reach the server.
export type IonicLoggerSetDraft = {
  id: string;
  reps: string;
  weightLb: string;
  usesBodyweight: boolean;
  durationSeconds: string;
  isCompleted: boolean;
};

export type IonicLoggerExerciseDraft = {
  id: string;
  name: string;
  sets: IonicLoggerSetDraft[];
};

// Everything that has to survive a reload, a backgrounded tab, or leaving the
// route — including where the user was, so the session resumes on the set they
// were actually working on.
export type IonicLoggerSnapshot = {
  title: string;
  workoutType: string;
  performedAt: string;
  exercises: IonicLoggerExerciseDraft[];
  activeExerciseId: string | null;
  activeSetId: string | null;
  /** Exact legacy payload adopted by this draft, preserved across reloads. */
  adoptedLegacyValue?: string;
};

export type IonicDraftSource = "ionic" | "legacy";

export type IonicDraftRecovery = {
  snapshot: IonicLoggerSnapshot;
  source: IonicDraftSource;
  // Set when the stored draft was written in the other unit and the values
  // were converted rather than thrown away.
  convertedFromUnit: WeightUnit | null;
};

// Editable numeric fields. `usesBodyweight` is a separate action because it is
// a mode, not a value.
export type IonicSetValueField = "reps" | "weightLb" | "durationSeconds";

export const IONIC_DRAFT_STORAGE_PREFIX = "logit-ionic-workout-draft-v1";
export const IONIC_AUTOSAVE_DELAY_MS = 350;
// Off by default: the rest timer only runs when the user starts one, or after
// they pick an auto duration in the tools sheet.
export const IONIC_REST_PRESETS_SECONDS = [60, 90, 120, 180];
