# Decisions

This file records durable decisions visible in the codebase. Do not add speculative roadmap items here.

## Persist Workout Weights In Pounds

All workout set weights, workout totals, and body-weight tracker entries are persisted as pounds (`weightLb`, `totalWeightLb`). User input/output respects `User.preferredWeightUnit`, but conversion happens at the boundaries through `lib/weight-unit*`.

## Use Date-Only Workout Dates

`WorkoutLog.performedAt`, exercise summary dates, and calendar read-model dates use `@db.Date`. Current-day behavior is based on Pacific time helpers in `lib/workout-date-utils.ts`.

## Keep Workout Writes In Service Modules

Workout payload parsing lives in `lib/workouts/payload.ts`; create/update/delete/duplicate behavior lives in `lib/workouts/service.ts` and `service.shared.ts`. Route handlers should stay thin: auth, request security, parsing, response mapping, cache invalidation, and read-model sync scheduling.

## Maintain Read Models For Dashboard Queries

`ExerciseSummary` and `WorkoutCalendarDay` are durable read models. Workout mutations synchronize them and invalidate workout cache tags before returning success, so the dashboard never relies on a best-effort background sync. Some dashboard queries fall back to source tables when read-model schema is unavailable.

## Multiple Saved Splits, One Active Split

The data model allows multiple `WorkoutSplit` rows per user, with a PostgreSQL partial unique index enforcing zero or one active split per user. Service code maintains that invariant; the active split drives dashboard planning, rest-day blocking, and workout logger preload. Split saves replace nested days/exercises, normalize all weekdays, and default missing days to `Rest`.

## Logged Today Means Date Plus Split Type

The dashboard `Logged!` state is based on today's Pacific date and normalized workout type matching the active split day assignment. It does not treat any workout on the same date as sufficient unless the workout type matches.

## Rest Days Require An Explicit Workout Override

Rest-day behavior checks the stored split-day slug, not the editable display name. `app/api/workouts/route.ts` blocks creation for a split rest day unless the user has explicitly confirmed the logger&apos;s unscheduled-workout override. The override saves a normal workout and never mutates the weekly split.

## Use JWT Session Cookies

Sessions are signed JWTs stored in the `logit_session` HTTP-only cookie. Production requires `AUTH_SECRET`; development can derive a stable local secret.

## Use Query-String Dashboard Views

The dashboard shell uses `?view=` for overview/workouts/progress/split/profile. The client keeps loaded view payloads only for the mounted dashboard instance and discards them whenever authoritative server props refresh, preventing stale or cross-account data from being merged into a new session.

## Keep Calendar Detail Month-Scoped

The overview returns calendar aggregates for statistics and month navigation, but returns workout titles and ids only for the current month. The client fetches another month from `/api/dashboard/calendar` after the user navigates there, keeping long training histories out of the initial dashboard payload.

## Keep UI Monochrome And Operational

The product UI uses Geist, global `-0.03em` tracking, black/white theme variables, transparent panels, thin borders, compact controls, and natural-case text. See `docs/DESIGN_SYSTEM.md` and `docs/TYPOGRAPHY.md`.

## Track Nutrition By Date

Nutrition tracking uses one `NutritionEntry` per user and date for calorie/protein totals plus one optional `BodyWeightEntry` per user and date. BMR is a user-level calorie target used for daily and rolled-up chart comparisons.

## Bodyweight Sets Credit Tracked Body Weight

The workout logger and the body-weight tracker are wired together through a per-workout snapshot. On create/update/duplicate, `resolveBodyWeightLbForDate()` (`lib/body-weight.ts`) resolves the user's tracked body weight for the workout's `performedAt` — the entry on or before that date, then the nearest later entry, then null — and stores it on `WorkoutLog.bodyWeightLb`. `computeWorkoutTotalWeightLb()` credits bodyweight sets (`weightLb` null with reps) as `bodyWeightLb * reps`, so total workout volume reflects bodyweight training.

Individual bodyweight sets keep `weightLb = null`, so every set display still renders "BW"/"Bodyweight" and per-exercise best-weight remains external-load only. The snapshot is resolved at write time (not derived at read), so it fits the precomputed `totalWeightLb`/read-model architecture and stays stable if a later weigh-in is edited. The resolver returns null instead of throwing when the nutrition tables are absent, so workout logging never depends on the tracker.
