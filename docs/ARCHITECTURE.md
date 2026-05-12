# Architecture

Logit is a Next.js 16 App Router application using React 19, Prisma 6, PostgreSQL, Tailwind CSS v4, Recharts, Geist fonts, Lucide icons, Radix Popover, `sonner`, `bcryptjs`, and `jose`.

## Top-Level Structure

- `app/`: App Router pages, route handlers, client components, and page-local styles.
- `lib/`: durable business logic for auth, workout payloads/services, split services, read models, dates, weight units, public profiles, request security, exports, and Prisma access.
- `prisma/schema.prisma`: database schema and relation rules.
- `prisma/migrations/`: tracked migration history.
- `tests/`: Node test-runner suites compiled through `scripts/run-tests.mjs`.
- `docs/`: durable context for future implementation sessions.

## Main Routes

Public or auth-aware pages:

- `/`: redirects signed-in users to `/dashboard`; otherwise shows sign-in/register links.
- `/auth`: sign-in/register UI backed by `/auth/signin`, `/auth/register`, and `/auth/signout`.
- `/legal`, `/research`, `/research/*`: public legal/research content, including the Ben split assistant research page at `/research/ben`.
- `/u/[username]`: public profile route; availability depends on the user's `publicProfileEnabled` setting.

Protected product pages use `requireSessionUser()`:

- `/dashboard?view=dashboard|workouts|progress|split|profile`: primary shell with client-side view switching.
- `/workouts`, `/workouts/new`, `/workouts/[workoutId]`, `/workouts/[workoutId]/edit`: workout history, logger, detail, and edit flows.
- `/exercises`, `/exercises/[exerciseKey]`: exercise index and detail history.
- `/profile` and `/progress`: redirect to `/dashboard?view=profile` and `/dashboard?view=progress`.

API routes:

- `app/api/workouts/route.ts`: create and update workouts.
- `app/api/workouts/[workoutId]/route.ts`: workout-specific actions such as delete.
- `app/api/workouts/[workoutId]/duplicate/route.ts`: duplicate a workout.
- `app/api/workouts/exercise-suggestions/route.ts`: exercise suggestion lookup.
- `app/api/workouts/insights/route.ts`: workout logger insight lookup.
- `app/api/workout-split/route.ts`: split library API. `GET` returns `{ split, splits }`, where `split` is the active split and `splits` is the saved library. `POST` creates a default split, `PUT` saves a new or existing split, `PATCH` activates a split with `{ action: "activate", id }`, and `DELETE?id=` deletes a split.
- `app/api/workout-split/assistant/route.ts`: bounded split assistant. Requires a signed-in user and trusted mutation origin, accepts recent browser-held chat messages plus an optional unsaved draft, streams app-level SSE events (`message_delta`, `message_done`, `split_draft`, `limit_reached`, `error`), and can return a normalized unsaved split draft. Gemini is the default provider with `GEMINI_API_KEY` and `gemini-2.5-flash-lite`; `SPLIT_ASSISTANT_PROVIDER=anthropic` switches to Anthropic with `ANTHROPIC_API_KEY` and `claude-haiku-4-5-20251001`; `SPLIT_ASSISTANT_MODEL` overrides the provider default.
- `app/api/dashboard/view-data/route.ts`: lazy dashboard view data.
- `app/api/dashboard/today-plan/route.ts`: current split/day plan.
- `app/api/profile/route.ts` and `app/api/profile/avatar/route.ts`: profile settings and avatar.
- `app/api/users/[username]/avatar/route.ts`: public avatar serving.

## Auth And Request Security

- `lib/auth.ts` owns password hashing, password verification, JWT session creation, cookie setting/clearing, session lookup, and protected-page redirects.
- Session cookie name is `logit_session`; JWTs use HS256, issuer `logit`, and a seven-day max age.
- `AUTH_SECRET` is required outside development/test. Development can derive a stable local secret from the project path.
- Auth forms post to route handlers and redirect with query-string error codes.
- Mutation routes call `isTrustedMutationRequest()` from `lib/request-security.ts` before writing.

## Data Model

Source of truth is `prisma/schema.prisma`.

- `User`: account, profile, public profile setting, avatar bytes/mime/update timestamp, preferred weight unit, and relations.
- `WorkoutLog`: workout header, date-only `performedAt`, optional workout type/slug, status, total stored volume in pounds, and exercises.
- `WorkoutExercise`: ordered exercise rows inside a workout; can link to canonical `Exercise`.
- `WorkoutSet`: ordered sets with reps and nullable `weightLb`.
- `Exercise`: per-user canonical exercise names keyed by normalized name.
- `ExerciseSummary`: per-user read model for exercise history.
- `WorkoutCalendarDay`: per-user read model for workout counts by date.
- `WorkoutSplit`, `WorkoutSplitDay`, `WorkoutSplitExercise`: saved weekly split templates, one row per weekday inside each saved split, ordered exercises per split day. Multiple splits can belong to a user; `WorkoutSplit.isActive` marks the split used by logger/dashboard behavior. The schema indexes `[userId, isActive]` and `[userId, updatedAt]`.
- `SplitAssistantUsage`: per-user, per-Pacific-date counter for generated split drafts. It enforces the daily assistant draft cap without storing chat transcripts.

Cascade behavior is part of the model: deleting a user deletes workouts, exercises, summaries, calendar days, and split data; deleting workout logs deletes nested exercises and sets.

## Workout Write Flow

1. Route handlers parse JSON and validate session/request origin.
2. `lib/workouts/payload.ts` normalizes title, workout type, date, unit, exercise names, reps, and weights.
3. Weights are converted to pounds before persistence.
4. `lib/workouts/service.ts` creates, updates, deletes, or duplicates workouts inside Prisma transactions.
5. Mutation routes schedule `syncWorkoutReadModels()` with `after()` and revalidate `getWorkoutDataTag(user.id)`.

`createWorkout()` blocks logging on a split rest day when the user has an active split and the selected date maps to `workoutTypeSlug === "rest"`.

## Read Models And Caching

- `ExerciseSummary` and `WorkoutCalendarDay` are read models maintained by `lib/workout-read-models.*`.
- `syncWorkoutReadModels()` incrementally syncs affected exercise names and performed dates.
- `ensureWorkoutReadModels()` / `rebuildWorkoutReadModelsForUser()` are available for rebuild paths.
- Dashboard and split data use `unstable_cache` with user-scoped cache tags from `lib/cache-tags.ts`.
- The split dashboard payload includes the active split as `split` and the saved split library as `splits`.
- The split assistant keeps chat state client-side for v1. Generated drafts are advisory and unsaved until the user explicitly creates a split through the normal split save API. Draft parsing lives in `lib/workout-splits/assistant.ts`, normalizes incomplete weeks to rest days, clamps generated set counts, accepts simple generated weekday labels such as `Day 1`, and rejects duplicate weekdays.
- `app/dashboard/split-assistant-panel.tsx` owns the split assistant UI. It renders assistant markdown for basic emphasis/bullets, shows generated day/exercise previews, and clears accepted drafts after `saveGeneratedWorkoutSplit()` creates a real split through `PUT /api/workout-split`.
- `todayPlan` includes `workoutTypeSlug` and `isLoggedToday`; overview loading sets `isLoggedToday` by matching today's Pacific date plus normalized workout type against existing workout logs.
- Dashboard client-side view data is cached in memory in `app/dashboard/dashboard-client.tsx`; `/api/dashboard/view-data` loads missing views. Initial client render starts from the server-provided payload and seeds the cache afterward so cached view data does not cause hydration mismatches.
- Several loaders catch Prisma schema mismatch errors and fall back to source tables for compatibility during migrations.

## Date And Unit Conventions

- Workout dates are date-only database dates (`@db.Date`), handled by `lib/workout-date-utils.ts`.
- Current-date behavior uses Pacific time through `getCurrentPacificDate()`.
- Persisted workout weights and totals are stored in pounds. Profile display can be `LB` or `KG`.
- Unit conversion and formatting live in `lib/weight-unit*`.

## Tests

`npm test` runs `scripts/run-tests.mjs`, which compiles tests with `tsconfig.test.json` and executes Node's built-in test runner.

Useful suites:

- `npm run test:features`: service-level workout flows.
- `npm run test:integrity`: scheduling, split, date, and data integrity invariants.
- `tests/*.test.ts`: focused helper and parser tests.
- `tests/suites/features/split-assistant-route.test.ts` and `tests/workout-split-assistant.test.ts`: assistant route, usage-limit, and generated draft normalization coverage.

Unknown: there is no browser-driven UI test suite or live test database integration documented in the repo.
