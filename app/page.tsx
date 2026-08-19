import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { LinkPendingOverlay } from "./components/link-pending";
import { PublicFooter, PublicHeader } from "./components/public-site";
import { getSessionClaims } from "@/lib/auth";
import styles from "./landing.module.css";

export default async function Home() {
  // Only the presence of a valid session matters here, so verify the JWT and
  // skip the user lookup. /auth deliberately keeps the database check: it is
  // what stops a token for a deleted account bouncing between the two pages.
  const claims = await getSessionClaims();

  if (claims?.sub) {
    redirect("/dashboard");
  }

  return (
    <div className={`${styles.landing} ${styles.publicRoot}`}>
      <PublicHeader />

      <main>
        <section className={styles.hero} aria-labelledby="landing-title">
          <div className={styles.heroCopy}>
            <h1 id="landing-title" className={styles.heroTitle}>
              Logit records your training and shows you what changes.
            </h1>
            <div className={styles.heroActions}>
              <Link
                href="/auth?mode=register"
                className={`${styles.primaryAction} relative`}
              >
                Start a workout
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
                <LinkPendingOverlay />
              </Link>
            </div>
          </div>

          <div id="log" className={styles.productFrame}>
            <iframe
              className={styles.productPreview}
              src="/preview/dashboard"
              title="Logit dashboard preview"
              loading="eager"
              scrolling="no"
            />
          </div>
        </section>

        <section id="plan" className={styles.featureSection}>
          <h2>
            Your split is ready when you are.
            <span>
              Today&apos;s training appears without setup, then each set stays
              close enough to log with one hand.
            </span>
          </h2>
          <div className={styles.featureSurface}>
            <iframe
              className={styles.featurePreview}
              src="/preview/split"
              title="Interactive Logit split planner preview"
              loading="lazy"
              scrolling="no"
            />
          </div>
        </section>

        <section id="progress" className={styles.featureSection}>
          <h2>
            Every workout becomes useful history.
            <span>
              See recent sessions, exercise progress, and personal records
              without rebuilding the story from notes.
            </span>
          </h2>
          <div className={styles.featureSurface}>
            <iframe
              className={styles.featurePreview}
              src="/preview/progress"
              title="Interactive Logit progress preview"
              loading="lazy"
              scrolling="no"
            />
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
