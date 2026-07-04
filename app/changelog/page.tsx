import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";

export default function ChangelogPage() {
  return (
    <main className="app-shell">
      <section className="phone-stage legal-stage" aria-label="logit changelog">
        <div className="content-stack legal-stack">
          <div className="auth-top-row">
            <Link href="/" className="back-link" aria-label="Back">
              <ArrowLeft className="back-icon" aria-hidden="true" strokeWidth={1.9} />
            </Link>
            <ThemeToggle />
          </div>

          <h1 className="title legal-title">changelog</h1>

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
        </div>
      </section>
    </main>
  );
}
