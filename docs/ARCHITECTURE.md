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
- `/ionic/[[...path]]`: dormant Ionic experiment, disabled in production. Its code remains behind the server flag.
- `/api/ionic`: private, uncached GET loader for dashboard views, new/edit logger data, workout details, and exercise details. It requires a session and the Ionic rollout flag.

## Default authenticated redesign

The owner authorized deployment behind the existing server-evaluated PostHog `Ben` flag. Unflagged accounts keep the previous interface.

`WorkspaceDesignProvider` applies `[data-training-design="true"]` and the shared navigation boundary only when Ben is enabled and Nova is disabled. `training-theme.css` scopes tokens to that document, including portals. Flag failures and unauthenticated contexts default to the previous interface. Nova and Ionic remain separate dormant variants.

Home reads `asOfDate`, `activityDays`, the current plan, and the existing draft parser. `use-stored-workout-draft.ts` is shared with dormant workspace Home and never writes storage. The overview cache namespace is `v3-training-home`.

History groups loaded workouts into recorded days. `use-workout-details.ts` lazily reads the selected sessions through the owned, private `GET /api/workouts/:id` projection and aborts obsolete reads. `workout-return.ts` carries normalized view/day context through detail and edit pages. Missing older dates trigger successive existing history pages until the date is found or its range is exhausted.

`data.progress.ts` returns at most one aggregate per recorded date in a 760-day window. Set counts are collapsed before grouping so joins cannot multiply volume. Stored pounds convert once at the output boundary. Lifetime volume remains a separate aggregate. `analysis-model.ts` derives windows, comparisons, and weekly consistency without a provider call; `analysis-panel.tsx` and `analysis-chart.tsx` render the result. The daily cache namespace is `v2-daily-analysis`.

`use-focused-exercise.ts` tracks stable exercise identity independently of array position. The logger controller still owns draft recovery, insights, payloads, and submission. Reordering does not change the active exercise; adding selects the new exercise; removing chooses the neighboring valid index.

The default split manager now consumes `use-split-library-state.ts`. Its saved snapshots and per-split dirty keys survive folder switches. Navigation registers the whole dirty library and discards all drafts only after confirmation. The previous default-only state and persistence hooks are removed.

`app/_legacy/` preserves the affected UI from production baseline `1d7c93d`. Next private folders create no routes. `scripts/snapshot-legacy-ui.mjs` regenerates those files and rebases their imports without copying backend services or splitting the capability context. Dashboard, logger, detail pages, loading states, and toasts select the baseline for unflagged users. Public previews also use the baseline.

## Owner-only authenticated workspace

Status: production rollout disabled at the owner's request. The following section describes dormant code, not the active owner UI.

`WORKSPACE_ENABLED_USER_IDS` enables the Nova workspace across authenticated routes. `lib/workspace-feature-flag.ts` checks immutable account IDs on the server. Public pages and unflagged accounts keep the existing interface. The retired focused-logger flag is no longer read; Ionic remains separately disabled.

Protected layouts await `loadAuthenticatedDesign()` and render `WorkspaceDesignProvider` directly, supplying rollout and `Ben` capabilities to loading and error states. The theme wrapper stays outside the interactive navigation provider; the frame supplies post-commit navigation synchronization without a route/search subscription suspending that provider during streamed hydration. Session and capability reads use request-local React caching. Next.js remains the only routing owner. `/dashboard` renders Home; the visible tabs are Home, History, Progress, and Plan. Profile, Settings, and POST signout live in the account menu. Nutrition remains capability-gated.

`app/components/workspace-ui/` contains the shared Radix Nova primitives. `workspace-theme.css` scopes neutral tokens to documents containing `[data-workspace-design="nova"]`, including portalled overlays. Existing charts use `workspace-chart-theme` to adapt the legacy text-token names. `scripts/sync-workspace-ui.mjs` reproduces the primitive import from the reference workspace; its state variants require the matching Tailwind 4.3 compiler.

The views in `app/workspace/` reuse existing data loaders, controllers, and mutation services. History and exercise links open detail sheets without replacing the list. Direct URLs remain pages. Both use the same serializable projections through private, user-scoped `/api/workspace/workouts/[workoutId]` and `/api/workspace/exercises/[exerciseKey]` reads.

Home's `overview.loggedWorkoutId` comes from `findLoggedWorkoutForDateAndType`, not a guess from the recent five rows. It identifies a completed planned session, or a completed unscheduled session on rest days and without a split. The `v2-home-action` overview cache key prevents older cached payloads from omitting this field. Home reads the existing local draft through `useSyncExternalStore` and the logger's parser. Resume takes precedence over Open, then Start; Home never writes or clears the draft.

The quiet another-workout action uses `another=1`. The logger page accepts that intent only for workspace accounts with a split and an already-completed planned session. It skips the repeated UI choice, not the server's duplicate-write guard. Recovered drafts still take precedence.

`WorkoutLogger` still owns draft recovery, predictions, payloads, and saves. Its workspace renderer shows every exercise and set, with inline dnd-kit ordering and no completion state. A create draft is written only after edits and cleared after confirmed success. Edit save/discard never deletes an unrelated create draft. Dirty or recovered work survives server refresh, StrictMode replay, and unit conversion.

`WorkspaceNavigationProvider` guards dirty workout and plan edits, including account navigation and browser traversal. Confirming discard resets the editor before navigating, rather than relying on unmount. Modern browsers use the Navigation API; older browsers add a dirty-only history sentinel and keep clean navigation client-side. That legacy sentinel replaces forward history when editing begins. Document unload uses the native browser warning. Plan activation requires saved edits.

`use-split-library-state.ts` owns shared split editing and server-confirmed discard snapshots. The dormant Ionic views consume the same hook rather than maintaining a second copy.

## Ionic authenticated app

The owner rejected this design experiment on September 17, 2026. `IONIC_ENABLED_USER_IDS` is unset in production; the following describes dormant code, not the current interface.

`app/ionic/ionic-entry.tsx` dynamically loads the Ionic client with SSR disabled. This keeps Ionic's browser APIs out of server rendering. `ionic-app.tsx` owns `IonReactRouter`, `IonRouterOutlet`, tabs, menu, and page lifecycle. Public pages and backend routes remain in Next.js. Existing dashboard, logger, and detail URLs redirect enabled users into the corresponding Ionic route.

`lib/ionic-feature-flag.ts` checks `IONIC_ENABLED_USER_IDS` against the session's immutable user ID. Empty or missing configuration disables the app. Both the server entry and data endpoint check it. This flag is independent of the existing PostHog `Ben` experiment; changing a username or email cannot grant access. Vercel environment changes require a new deployment.

Ionic may retain hidden pages. `use-ionic-resource.ts` reloads active views on entry and after mutation invalidation, aborts obsolete reads, and handles expired sessions. The logger unmounts on leave so hidden pages cannot keep draft writers alive. Pending logger requests are aborted on unmount; an aborted response cannot clear a newer draft or navigate a different session. The server may already have accepted an aborted request, so normal duplicate handling remains authoritative.

`app/ionic/logger/` owns explicit set completion. Its account-scoped `logit-ionic-workout-draft-v1:<userId>` snapshot stores stable exercise/set IDs, completion, and the active set. A real edit arms debounce, page-hide, and unmount persistence. Save/discard disarms those writers. Legacy draft adoption records the exact source payload in the snapshot, so cleanup removes that key only if it still contains the adopted work. Native numeric fields use the existing unit, prediction, and submission helpers.

The Ionic screens reuse existing secured mutation endpoints and business services. No database schema or workout persistence format changes. Completion is draft-only state; only completed sets reach the existing workout payload.

## Authenticated navigation

`app/components/app-nav.tsx` owns the owner interface's header utilities and direct bottom navigation. There is no drawer, veil, sliding app layer, drawer focus trap, or drawer scroll lock in this interface.

`AppTabBar` exposes Home, History, Log, Split, Analysis, Profile, and Sign out below 900px. Its seven targets fit a 320px phone at a minimum 44px width. Avatar and Settings remain in the header. The desktop sidebar remains available from 900px upward.

Workout and exercise detail pages retain the bottom navigation and their quiet Back link. Loading screens use the same destinations. Logger routes remain task screens without the browsing dock.

Both bottom-bar and desktop sign-out use the shared unsaved-navigation boundary before resetting PostHog and submitting the native `POST /auth/signout` form. Cancel leaves the session and analytics identity intact; an in-flight editor save prevents sign-out.

Unflagged users retain the original drawer under `app/_legacy/`. Its presence and styling are independent of the owner navigation. PostHog identification and server-evaluated Ben capabilities remain unchanged.

## Shared authenticated interactions

`app/components/interaction.css` supplies menu/dialog entry and exit recipes plus drawer timing. Existing `action.styles.ts` and `data-list.styles.ts` still own control and list geometry. `field.styles.ts` centralizes field edge, fill, and focus feedback without changing per-screen density.

`ui/popover.tsx` wraps the installed Radix popover for legacy anchored disclosures. Controlled or uncontrolled open state also makes closing content inert. All callers prevent open/close autofocus; editing action rows additionally preserve input focus on pointer presses. `exercise-suggestions.tsx` composes the same anchor/portal positioning to share collision-aware results between logger and Split without scrolling the form.

`ui/legacy-dialog.tsx` supplies controlled Radix dialog presence, Escape/outside dismissal, scroll locking, no automatic focus transfer, and pending-request dismissal guards. Form and reorder drafts live inside the mounted content, surviving exit and resetting on the next complete opening. Callers keep the boundary mounted and pass `open`; they do not conditionally remove it at the start of exit. Close buttons also honor busy state.

Detail fallbacks pass the same Ben capability and return context as the loaded page. Edit routes reuse the focused logger skeleton. Dashboard skeletons now follow Home, the recorded-day browser, and the single Analysis graph.

API routes:

- `app/api/workouts/route.ts`: create and update workouts.
- `app/api/workouts/[workoutId]/route.ts`: private owned workout detail GET and workout-specific deletion.
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

`createWorkoutRecord()` in `lib/workouts/service.shared.ts` rejects a completed workout with the same user, date, and normalized workout type before creating nested records, so `createWorkout()` and `duplicateWorkout()` are both covered by one check. Both API routes map it to `409`. `/workouts/new` reads the same condition to render an already-logged notice instead of a blank form, and never redirects: a redirect would strand a recovered draft, and a second workout of a different type on the same date is still valid. The page resolves the identity the save would actually use — the active split day's slug, or `null` when the user has no split, because the create form cannot set a workout type — and passes `canLogAnotherWorkoutType` so the notice only offers a second workout when one could succeed. The check is a transaction read, not a unique index, so two genuinely simultaneous requests can both pass it. The API separately blocks logging on a split rest day when the selected date maps to `workoutTypeSlug === "rest"`.

`app/workouts/new/_hooks/use-workout-logger-draft.ts` owns the create-mode draft in `localStorage["logit-workout-draft-v2"]`. Two refs gate every write: `autosaveReadyRef` (recovery has run, so a write cannot race the restore) and `hasUnsavedEditsRef` (the user actually changed something). The debounced autosave and the `pagehide` flush both respect them, so opening the logger stores nothing and `markSaved()` — called after a successful create — cannot be undone by a flush during navigation. `recoverWorkoutDraft()` still restores the draft's own date; the logger compares it against the current Pacific date and renders the move-to-today/discard notice when they differ, because create mode has no date field.

## Workout Logger Compare

`/api/workouts/insights` is the logger's comparison endpoint and the feature the logger is built around. `lib/workouts/insight-request.ts` builds its request and an in-memory cache key from exercise name, date, and position only — deliberately not from set count, so adding a set never refetches. The route returns the last session's ordered sets, the all-time best weight (read from `ExerciseSummary` by primary key, falling back to the scanned window), and a prediction from `lib/workouts/prediction*.ts`.

The UI consumes it inline rather than as a panel: each draft set row shows the matching past set as muted ghost text (`lastSession.sets[index]`) and takes its weight/reps placeholders from `prediction.predictedSets[index]`. The exercise card carries one sentence — `Last hit May 15 · best 140 lb`, or `First time logging this.` Refetches carry the previous payload forward so the card never blanks or shifts, and edit mode passes `excludeWorkoutId` so a workout is never compared against itself.

`app/components/exercise-reorder-dialog.tsx` owns exercise ordering for both the split editor and the workout logger. One grab handle per row starts a pointer-captured drag; crossing another row updates only the dialog's draft order. `Save order` sends the ordered identifiers to the owning editor, while `Cancel`, the backdrop, and Escape discard the draft.

## Read Models And Caching

- `ExerciseSummary` and `WorkoutCalendarDay` are read models maintained by `lib/workout-read-models.*`.
- `syncWorkoutReadModels()` incrementally syncs affected exercise names and performed dates.
- Adding a field to a cached section payload requires bumping that entry's cache key. `loadCachedWorkoutHistorySection` carries a version segment (currently `"v4-lifetime"`) for exactly this reason: without it, entries written before the field existed keep being served and the view reads `undefined` off a cached object — a runtime crash that a typecheck and a fresh build both pass. `withLifetimeTotals()` backstops the same boundary by filling the field when an older entry lacks it.
- `ensureWorkoutReadModels()` / `rebuildWorkoutReadModelsForUser()` are available for rebuild paths.
- Dashboard and split data use `unstable_cache` with user-scoped cache tags from `lib/cache-tags.ts`.
- Nutrition view data uses a user-scoped cache tag and is invalidated after nutrition writes.
- The split dashboard payload includes the active split as `split` and the saved split library as `splits`.
- `todayPlan` includes `workoutTypeSlug` and `isLoggedToday`; overview loading sets `isLoggedToday` by matching today's Pacific date plus normalized workout type against existing workout logs.
- Overview includes `asOfDate`, three calendar months of activity aggregates, `loggedWorkoutId`, `todayPlan`, and `todaySession`. `loadTodaySession` reads the split seed, selects the newest workout exercise per planned name, and loads sets only for those rows. It shows the last session's top set rather than an all-time best. The workouts payload retains `workoutHistory.lifetime`.
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
- Ionic owns page-stack transitions under `/ionic`. `app/globals.css` retains the legacy overlay animations, reduced-motion rules, and touch defaults.

## Tests

`npm test` runs `scripts/run-tests.mjs`, which compiles tests with `tsconfig.test.json` and executes Node's built-in test runner.

Useful suites:

- `npm run test:features`: service-level workout flows.
- `npm run test:integrity`: scheduling, split, date, and data integrity invariants.
- `tests/*.test.ts`: focused helper and parser tests.

`scripts/verify-ionic.mjs` and `scripts/verify-ionic-logger.mjs` export no-write browser walkthroughs. They accept an isolated Puppeteer page, origin, short-lived session cookies, and artifact directory; the logger walkthrough also needs an existing workout ID for its intercepted success navigation. They intercept server mutations rather than creating test records. Use a dedicated headless browser, never the user's browser profile. The suite covers rollout isolation, phone/desktop themes, completion recovery, failure/retry, and post-save draft cleanup. Browser emulation does not prove physical iPhone keyboard or lock-screen behavior.

`scripts/verify-authenticated-interactions.mjs` exports `verifyAuthenticatedInteractions(page, { origin, sessionToken, artifactDir })`. Supply a dedicated headless Puppeteer page and an account with existing workouts and at least two saved splits. The walkthrough derives an owned workout from History, intercepts every mutation, checks failure and simulated-success paths, and restores draft storage. It verifies history returns, focused navigation and swipes, protected fan motion, split dirty/busy boundaries, and 320px, 390px, and 1440px layouts in both themes. Tokens stay outside source. Successful simulated responses prove client behavior, not database persistence.
