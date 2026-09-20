import type { WorkspaceWorkoutDetailProjection } from "@/app/workspace/details/workspace-workout-detail.data";
import type { WeightUnit } from "@/lib/weight-unit";

export type WorkoutDetailState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; detail: WorkspaceWorkoutDetailProjection };

/** What is worth remembering: an answer the server will keep giving. */
type SettledDetail = Extract<WorkoutDetailState, { status: "missing" | "ready" }>;

/** What a request comes back with: anything but the wait itself. */
type ResolvedDetail = Exclude<WorkoutDetailState, { status: "loading" }>;

/** A day of history is a handful of sessions; a hundred is many days of browsing. */
export const WORKOUT_DETAIL_CACHE_LIMIT = 100;

/** Long enough to make stepping around history free, short enough to stay true. */
export const WORKOUT_DETAIL_CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  workoutId: string;
  state: SettledDetail;
  storedAt: number;
};

type PendingRead = {
  workoutId: string;
  /** Identity of this attempt, so a superseded answer recognizes itself. */
  token: object;
  promise: Promise<WorkoutDetailState | null>;
};

/**
 * One person's browsing session, in this tab's memory only.
 *
 * The history browser re-asks for the same sets constantly: stepping back a
 * day, remounting the view, returning from an edit. The endpoint stays private
 * and `no-store`, so the only place these answers may live is here — keyed by
 * the account, the display unit and the workout, capped, and expiring, because
 * a training log read from a stale copy is worse than a spinner.
 */
const entries = new Map<string, CacheEntry>();
const pending = new Map<string, PendingRead>();

function cacheKey(userId: string, unit: WeightUnit, workoutId: string) {
  return `${userId}\u0000${unit}\u0000${workoutId}`;
}

/** The cached answer for this account, unit and workout, if it is still fresh. */
export function readWorkoutDetail(
  userId: string,
  unit: WeightUnit,
  workoutId: string,
): SettledDetail | undefined {
  const key = cacheKey(userId, unit, workoutId);
  const entry = entries.get(key);

  if (!entry) {
    return undefined;
  }

  if (Date.now() - entry.storedAt >= WORKOUT_DETAIL_CACHE_TTL_MS) {
    entries.delete(key);
    return undefined;
  }

  return entry.state;
}

/**
 * Read a workout's sets, sharing one request per key.
 *
 * The request belongs to the cache, not to whoever asked first: leaving the day
 * or unmounting the view never cancels it, so coming back attaches to the
 * answer already on its way. Resolves `null` when the read was invalidated
 * while in flight — the answer describes a workout that has since changed, so
 * the caller has to ask again rather than believe it.
 */
export function loadWorkoutDetail(
  userId: string,
  unit: WeightUnit,
  workoutId: string,
): Promise<WorkoutDetailState | null> {
  const cached = readWorkoutDetail(userId, unit, workoutId);
  if (cached) return Promise.resolve(cached);

  const key = cacheKey(userId, unit, workoutId);
  const inFlight = pending.get(key);

  if (inFlight) {
    return inFlight.promise;
  }

  const token = {};
  const promise = (async () => {
    const state = await fetchWorkoutDetail(workoutId, unit);

    if (pending.get(key)?.token !== token) {
      // Invalidated (or replaced) while this request was open.
      return null;
    }

    pending.delete(key);

    if (state.status !== "error") {
      store(key, workoutId, state);
    }

    // Failures are not remembered, so the next ask is a real retry.
    return state;
  })();

  pending.set(key, { workoutId, token, promise });

  return promise;
}

/**
 * Forget what the server just changed.
 *
 * With an id, every account and unit view of that workout goes, and any open
 * read of it is disowned so its answer cannot land afterwards. Without one,
 * the whole cache goes.
 */
export function invalidateWorkoutDetails(workoutId?: string): void {
  if (!workoutId) {
    entries.clear();
    pending.clear();
    return;
  }

  for (const [key, entry] of entries) {
    if (entry.workoutId === workoutId) {
      entries.delete(key);
    }
  }

  for (const [key, read] of pending) {
    if (read.workoutId === workoutId) {
      pending.delete(key);
    }
  }
}

function store(key: string, workoutId: string, state: SettledDetail) {
  entries.delete(key);
  entries.set(key, { workoutId, state, storedAt: Date.now() });

  while (entries.size > WORKOUT_DETAIL_CACHE_LIMIT) {
    const oldest = entries.keys().next();

    if (oldest.done) {
      break;
    }

    entries.delete(oldest.value);
  }
}

async function fetchWorkoutDetail(
  workoutId: string,
  unit: WeightUnit,
): Promise<ResolvedDetail> {
  try {
    // The unit travels with the request so the projection can never be the
    // other unit's numbers under this key.
    const response = await fetch(
      `/api/workouts/${encodeURIComponent(workoutId)}?unit=${unit}`,
      {
        cache: "no-store",
        headers: { accept: "application/json" },
      },
    );
    const payload = (await response.json().catch(() => null)) as
      | { detail?: WorkspaceWorkoutDetailProjection; error?: string }
      | null;

    return response.status === 404
      ? { status: "missing" }
      : !response.ok || !payload?.detail
        ? { status: "error", message: payload?.error ?? "Unable to load this workout." }
        : { status: "ready", detail: payload.detail };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to load this workout.",
    };
  }
}
