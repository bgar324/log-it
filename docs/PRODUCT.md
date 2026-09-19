# Product

Logit is a lightweight workout journal. The durable product direction in the repo is fast workout entry, exercise history, split planning, profile preferences, and progress views without a full social network or coaching platform.

## Default authenticated experience

The reference-driven redesign is an owner-only rollout behind the existing PostHog `Ben` flag. Unflagged users and public previews retain the previous UI. Nova and Ionic remain disabled.

Home is personal and plan-first. History browses recorded days. Analysis combines a dominant graph, metric selectors, activity, and descriptive weekly consistency. The logger shows one exercise at a time without requiring set completion. Saved splits use folders with separate Open and Set active actions.

## Dormant Nova workspace

The owner disabled this rollout. The following rules describe its retained code, not the default interface.

The owner rollout covers workout entry/editing, history and details, progress and exercise details, plans, profile, settings, and account management. The homepage and other public pages are unchanged. Unflagged accounts retain the existing app.

Home is the default app screen. Home, History, Progress, and Plan remain visible in a bottom tab bar on phones and header tabs on desktop. Profile, Settings, and Sign out are in the account menu. Home shows today's plan, recent sessions, and one primary action: resume a recoverable draft, otherwise open today's saved workout, otherwise start a workout. Reading a recent session opens a sheet over Home. Back and successful new-workout saves return to the originating view, defaulting to Home.

All exercises and sets remain visible while logging. Add set, Add exercise, and Save are ordinary controls; no per-set completion or exercise accordion is required. Inline drag handles update exercise order. Week reordering uses a sheet with explicit cancel/save. Metadata and secondary actions use standard sheets and menus.

Create-mode drafts autosave after real edits. Leaving an edited workout or plan requires a save/discard decision; failed saves retain inputs. A dirty plan cannot be activated until saved. The existing `Ben` capability keeps Nutrition and rest timing out of the owner's interface.

## Ionic experiment, disabled

The owner rejected the Ionic design. Its production flag is off and its code remains dormant. The behavior below applies only if that separate experiment is explicitly re-enabled.

Accounts enabled by the server-side Ionic flag use an Ionic shell with adaptive platform controls. Everyone else retains the interface described below. The experiment covers all authenticated sections, with public pages unchanged.

The logger works one set at a time. Prior results and predicted placeholders stay beside the active set. `Complete set` validates the entered result, records completion locally, and advances to the next unfinished set. It does not create a server workout. Editing a completed value makes that set incomplete again.

`Finish workout` submits completed sets only. It asks before excluding entered but incomplete sets; Retry follows the same checks. Blank predicted targets never become results by themselves. Bodyweight requires an explicit BW selection. Timed sets remain supported. Existing workouts open with their saved sets completed so unchanged edits preserve them.

Users can switch exercises freely, drag their order, add/remove sets and exercises, edit the title, and reset from the active split. Rest timing is off until selected, with manual start, pause, skip, and extra time controls. Account-scoped drafts preserve completion and position across reloads and navigation. Older recovered dates still require move-to-today or discard.

Ionic account, nutrition, split, history, and progress screens use the existing APIs and product rules. Forms stop accepting edits while saving so the response cannot overwrite newer typing. Split and logger reordering use Ionic's drag handles. History also exposes `Older workouts`, since a short list cannot trigger infinite scrolling.

## Core Behaviors

- Users register and sign in with username/password credentials.
- First name, last name, email, username, preferred weight unit, public profile setting, and avatar are profile-level user data.
- The profile view is one list: identity (tappable avatar, name with a pencil that opens an edit dialog, `@username`, join month, public/private state), an account section of rows (email, password), and a bordered red danger zone holding account deletion. The edit dialog covers first name, last name, username, and profile visibility. Email and password changes open inline from their row; both require the current password. Account deletion is confirmed in a modal by typing the account username, is permanent, and removes all workouts, splits, and nutrition data.
- Usernames are editable and validated by one shared rule (`lib/username.ts`, 3–24 letters, numbers, or underscores). The server rejects duplicates and relies on the unique index for the race. Changing a username changes the `/u/[username]` public URL; the previous one stops resolving.
- Sign out remains in the phone navigation drawer and desktop sidebar, not Profile. Profile and Settings have direct controls in the top utility row.
- A chosen profile photo applies immediately rather than waiting for a separate save.
- Signed-in users land on `/dashboard`.
- The dashboard has seven views: overview, workouts, progress, nutrition, split, profile, and settings. The phone pill holds Home, Log, owner Split or standard Nutrition, and Analysis. The drawer holds secondary destinations. Desktop retains its sidebar.
- Dashboard view switching updates the query string, lazily loads missing view data, and reuses loaded views until an authoritative server refresh.
- Home greets the user by first name and states today's plan. Its primary action is Resume for a recoverable draft, otherwise Open for today's saved session, otherwise Start. The plan note counts exercises and sets. Rest days offer an explicit unscheduled workout; accounts without a split can set one up.
- Settings holds preferences only: theme and weight unit. Both apply on selection with no save button, and the unit write sends the saved profile values plus the chosen unit, so it can never commit unsaved Profile edits or a pending avatar. Email, password, and account deletion stay on the profile view; sign out stays in app chrome.
- Analysis shows one graph with Week, Month, and Year windows and Sessions, Sets, and Volume selectors. Its notes are arithmetic on recorded data, not AI coaching. Consistency is weekly, not daily; rest days do not break it, and an unfinished current week is excluded until a session is recorded.
- Home includes three calendar months of activity, a link to the latest session, and today's planned exercises with their prior result. These are recorded facts, not recovery or adherence scores.
- Logger Back and successful create saves return to the originating view, defaulting to Home. Edit Back and successful saves return to the workout detail. History's validated `day` context survives that chain and loads older pages when necessary.
- The logger shows one exercise with all its sets. Previous, Next, a jump list, and swipes navigate without losing values. Save, Add exercise, Reorder, Reset from split, and capability-gated timing remain in a thumb-reachable tools fan. Add set and Delete exercise stay in the exercise menu. The owner does not see timing or Nutrition.
- The progress view's exercise list is search-first: a full-width search, then a count line carrying one named ordering (most recent, least recent, most sessions, fewest sessions), then the rows. It shows one page of eight with an arrow at each edge of the panel and the position between them, so the panel stays the same height however deep you go; searching or reordering returns to the first page. Each row reads the exercise and its sessions, sets, and reps on the left, with the best weight and when it was last hit on the right. An exercise trained only at bodyweight reads `Bodyweight` rather than `0 lb`.
- Nutrition does not ask for numbers nobody can estimate. Above the fields it offers the days you have already logged as one-tap rows that fill calories and protein for you, with a repeated total ranked above a recent one-off and a median "typical day" when nothing else fits. Today is never offered back, since the form already holds it. Partial entries are allowed: log the calories without the protein, or neither.
- Users can log, edit, duplicate, and delete workouts.
- Users can inspect workouts and exercise-specific history.
- Users can save multiple weekly splits and choose one active split to seed the workout logger.
- Split folders distinguish the active plan from the plan being edited. Opening another folder never activates it. Unsaved day edits survive folder switches; leaving the library warns about all dirty plans. Activation requires saved edits.
- Users can track today's calories, protein, BMR target, and body weight from the Nutrition dashboard view, with recent-day history and day/week/month calorie charts.
- Public profiles exist at `/u/[username]` when enabled.

## Workout Logging

- Workout payloads require at least one exercise with a name and at least one valid set with reps or time.
- Empty workout titles become `Untitled workout`.
- Exercise names and workout types are normalized before persistence.
- Set reps must be positive integers unless the set has positive time in seconds.
- Weights are optional per set; provided weights must be non-negative decimals.
- Blank workout weight is treated as bodyweight. The standard logger exposes an explicit `BW` control. The personal interface removes `BW` and Time while preserving blank-weight payloads and existing bodyweight sets.
- Bodyweight sets count toward workout volume: each workout snapshots the user's tracked body weight for its date, and bodyweight sets are credited as body weight times reps. Movements still display as "Bodyweight"; per-exercise best weight stays external-load only.
- The logger accepts the user's preferred unit, but the database stores weights in pounds.
- Create-mode workout drafts are autosaved client-side, but only after the user changes something: opening the logger and leaving it stores nothing. A saved workout deletes its draft, and nothing — including the page-hide flush — puts it back.
- A recovered draft keeps its own date, because it is unfinished work from that day rather than a template. When that date is not today, the logger says so and offers exactly two resolutions: move the draft to today, or discard it and return to the seeded form. The create form has no date field, so without that notice a draft from an earlier day can neither be saved nor cleared.
- Each exercise states when it was last trained, while each set shows its prior result as muted ghost text and its predicted target as a placeholder. There is no separate comparison panel or invented all-time best.
- Adding a set never refetches the comparison, and editing an existing workout never compares it against itself.
- Workout logs cannot be dated in the future.
- Duplicate workout creates a new workout dated to the current Pacific date and the API returns the new workout id.
- A user with an active weekly split sees a rest-day notice on an active-split rest day for the selected date. They can explicitly confirm an unscheduled-workout override; it does not change the split.
- Today's dashboard logged state is type-specific: a workout counts as logged only when its normalized workout type matches the active split day assignment.
- A user cannot create the same normalized workout type twice on one date, whether the workout is logged in the logger or duplicated from an existing one. When the selected date already holds that workout, the logger states it and offers the saved workout instead of a blank form; a recovered draft skips the notice so unfinished work stays reachable. Without an active split the logger cannot set a workout type, so the notice offers only the saved workout — a second workout that day would collide with it. The write boundary rejects a duplicate that reaches it and the API answers `409`. Different workout types may coexist on one date. The check runs inside the write transaction, so it closes the app's own paths rather than acting as a database constraint.

## Split Planning

- Each user can save multiple splits.
- One split can be active at a time; the active split drives dashboard planning, rest-day notices, and workout logger preload.
- Split days cover Monday through Sunday.
- Missing days normalize to `Rest`.
- Duplicate weekdays are rejected by split payload normalization.
- The split view has no separate library panel. Its header is a selector listing every saved split (the active one marked `· Active`) plus a tools menu; `Rename split` swaps the selector for an input and persists the new name on commit (Escape restores the previous name), and `New split` creates one. One muted line states training days and exercises.
- Below `981px` the split itself is a one-screen weekly agenda: a `Week` header owns one visible `Reorder` action, followed by seven compact weekday rows with the current Pacific weekday marked `Today`. Tapping a row opens an instant full-viewport day editor with its own `Save` action and a seven-day switcher, so editing never requires scrolling past the rest of the week. At `981px` and wider, the week and selected-day editor stay side by side, and the editor keeps its own `Save`.
- The week has no Save of its own. Week reordering uses fixed weekday slots and two deliberate taps: choose a workout, then choose its destination day. The other assignments shift around it. Tapping the selected workout again cancels the selection; `Save` applies and persists the new order, and `Cancel` discards it. Day edits persist from the day editor's `Save`.
- Split exercise rows are borderless name/sets pairs with visible column labels. `Add exercise` is visible in the day editor. Reordering and the explicit delete mode live in the day tools menu; delete removes the exercise immediately because entering that mode is the confirmation. Split and logger exercise reordering share the same grab-handle drag dialog. `Save order` applies the draft and `Cancel` discards it.
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
- An exercise's page states its history the way workout detail does: the name, one sentence counting sessions, sets, and average reps, and one muted line carrying the best weight (or `Bodyweight only`) and when it was last hit. Below it, two charts and a session list: each row is the date and the workout it belonged to, with that day's top set and its sets, reps, and volume. The workout type is only printed when it differs from the workout title. The list pages five sessions at a time.
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
