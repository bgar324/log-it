# Decisions

This file records durable decisions visible in the codebase. Do not add speculative roadmap items here.

## Persist Workout Weights In Pounds

All workout set weights and workout totals are persisted as pounds (`weightLb`, `totalWeightLb`). User input/output respects `User.preferredWeightUnit`, but conversion happens at the boundaries through `lib/weight-unit*`.

## Use Date-Only Workout Dates

`WorkoutLog.performedAt`, exercise summary dates, and calendar read-model dates use `@db.Date`. Current-day behavior is based on Pacific time helpers in `lib/workout-date-utils.ts`.

## Keep Workout Writes In Service Modules

Workout payload parsing lives in `lib/workouts/payload.ts`; create/update/delete/duplicate behavior lives in `lib/workouts/service.ts` and `service.shared.ts`. Route handlers should stay thin: auth, request security, parsing, response mapping, cache invalidation, and read-model sync scheduling.

## Maintain Read Models For Dashboard Queries

`ExerciseSummary` and `WorkoutCalendarDay` are durable read models. Mutations call `syncWorkoutReadModels()` after write completion and invalidate workout data cache tags. Some dashboard queries fall back to source tables when read-model schema is unavailable.

## Multiple Saved Splits, One Active Split

The data model allows multiple `WorkoutSplit` rows per user. Service code maintains one active split with `isActive`; the active split drives dashboard planning, rest-day blocking, and workout logger preload. Split saves replace nested days/exercises, normalize all weekdays, and default missing days to `Rest`.

## Logged Today Means Date Plus Split Type

The dashboard `Logged!` state is based on today's Pacific date and normalized workout type matching the active split day assignment. It does not treat any workout on the same date as sufficient unless the workout type matches.

## Rest Days Block Workout Creation

`app/api/workouts/route.ts` checks the stored split seed for the selected date. If the user has a split and the day slug is `rest`, create returns a conflict instead of logging a workout.

## Use JWT Session Cookies

Sessions are signed JWTs stored in the `logit_session` HTTP-only cookie. Production requires `AUTH_SECRET`; development can derive a stable local secret.

## Use Query-String Dashboard Views

The dashboard shell uses `?view=` for overview/workouts/progress/split/profile. The client caches loaded view payloads in memory and fetches missing view data from `/api/dashboard/view-data`.

## Keep UI Monochrome And Operational

The product UI uses Geist, global `-0.03em` tracking, black/white theme variables, transparent panels, thin borders, compact controls, and natural-case text. See `docs/DESIGN_SYSTEM.md` and `docs/TYPOGRAPHY.md`.
