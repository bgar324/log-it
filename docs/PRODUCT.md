# Product

Logit is a lightweight workout journal. The durable product direction in the repo is fast workout entry, exercise history, split planning, profile preferences, and progress views without a full social network or coaching platform.

## Default authenticated experience

The approved training interface is available to every authenticated user. Public previews retain their baseline snapshot. Nova and Ionic remain disabled. The existing PostHog `Ben` capability still hides Nutrition, rest timing, and optional logger fields for the owner; it no longer gates the redesign.

Home is personal and plan-first. History browses recorded days. There is no separate Analysis page. Existing per-exercise detail graphs remain available; no replacement Home graph has been added. The logger shows one exercise at a time without requiring set completion. Saved splits use folders with separate Open and Set active actions.

Motion follows Transitions.dev across menus, confirmations, navigation indicators, Split folders, row movement, save feedback, and loading. It explains changes without delaying actions. Inputs and recorded numbers remain readable; reduced motion preserves identical state and behavior. Logger Back and save navigation do not wait for an exit animation.

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
- Sign-out lives in Profile and remains in the desktop sidebar. It is absent from the phone bottom bar and respects the existing navigation boundary.
- A chosen profile photo applies immediately rather than waiting for a separate save.
- Signed-in users land on `/dashboard`.
- Phone navigation provides Home, History, and Split, plus Nutrition for accounts with that capability. Home owns the primary workout-entry action. Profile is reached through the header avatar. The authenticated interface has no drawer.
- Dashboard view switching updates the query string, loads missing data, and reuses loaded data. Navigation and browser Back reset vertical scroll to the top rather than retaining the previous offset.
- Home greets the user by first name and states today's plan. Its primary action is Resume for a recoverable draft, otherwise Open for today's saved session, otherwise Start. The plan note counts exercises and sets. Rest days offer an explicit unscheduled workout; accounts without a split can set one up.
- Settings holds preferences only: theme and weight unit. Both apply on selection with no save button, and the unit write uses saved profile values rather than another form's draft. Email, password, account deletion, and phone Sign out are in Profile.
- Analysis is removed from navigation and direct-entry routes. Existing per-exercise history pages remain; the proposed Home graph is not implemented.
- Home includes three calendar months of activity and sentence-led planned exercises without ordinals. Each sentence identifies the last session's date and top set. Suggested top-set targets come only from `predictExercisePerformance()` with medium or high confidence; missing or low-confidence predictions leave only past performance and today's planned set count. Dates and performance values use primary text against muted prose. A completed session does not receive another target for today.
- Logger Back and successful create saves return to the originating view, defaulting to Home. Edits opened from History return directly to the selected recorded day; other edit entry points return to the workout detail. History's validated `day` context survives editing and loads older pages when necessary.
- The logger shows one exercise card with all its sets. Circular arrows and a position/jump control sit above the floating actions; dragging does not change exercises. Far-left red trash confirms removal of the focused exercise and its sets, except the last remaining exercise. The floating plus adds an exercise, followed by Reorder and available Reset from split. Save remains at the right. Add set is at the card's bottom; there is no exercise ellipsis menu or duplicate Add exercise button. Pending saves disable all actions. The owner does not see timing or Nutrition.
- Legacy and dormant progress interfaces retain their exercise indexes. They are not exposed as an Analysis destination in the current owner interface.
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
- The owner logger displays the draft/saved workout name as its heading. The pencil edits that name inline and updates the same draft used by Save, including when Save is clicked before the field loses focus. Date and workout type share the small metadata line above; existing-workout metadata stays editable inline without a details popup.
- Exercise names and workout types are normalized before persistence.
- Set reps must be positive integers unless the set has positive time in seconds.
- Weights are optional per set; provided weights must be non-negative decimals.
- Blank workout weight is treated as bodyweight. The standard logger exposes an explicit `BW` control. The personal interface removes `BW` and Time while preserving blank-weight payloads and existing bodyweight sets.
- Bodyweight sets count toward workout volume: each workout snapshots the user's tracked body weight for its date, and bodyweight sets are credited as body weight times reps. Movements still display as "Bodyweight"; per-exercise best weight stays external-load only.
- The logger accepts the user's preferred unit, but the database stores weights in pounds.
- Create-mode workout drafts are autosaved client-side, but only after the user changes something: opening the logger and leaving it stores nothing. A saved workout deletes its draft, and nothing — including the page-hide flush — puts it back.
- A recovered draft keeps its own date, because it is unfinished work from that day rather than a template. When that date is not today, the logger says so and offers exactly two resolutions: move the draft to today, or discard it and return to the seeded form. The create form has no date field, so without that notice a draft from an earlier day can neither be saved nor cleared.
- The owner logger leaves empty fields blank. Directly beneath the logging card, a quiet guidance container separates the dated last session from suggested sets for today. Exercise navigation stays near the thumb above the floating bottom actions. Guidance uses the existing predictor, shows targets only at medium/high confidence, and never changes entered values. Suggestions follow the planned set count; prior sets remain visible. Loading/error states do not present stale guidance as current.
- Adding a set never refetches the comparison, and editing an existing workout never compares it against itself.
- Swiping across a set's input row, including its weight/reps fields, reveals a circular trash button rather than a full-width action. Its 44px target has 12px clearance from the inputs. Taps still edit fields; vertical drags scroll. Opening another row closes the previous one. Delete requires confirmation, and the set-number menu provides a non-swipe alternative. The last remaining set cannot be deleted.
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
- The owner Split view opens with the saved-folder library. Opening a folder goes directly to its inline editor; it never activates the split. Back returns to the folders without discarding local edits.
- The inner editor has the split name, one Save action, and a horizontally scrollable day selector. Phone and desktop use the same single-editor flow: no intermediate week overview, separate day screen, or full-screen day modal.
- Split options retain rename, activation, copy, deletion, discard, and day reordering. Day reordering uses fixed weekday slots and deliberate source/destination selection; Save order persists the reordered plan. Ordinary day edits use the one split Save action. Pending saves disable conflicting edits.
- Exercise rows keep editable names and labelled numeric set counts, separated by quiet hairlines. Add exercise, reordering, and the explicit remove mode live in the three-dot Day options menu beside the workout name. The menu remains available for empty training days. Removing an exercise is only available after entering remove mode. Split weekday moves, Split exercise order, and logger exercise order share one select-then-destination dialog with Cancel and Save order.
- Split exercises have display names, slugs, set targets, and one-based ordering.
- Saving a split replaces existing split days/exercises for that split.
- Deleting the active split activates the most recently updated remaining split when one exists.
- Split deletion uses a Sonner confirmation toast rather than `window.confirm`.
- Split data is cached by user and invalidated after writes.

## Progress And History

- The app tracks total workout counts, weekly activity, recent sessions, workout calendar summaries, personal best style summaries, exercise summary rows, and progress series.
- Workout history loads 60 workouts at a time. Owner History browses calendar months without a filter, showing recorded dates oldest to newest and monthly workout/set counts. It automatically fetches older pages until the selected month is complete before presenting final totals. Server-side filtering remains available to the other interfaces; pagination does not cap the durable history record.
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
