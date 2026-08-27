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

## Navigate By Trip Frequency, Not Object Importance

The authenticated app has exactly three first-class destinations in a fixed bottom bar — Home, the log action, Nutrition — because those are the trips a user makes reflexively. Workouts, Progress, Split, and Profile are deliberate trips, so they live in a drawer opened by the top-left avatar; the poor reachability of that corner is acceptable precisely because the reach frequency is low.

The drawer is modeled as a layer, not a panel. It is the base layer of the app (`z-0`, always mounted, `visibility: hidden` while closed) and the app screen is an opaque layer on top of it; opening translates the app screen right to reveal the drawer underneath. A panel sliding over the app with a dimming scrim was built first and rejected: it reads as a web dropdown, while the reveal reads as an app. Consequences worth keeping: the stage uses `overflow-x: clip` rather than `hidden` so the document still scrolls and the header still sticks, and the trigger ships on every browsing surface (including workout and exercise detail) so second-class destinations are never reachable only from Home.

What the reveal still needs, and did not ship with, is a boundary. Both layers are painted `--bg`, so the exposed strip of app had no edge and its half-cut headings read as a second column of text next to the nav labels. Two additions fix it without turning the drawer back into a panel: the drawer draws the seam with a `border-r` canon hairline, and layer A fogs toward `--bg` at 65% behind a `backdrop-blur(7px)`. The dim is on the *revealed* layer, not on a scrim over the menu, which is what keeps the reveal reading as depth rather than as a modal. It is also a fog rather than a black scrim so it works in both themes: tinting toward `--bg` washes out in light and smokes in dark, matching the logger's dial.

The hamburger dropdown and its 761–899px navigation dead zone are gone: the bottom bar covers every width below 900px, the sidebar every width above it. The drawer has no gesture trigger, because a left-edge swipe collides with the platform back gesture in installed standalone web apps.

## State Facts In Sentences, Not Metric Tiles

The authenticated app ships zero KPI tiles. Today greets the user and names the plan (`Hi, Benjamin. / Today is Upper B.`), summary numbers render as one or two quiet typographic lines, and workout/exercise detail summaries are sentences. Every fact the old tile grids showed is retained; only the boxes are gone. A number is never printed twice on one screen, so views that expose an editable value no longer repeat it in a tile above the input.

## Compare Belongs Inside The Set Row

The workout logger's comparison is the feature the product is built around, so it renders where the work happens: each set row shows what that set was last time as ghost text and takes its placeholder from the prediction for that set index. The old panel above the sets — recommended target, expected range, confidence, predicted set flow, volume delta — is deleted. `lib/workouts/insight-request.ts` keys the request on exercise, date, and position but never set count, so adding a set costs no request, and refetches carry the previous payload forward so the card cannot collapse and shove the inputs down mid-workout.

## Phone Control Floors Are Not Negotiable

Anything a thumb hits is at least 44px on a phone and every text input is at least 16px, because smaller inputs make iOS Safari zoom the viewport on focus. Desktop density is restored with `min-[620px]:` / `min-[760px]:` overrides rather than by lowering the phone floor. `viewport` no longer sets `maximumScale`/`userScalable`, so pinch-zoom works.

## Filled Actions Use A Real CSS Class

Inverted primary actions use `.app-filled-action` in `app/globals.css` rather than Tailwind arbitrary color utilities. A `bg-[var(--text)] text-[var(--bg)]` pill was observed shipping with no color rule at all — a white label on a white pill that typechecks, builds, and reviews clean. Filled actions therefore carry real CSS and must be confirmed in a browser.

## Keep UI Monochrome And Operational

The product UI uses Geist, global `-0.03em` tracking, black/white theme variables, transparent panels, thin borders, and natural-case text. Controls are pill-radius; panels stay compact. See `docs/DESIGN_SYSTEM.md` and `docs/TYPOGRAPHY.md`.

## Track Nutrition By Date

Nutrition tracking uses one `NutritionEntry` per user and date for calorie/protein totals plus one optional `BodyWeightEntry` per user and date. BMR is a user-level calorie target used for daily and rolled-up chart comparisons.

## Bodyweight Sets Credit Tracked Body Weight

The workout logger and the body-weight tracker are wired together through a per-workout snapshot. On create/update/duplicate, `resolveBodyWeightLbForDate()` (`lib/body-weight.ts`) resolves the user's tracked body weight for the workout's `performedAt` — the entry on or before that date, then the nearest later entry, then null — and stores it on `WorkoutLog.bodyWeightLb`. `computeWorkoutTotalWeightLb()` credits bodyweight sets (`weightLb` null with reps) as `bodyWeightLb * reps`, so total workout volume reflects bodyweight training.

Individual bodyweight sets keep `weightLb = null`, so every set display still renders "BW"/"Bodyweight" and per-exercise best-weight remains external-load only. The snapshot is resolved at write time (not derived at read), so it fits the precomputed `totalWeightLb`/read-model architecture and stays stable if a later weigh-in is edited. The resolver returns null instead of throwing when the nutrition tables are absent, so workout logging never depends on the tracker.
