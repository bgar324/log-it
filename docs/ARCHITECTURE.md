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
- `/legal`, `/research`, `/research/*`: public legal/research content.
- `/u/[username]`: public profile route; availability depends on the user's `publicProfileEnabled` setting.

Protected product pages use `requireSessionUser()`:

- `/dashboard?view=dashboard|workouts|progress|nutrition|split|profile`: primary shell with client-side view switching.
- `/workouts`, `/workouts/new`, `/workouts/[workoutId]`, `/workouts/[workoutId]/edit`: workout history, logger, detail, and edit flows.
- `/exercises`, `/exercises/[exerciseKey]`: exercise index and detail history.
- `/profile` and `/progress`: redirect to `/dashboard?view=profile` and `/dashboard?view=progress`.
- `/preview/[view]?shell=1`: verification-only harness (noindex) that renders the real `DashboardShell` with demo data, so app chrome can be checked without a session. Without `shell=1` the same route renders the contained view components used by the landing page previews.

## App Chrome

`app/components/app-nav.tsx` owns every navigation surface of the authenticated app and is built as two layers:

- **Layer B — the drawer** is the base layer: always mounted, pinned to the left edge, `z-0`, `visibility: hidden` while closed. It holds the second-class sections (Profile, Workouts, Progress, Split), the shared three-segment theme control, and sign out.
- **Layer A — the app screen** sits on top at `z-10` with an opaque background. Opening the drawer translates layer A right by `min(17.5rem,78vw)` to reveal layer B underneath, rather than sliding a panel over the app. Dismissed by tapping the exposed app surface or pressing Escape; there is no gesture trigger.
- **The veil** (`navStyles.appVeil`) is what separates the layers: a viewport-anchored, full-bleed overlay, the last stage child at `z-40`, `pointer-events-none`, translating with layer A and ramping from `opacity: 0` over the same 280ms. It tints layer A with `--text` at 9% — so the exposed strip reads *lighter* than the drawer in dark and shaded in light — and draws the seam as a `border-l` at the canon 12% hairline.

Two placement decisions matter. The overlay is a stage sibling rather than a pseudo-element on layer A because the bottom bar is a stage sibling too, and a pseudo-element on the layer paints underneath the bar and leaves it bright. The seam is on the overlay rather than on the drawer's right edge because there it travels with layer A, fades in with the veil, and runs the full height of the viewport including across the bottom band. Both surfaces are otherwise painted `--bg`, so without a seam the two layers meet at an invisible edge.

Open state rides on a `data-drawer="open" | "closed"` attribute set on all four moving parts (drawer, layer A, bottom bar, veil) rather than an appended open class. The open utilities override base values rather than only adding to them, and two utilities from the same family win by emission order in the generated stylesheet, not by attribute order — an appended `opacity-100` cannot be relied on to beat a base `opacity-0`, while a `data-[drawer=open]:` variant wins on specificity.

`AppShell` provides both layers plus the bottom bar, owns the open state, and locks body scroll. It never moves focus — see the accessibility note in `docs/DESIGN_SYSTEM.md`. The stage uses `overflow-x: clip` — not `hidden`, which would turn it into a scroll container and break document scrolling and the sticky header.

The bottom bar is a stage sibling rather than a layer-A child, and translates by the same distance in sync. A translated ancestor becomes the containing block for `position: fixed` descendants, so a bar nested inside layer A resolves `bottom: 0` against the full page height and slides off-screen while the drawer is open; measured at 390px it dropped from `y=781` to `y=1126`. Keeping it viewport-anchored and translating it separately produces the same "whole foreground slides" effect without that artifact, and it becomes `pointer-events-none` while open so the close target stays the exposed app surface.

Inside layer A, each surface places the pieces it needs: `AppTopBar` (sticky header: drawer trigger, view title, accessory slot) or the bare `AppDrawerTrigger` next to an existing back control, plus the three-slot bottom bar `AppTabBar`. The default slots are Home, the filled log action, and Nutrition.

`DashboardShell` composes `AppShell` around the desktop sidebar and the content column. The bottom bar and drawer cover every width below 900px; the sidebar, which lists every section, covers 900px and up, so no viewport is left without navigation and layer A never translates on desktop. `/workouts/[workoutId]` and `/exercises/[exerciseKey]` render the same `AppShell` and put `AppDrawerTrigger` beside their back control, so the drawer's destinations are reachable off Home; they add `navStyles.mainInset` so the fixed bar never covers content. Route-loading skeletons render `AppTabBar` alone, since they have no session user. `/workouts/new` and `/workouts/[workoutId]/edit` are task surfaces: no nav chrome, only a sticky header with a back control and the bottom-right `WorkoutLoggerToolsFab`, whose dial contains Save and the other logger actions.

`instrumentation-client.ts` initializes PostHog. Authenticated client surfaces call `useIdentifyPostHogUser()` with the stable database user ID and current profile properties. Feature flag hooks render the standard interface until PostHog completes a targeted evaluation. The auth-free preview omits analytics identity, so its demo profile never identifies a real person.

API routes:

- `app/api/workouts/route.ts`: create and update workouts.
- `app/api/workouts/[workoutId]/route.ts`: workout-specific actions such as delete.
- `app/api/workouts/[workoutId]/duplicate/route.ts`: duplicate a workout.
- `app/api/workouts/exercise-suggestions/route.ts`: exercise suggestion lookup.
- `app/api/workouts/insights/route.ts`: workout logger insight lookup.
- `app/api/workout-split/route.ts`: split library API. `GET` returns `{ split, splits }`, where `split` is the active split and `splits` is the saved library. `POST` creates a default split, `PUT` saves a new or existing split, `PATCH` activates a split with `{ action: "activate", id }`, and `DELETE?id=` deletes a split.
- `app/api/dashboard/view-data/route.ts`: lazy dashboard view data.
- `app/api/dashboard/today-plan/route.ts`: current split/day plan.
- `app/api/nutrition/route.ts`: daily calorie/protein, BMR target, and body-weight tracker reads/writes.
- `app/api/profile/route.ts` and `app/api/profile/avatar/route.ts`: profile settings and avatar.
- `app/api/profile/password/route.ts`, `app/api/profile/email/route.ts`, `app/api/profile/account/route.ts`: account management. Password and email changes require the current password and re-issue the session cookie; account deletion requires typing the account username to confirm, cascades all user data, and clears the session.
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
- `WorkoutLog`: workout header, date-only `performedAt`, optional workout type/slug, status, total stored volume in pounds, an optional `bodyWeightLb` snapshot of the user's tracked body weight for that date, and exercises.
- `WorkoutExercise`: ordered exercise rows inside a workout; can link to canonical `Exercise`.
- `WorkoutSet`: ordered sets with reps, nullable `weightLb`, and optional `durationSeconds` for timed work.
- `NutritionEntry`: per-user, per-date calorie and protein totals.
- `BodyWeightEntry`: per-user, per-date body-weight logs stored in pounds and converted at input/output boundaries.
- `Exercise`: per-user canonical exercise names keyed by normalized name.
- `ExerciseSummary`: per-user read model for exercise history.
- `WorkoutCalendarDay`: per-user read model for workout counts by date.
- `WorkoutSplit`, `WorkoutSplitDay`, `WorkoutSplitExercise`: saved weekly split templates, one row per weekday inside each saved split, ordered exercises per split day. Multiple splits can belong to a user; `WorkoutSplit.isActive` marks the split used by logger/dashboard behavior. The schema indexes `[userId, isActive]` and `[userId, updatedAt]`.

Cascade behavior is part of the model: deleting a user deletes workouts, exercises, summaries, calendar days, split data, nutrition entries, and body-weight entries; deleting workout logs deletes nested exercises and sets.

## Workout Write Flow

1. Route handlers parse JSON and validate session/request origin.
2. `lib/workouts/payload.ts` normalizes title, workout type, date, unit, exercise names, reps, and weights.
3. Weights are converted to pounds before persistence.
4. `resolveBodyWeightLbForDate()` (`lib/body-weight.ts`) snapshots the user's tracked body weight for `performedAt` onto `WorkoutLog.bodyWeightLb`, and `computeWorkoutTotalWeightLb()` credits bodyweight sets (`weightLb` null) as `bodyWeightLb * reps`.
5. `lib/workouts/service.ts` creates, updates, deletes, or duplicates workouts inside Prisma transactions.
6. Mutation routes synchronize `syncWorkoutReadModels()` and revalidate `getWorkoutDataTag(user.id)` before returning success.

`createWorkout()` blocks logging on a split rest day when the user has an active split and the selected date maps to `workoutTypeSlug === "rest"`.

## Workout Logger Compare

`/api/workouts/insights` is the logger's comparison endpoint and the feature the logger is built around. `lib/workouts/insight-request.ts` builds its request and an in-memory cache key from exercise name, date, and position only — deliberately not from set count, so adding a set never refetches. The route returns the last session's ordered sets, the all-time best weight (read from `ExerciseSummary` by primary key, falling back to the scanned window), and a prediction from `lib/workouts/prediction*.ts`.

The UI consumes it inline rather than as a panel: each draft set row shows the matching past set as muted ghost text (`lastSession.sets[index]`) and takes its weight/reps placeholders from `prediction.predictedSets[index]`. The exercise card carries one sentence — `Last hit May 15 · best 140 lb`, or `First time logging this.` Refetches carry the previous payload forward so the card never blanks or shifts, and edit mode passes `excludeWorkoutId` so a workout is never compared against itself.

## Read Models And Caching

- `ExerciseSummary` and `WorkoutCalendarDay` are read models maintained by `lib/workout-read-models.*`.
- `syncWorkoutReadModels()` incrementally syncs affected exercise names and performed dates.
- Adding a field to a cached section payload requires bumping that entry's cache key. `loadCachedWorkoutHistorySection` carries a version segment (currently `"v4-lifetime"`) for exactly this reason: without it, entries written before the field existed keep being served and the view reads `undefined` off a cached object — a runtime crash that a typecheck and a fresh build both pass. `withLifetimeTotals()` backstops the same boundary by filling the field when an older entry lacks it.
- `ensureWorkoutReadModels()` / `rebuildWorkoutReadModelsForUser()` are available for rebuild paths.
- Dashboard and split data use `unstable_cache` with user-scoped cache tags from `lib/cache-tags.ts`.
- Nutrition view data uses a user-scoped cache tag and is invalidated after nutrition writes.
- The split dashboard payload includes the active split as `split` and the saved split library as `splits`.
- `todayPlan` includes `workoutTypeSlug` and `isLoggedToday`; overview loading sets `isLoggedToday` by matching today's Pacific date plus normalized workout type against existing workout logs.
- The overview payload carries only what the overview renders: `todayPlan` and `todaySession`. Counts, streaks, weekly bars, per-day calendar data and personal-best rows were removed with the tiles, calendar and records panel that displayed them. `loadTodaySession` (`data.today-session.ts`) reads the split seed for today, then one `DISTINCT ON (normalizedName)` raw query for the newest `WorkoutExercise` per planned name, then sets for only those rows — three round trips regardless of plan length. Neither alternative works: a shared `take` window is wrong by construction (an exercise untrained for months falls outside it, and the row then contradicts `ExerciseSummary`), and one `findFirst` per exercise is an N-query first paint. It shows the last session's top set, never `bestE1rmLb` or `bestWeightLb`. The workouts payload carries `workoutHistory.lifetime` for its summary line.
- Dashboard client-side view data is kept only for the mounted dashboard instance in `app/dashboard/dashboard-client.tsx`; `/api/dashboard/view-data` loads missing views. A loaded view is reused on later tab switches, while authoritative server refreshes reset the local data to prevent stale or cross-account payloads from being merged.
- Workout history is loaded in 60-row server pages. Filters are applied in PostgreSQL before pagination, and the client merges older pages by month on demand rather than serializing the user's full history into the initial dashboard payload.
- Public profiles use `ExerciseSummary`, `WorkoutCalendarDay`, scalar workout aggregates, grouped workout types, and a best-set-per-exercise query. They do not hydrate every historical workout/set into application memory.
- Several loaders catch Prisma schema mismatch errors and fall back to source tables for compatibility during migrations.

## Date And Unit Conventions

- Workout dates are date-only database dates (`@db.Date`), handled by `lib/workout-date-utils.ts`.
- Current-date behavior uses Pacific time through `getCurrentPacificDate()`.
- Persisted workout weights, workout totals, and body-weight tracker entries are stored in pounds. Profile display can be `LB` or `KG`.
- Unit conversion and formatting live in `lib/weight-unit*`.

## PWA And App Feel

- `app/manifest.ts` is the installable web app manifest (standalone display, `/dashboard` start URL, icons in `public/icons/`).
- `app/layout.tsx` exports `viewport` (`viewportFit: "cover"`, `themeColor`) and `metadata.appleWebApp`; the inline theme script and `app/components/pwa-client.tsx` keep the `theme-color` meta in sync with the manually chosen theme and register the service worker (production only).
- `public/sw.js` is a conservative service worker: it never touches `/api`, enables navigation preload so hard navigations do not wait for service-worker startup, keeps navigations network-authoritative with a `public/offline.html` fallback, and stale-while-revalidates static assets.
- Route transitions use the root `app/template.tsx` (`page-enter` animation); `app/globals.css` also holds view/segment transitions, a `prefers-reduced-motion` guard, and app-like touch defaults (no overscroll bounce, no tap highlight).

## Tests

`npm test` runs `scripts/run-tests.mjs`, which compiles tests with `tsconfig.test.json` and executes Node's built-in test runner.

Useful suites:

- `npm run test:features`: service-level workout flows.
- `npm run test:integrity`: scheduling, split, date, and data integrity invariants.
- `tests/*.test.ts`: focused helper and parser tests.

Unknown: there is no browser-driven UI test suite or live test database integration documented in the repo.
