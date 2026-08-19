import { PublicArticleShell } from "@/app/components/public-article";

export const metadata = {
  title: "Changelog — Logit",
};

export default function ChangelogPage() {
  return (
    <PublicArticleShell
      ariaLabel="logit changelog"
      title="changelog"
    >
          <article className="changelog-entry">
            <h2 className="changelog-date">August 12, 2026</h2>

            <div className="changelog-group">
              <h3 className="changelog-group-title">Improved</h3>
              <ul className="legal-list">
                <li>
                  <strong>Faster app navigation.</strong> Returning to a loaded
                  dashboard view no longer repeats its data request, and the
                  workout logger now paints an immediate app-shaped loading
                  state during navigation.
                </li>
                <li>
                  <strong>Workout history stays light at any age.</strong> The
                  app loads and filters history in server-backed pages instead
                  of sending every workout to the phone at once. Older workouts
                  remain available on demand.
                </li>
                <li>
                  <strong>Leaner public profiles.</strong> Profile statistics
                  now use maintained summaries and database aggregates rather
                  than loading every historical set into app memory.
                </li>
              </ul>
            </div>
          </article>

          <article className="changelog-entry">
            <h2 className="changelog-date">July 18, 2026</h2>

            <div className="changelog-group">
              <h3 className="changelog-group-title">Improved</h3>
              <ul className="legal-list">
                <li>
                  <strong>A calmer split editor.</strong> Split and day actions
                  now live in compact three-dot menus. Exercise rows no longer
                  show drag handles, arrow buttons, or extra field labels.
                </li>
                <li>
                  <strong>Purposeful exercise reordering.</strong> Reorder is
                  now a focused sheet with the same touch-friendly interaction
                  used in the workout logger, instead of controls on every row.
                </li>
                <li>
                  <strong>More useful workout calendar.</strong> Tap a logged
                  day to see every workout from that date, then open the one
                  you want. Browsing calendar months now loads the right
                  workouts on demand.
                </li>
                <li>
                  <strong>Complete history and cleaner dashboard data.</strong>
                  Workout history is no longer capped, and dashboard totals
                  use complete weeks and the current calendar month.
                </li>
              </ul>
            </div>

            <div className="changelog-group">
              <h3 className="changelog-group-title">Fixed</h3>
              <ul className="legal-list">
                <li>
                  <strong>Recovered workout drafts keep their identity.</strong>
                  If you save yesterday&apos;s unfinished workout today, it keeps
                  yesterday&apos;s date and workout type instead of being filed as
                  today&apos;s session. You can also recover a draft on a rest day.
                </li>
                <li>
                  <strong>Dashboard updates are reliable after workout
                  changes.</strong> Creating, editing, duplicating, or deleting
                  a workout now updates the dashboard before the app confirms
                  success.
                </li>
                <li>
                  <strong>Safer split and exercise changes.</strong> There can
                  only be one active split, deleting the last saved split
                  creates a clean replacement, and removing an exercise now
                  asks for confirmation.
                </li>
                <li>
                  <strong>More honest saves and inputs.</strong> Profile
                  settings remain saved if a picture upload fails, and invalid
                  nutrition dates or values are rejected instead of being
                  silently changed.
                </li>
                <li>
                  <strong>Rest days are flexible without being accidental.</strong>
                  You can now explicitly log an unscheduled workout on a rest
                  day. It does not change your split, and the app checks the
                  day&apos;s saved split state instead of its display name.
                </li>
              </ul>
            </div>

            <div className="changelog-group">
              <h3 className="changelog-group-title">Removed</h3>
              <ul className="legal-list">
                <li>
                  <strong>Split assistant.</strong> We retired the AI split
                  assistant. The split planner remains available for creating,
                  editing, and activating your own weekly templates.
                </li>
              </ul>
            </div>
          </article>

          <article className="changelog-entry">
            <h2 className="changelog-date">July 5, 2026</h2>

            <div className="changelog-group">
              <h3 className="changelog-group-title">Improved</h3>
              <ul className="legal-list">
                <li>
                  <strong>Theme switch moved into the navigation.</strong> Instead
                  of riding along in the header on every page, it now lives in the
                  sidebar on desktop and in the menu on mobile.
                </li>
                <li>
                  <strong>Livelier action button.</strong> The mobile action
                  circles now pop in and out one after another as you open and
                  close the menu, including the rest-timer buttons.
                </li>
                <li>
                  <strong>Smoother mobile menu.</strong> The menu button morphs
                  cleanly between a hamburger and an X, its items animate in and
                  out, and the button itself is smaller and tidier.
                </li>
                <li>
                  On mobile, the Delete account button now shares a row with Save
                  profile and Sign out.
                </li>
              </ul>
            </div>

            <div className="changelog-group">
              <h3 className="changelog-group-title">Fixed</h3>
              <ul className="legal-list">
                <li>
                  Focusing a field no longer zooms the page on mobile.
                </li>
                <li>
                  The delete workout / set confirmation is now centered and always
                  visible on mobile, instead of hiding behind the browser&apos;s
                  bottom bar.
                </li>
                <li>
                  The reset-from-split button is back on the mobile logger — it now
                  lives in the action button menu and clears the current workout to
                  reload it from your split.
                </li>
              </ul>
            </div>
          </article>

          <article className="changelog-entry">
            <h2 className="changelog-date">July 3, 2026</h2>

            <div className="changelog-group">
              <h3 className="changelog-group-title">Added</h3>
              <ul className="legal-list">
                <li>
                  <strong>Nutrition tracking.</strong> Log daily calories,
                  protein, a BMR target, and body weight, with day/week/month
                  calorie charts and a body-weight trend.
                </li>
                <li>
                  <strong>Timed sets.</strong> Log time-based work like planks
                  and carries alongside reps.
                </li>
                <li>
                  <strong>Rest timer.</strong> A between-set countdown with
                  30s–3m presets, +30s, pause, and skip, built into the mobile
                  action button.
                </li>
                <li>
                  <strong>Personal records.</strong> The dashboard now tracks
                  estimated 1RM (bodyweight lifts included) and celebrates new
                  PRs when you save a workout.
                </li>
                <li>
                  <strong>Streaks &amp; momentum.</strong> Weekly workout streak
                  and month-over-month change on the overview.
                </li>
                <li>
                  <strong>Account management.</strong> Change your email, change
                  your password, or delete your account from the profile page.
                </li>
                <li id="install">
                  <strong>Install as an app.</strong> logit is now a PWA — add it
                  to your home screen for a fullscreen, app-like experience with
                  its own icon, and a friendly screen when you&apos;re offline.
                </li>
                <li>
                  <strong>Instant tap feedback.</strong> Opening a workout,
                  exercise, or action shows a spinner right on the thing you
                  tapped while it loads, so nothing feels frozen.
                </li>
                <li>
                  <strong>This changelog.</strong>
                </li>
              </ul>
            </div>

            <div className="changelog-group">
              <h3 className="changelog-group-title">Improved</h3>
              <ul className="legal-list">
                <li>
                  Bodyweight sets now count toward volume and PRs using your
                  tracked body weight; the logger shows your weight as
                  &quot;BW (150)&quot;.
                </li>
                <li>
                  Redesigned the Nutrition page to match the rest of the app,
                  with an accurate loading skeleton.
                </li>
                <li>
                  The Personal records list is scrollable and the workout
                  calendar height now matches it.
                </li>
                <li>
                  Cleaner mobile action button (a rotating +) and a tidier
                  profile account layout.
                </li>
                <li>
                  Smoother page transitions throughout, plus a more app-like
                  feel on touch (no rubber-band scroll or tap flash).
                </li>
              </ul>
            </div>

            <div className="changelog-group">
              <h3 className="changelog-group-title">Fixed</h3>
              <ul className="legal-list">
                <li>
                  Personal records no longer shows &quot;No lifts logged
                  yet&quot; on older accounts.
                </li>
                <li>
                  The logger&apos;s live volume preview now matches the saved
                  total for bodyweight sets.
                </li>
              </ul>
            </div>
          </article>
    </PublicArticleShell>
  );
}
