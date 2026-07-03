# Product

Logit is a lightweight workout journal. The durable product direction in the repo is fast workout entry, exercise history, split planning, profile preferences, and progress views without a full social network or coaching platform.

## Core Behaviors

- Users register and sign in with username/password credentials.
- First name, last name, email, username, preferred weight unit, public profile setting, and avatar are profile-level user data.
- From the profile view users can change their email, change their password, and delete their account. All three require confirming the current password; deletion is permanent and removes all workouts, splits, and nutrition data. Username is not editable.
- Signed-in users land on `/dashboard`.
- The dashboard has five views: overview, workouts, progress, split, and profile.
- Dashboard view switching updates the query string and lazily loads missing view data.
- The dashboard log-workout action shows `Logged!` when today's active-split workout type has already been logged for today's Pacific date.
- Users can log, edit, duplicate, and delete workouts.
- Users can inspect workouts and exercise-specific history.
- Users can save multiple weekly splits and choose one active split to seed the workout logger.
- Users can ask Ben for beginner split advice from the split view. The assistant gathers schedule, experience, equipment, session length, goals, focus areas, and avoidances before drafting a previewable split.
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
- New workout drafts are autosaved client-side in create mode.
- Duplicate workout creates a new workout dated to the current Pacific date and the API returns the new workout id.
- A user with an active weekly split cannot log a workout on an active-split rest day for the selected date.
- Today's dashboard logged state is type-specific: a workout counts as logged only when its normalized workout type matches the active split day assignment.

## Split Planning

- Each user can save multiple splits.
- One split can be active at a time; the active split drives dashboard planning, rest-day blocking, and workout logger preload.
- Split days cover Monday through Sunday.
- Missing days normalize to `Rest`.
- Duplicate weekdays are rejected by split payload normalization.
- Split exercises have display names, slugs, set targets, and one-based ordering.
- Saving a split replaces existing split days/exercises for that split.
- Deleting the active split activates the most recently updated remaining split when one exists.
- Split deletion uses a Sonner confirmation toast rather than `window.confirm`.
- Split data is cached by user and invalidated after writes.
- AI-generated split drafts are not saved automatically. Users preview the draft, including day assignments and generated exercises, and must explicitly create it before it appears in their split library.
- Split assistant draft generation is capped at five generated drafts per user per Pacific day; clarification chat can continue when the cap is reached.
- The split assistant is advisory workout-structure help only. It should avoid medical advice, injury rehab, diagnosis, and guaranteed outcome claims.

## Progress And History

- The app tracks total workout counts, weekly activity, recent sessions, workout calendar summaries, personal best style summaries, exercise summary rows, and progress series.
- The Nutrition view stores per-day calorie/protein totals, compares daily calories against the user's BMR target, keeps daily body-weight entries, and offers day/week/month calorie chart ranges.
- Exercise detail pages resolve route keys back to normalized exercise names and fall back to scanning workout exercises when needed.
- Exercise summaries and calendar day counts are maintained as read models, with source-table fallback paths in some loaders.

## Public Profiles

- Public profile data is derived from workouts, profile data, and split data.
- Public profile calculations include training tenure, total workouts, total sets, total volume, strongest lift, favorite workout type/day, most trained exercise, split display, and radar axes.
- Public avatars are served separately from private profile settings.

## Durable Constraints

- Persist all workout weights in pounds.
- Persist body-weight tracker entries in pounds.
- Treat workout dates as date-only values.
- Use Pacific time for current-day workout behavior.
- Keep product UI dense and operational.
- Do not add social/coaching behavior unless product requirements explicitly change.

## Unknown

- UI entry point for duplicate workout behavior needs verification; the API and service exist, but no current UI trigger was found during this audit.
- The research pages document methodology, including Ben split assistant behavior, but there is no explicit product requirement that they remain public forever.
