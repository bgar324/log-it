# Product

Logit is a lightweight workout journal. The durable product direction in the repo is fast workout entry, exercise history, split planning, profile preferences, and progress views without a full social network or coaching platform.

## Core Behaviors

- Users register and sign in with username/password credentials.
- First name, last name, email, username, preferred weight unit, public profile setting, and avatar are profile-level user data.
- The profile view is one list: identity (tappable avatar, name with a pencil that opens an edit dialog, `@username`, join month, public/private state), an account section of rows (email, password), and a bordered red danger zone holding account deletion. The edit dialog covers first name, last name, username, and profile visibility. Email and password changes open inline from their row; both require the current password. Account deletion is confirmed in a modal by typing the account username, is permanent, and removes all workouts, splits, and nutrition data.
- Usernames are editable and validated by one shared rule (`lib/username.ts`, 3–24 letters, numbers, or underscores). The server rejects duplicates and relies on the unique index for the race. Changing a username changes the `/u/[username]` public URL; the previous one stops resolving.
- Sign out lives in the drawer footer beside Settings, not on the profile view.
- A chosen profile photo applies immediately rather than waiting for a separate save.
- Signed-in users land on `/dashboard`.
- The dashboard has seven views: overview, workouts, progress, nutrition, split, profile, and settings. On phones the bottom bar reaches overview, the workout logger, and nutrition; the avatar drawer reaches workouts, progress, split, profile, and settings. Desktop lists every view in the sidebar.
- Dashboard view switching updates the query string, lazily loads missing view data, and reuses loaded views until an authoritative server refresh.
- The overview greets the user by first name and states today's plan as a sentence derived from the active split, followed by one action: log the planned workout, log an unscheduled workout on a rest day, or set up a split when none exists. The note under the plan counts both planned exercises and the sets they add up to, since ten exercises at two sets is a different session from seven at five. When today's split workout type is already logged for the current Pacific date it reads `Logged for today.` beside a quiet link to log another workout.
- Settings holds preferences only: theme and weight unit. Both apply on selection with no save button, and the unit write sends the saved profile values plus the chosen unit, so it can never commit unsaved Profile edits or a pending avatar. Account actions (email, password, sign out, delete) stay on the profile view, which is also the only place sign-out lives.
- Each view states its own numbers as a sentence rather than metric tiles. The overview carries no summary line at all (today's plan and one action only). Progress reads workouts this week, how that compares to last week, and a 12-week weekly average rounded **up**, and does not report total weight lifted. Workouts reads the lifetime total — or the match count when filters are active — over a muted all-time sets/exercises line.
- The overview does not repeat workout history or weekly counts; the workouts and progress views own those. Under the plan sentence, `Where you left off` lists every exercise today's split asks for: its set target on the left, and on the right the top set of the last session with `last hit <date>` under it. No all-time bests — the number shown is one you actually did, on the day named beneath it. An exercise with no history reads `First time`. Rest days and split-less accounts show no list.
- The workout logger's Back returns to the view that opened it, carried as `?from=<view>` and validated through `normalizeDashboardView`, so an unknown or hostile value lands on the dashboard rather than redirecting off-app. Editing an existing workout returns to that workout instead.
- The workout logger keeps only the sets on screen. Every action it offers — save the workout, add another exercise, reorder exercises, reset from split, rest timer — lives in one thumb-reachable dial in the bottom-right corner. Opening it blurs the page and reveals the actions as a staggered column with no panel around them. Save is the filled one. Picking a rest duration closes the dial and the trigger becomes the running clock, so the time is readable without opening anything; reopening a running timer lands on its own controls (skip, pause, add 30 seconds).
- The progress view's exercise list is search-first: a full-width search, then a count line carrying one named ordering (most recent, least recent, most sessions, fewest sessions), then the rows. It shows 6 and reveals 24 at a time instead of paging; searching or reordering resets to the first 6.
- Users can log, edit, duplicate, and delete workouts.
- Users can inspect workouts and exercise-specific history.
- Users can save multiple weekly splits and choose one active split to seed the workout logger.
- Users can track today's calories, protein, BMR target, and body weight from the Nutrition dashboard view, with recent-day history and day/week/month calorie charts.
- Public profiles exist at `/u/[username]` when enabled.

## Workout Logging

- Workout payloads require at least one exercise with a name and at least one valid set with reps or time.
- Empty workout titles become `Untitled workout`.
- Exercise names and workout types are normalized before persistence.
- Set reps must be positive integers unless the set has positive time in seconds.
- Weights are optional per set; provided weights must be non-negative decimals.
- Blank workout weight is treated as bodyweight; the logger exposes an explicit bodyweight control for bodyweight movements.
- Bodyweight sets count toward workout volume: each workout snapshots the user's tracked body weight for its date, and bodyweight sets are credited as body weight times reps. Movements still display as "Bodyweight"; per-exercise best weight stays external-load only.
- The logger accepts the user's preferred unit, but the database stores weights in pounds.
- New workout drafts are autosaved client-side in create mode, and the logger shows a quiet `Draft saved` indicator when a save flushes.
- Each exercise card states its history in one line (`Last hit May 15 · best 140 lb`, or `First time logging this.`), and each set row shows what that set was last time as muted ghost text with the predicted target as its input placeholder. Comparison is per set, inline; there is no comparison panel.
- Adding a set never refetches the comparison, and editing an existing workout never compares it against itself.
- Workout logs cannot be dated in the future.
- Duplicate workout creates a new workout dated to the current Pacific date and the API returns the new workout id.
- A user with an active weekly split sees a rest-day notice on an active-split rest day for the selected date. They can explicitly confirm an unscheduled-workout override; it does not change the split.
- Today's dashboard logged state is type-specific: a workout counts as logged only when its normalized workout type matches the active split day assignment.

## Split Planning

- Each user can save multiple splits.
- One split can be active at a time; the active split drives dashboard planning, rest-day notices, and workout logger preload.
- Split days cover Monday through Sunday.
- Missing days normalize to `Rest`.
- Duplicate weekdays are rejected by split payload normalization.
- The split view has no separate library panel. Its header is a selector listing every saved split (the active one marked `· Active`) plus a tools menu; `Rename split` swaps the selector for an input and persists the new name on commit (Escape restores the previous name), and `New split` creates one. One muted line under the selector states training days and exercises.
- Split exercise rows are borderless name/sets pairs. Per-row delete appears only after `Edit exercises` in the day's tools menu, and removes the exercise immediately without a confirmation dialog.
- Split exercises have display names, slugs, set targets, and one-based ordering.
- Saving a split replaces existing split days/exercises for that split.
- Deleting the active split activates the most recently updated remaining split when one exists.
- Split deletion uses a Sonner confirmation toast rather than `window.confirm`.
- Split data is cached by user and invalidated after writes.

## Progress And History

- The app tracks total workout counts, weekly activity, recent sessions, workout calendar summaries, personal best style summaries, exercise summary rows, and progress series.
- Workout history is filtered server-side and loaded 60 workouts at a time; users can reveal the loaded months and request older pages without capping the durable history record.
- The Nutrition view stores per-day calorie/protein totals, compares daily calories against the user's BMR target, keeps daily body-weight entries, and offers day/week/month calorie chart ranges.
- Exercise detail pages resolve route keys back to normalized exercise names and fall back to scanning workout exercises when needed.
- Exercise summaries and calendar day counts are maintained as read models, with source-table fallback paths in some loaders.

## Public Profiles

- Public profile data is derived from profile/split data plus workout aggregates and maintained exercise/calendar summaries.
- Public profile calculations include training tenure, total workouts, total sets, total volume, strongest lift, favorite workout type/day, most trained exercise, split display, and radar axes.
- Public avatars are served separately from private profile settings.

## Durable Constraints

- Persist all workout weights in pounds.
- Persist body-weight tracker entries in pounds.
- Treat workout dates as date-only values.
- Use Pacific time for current-day workout behavior.
- Keep the top of every authenticated view calm and sentence-led; keep the data rows underneath dense and operational. No metric-tile walls.
- Do not add social/coaching behavior unless product requirements explicitly change.

## Unknown

- UI entry point for duplicate workout behavior needs verification; the API and service exist, but no current UI trigger was found during this audit.
