import { AppShell } from "@/app/components/app-nav";
import { appNavUserFromSession } from "@/app/components/app-nav.user";
import { navStyles } from "@/app/components/app-nav.styles";
import { isBenFeatureEnabled } from "@/lib/posthog-feature-flags";
import { BackButton } from "@/app/components/back-button";
import { ExerciseDetailChart } from "./exercise-detail-chart";
import { loadExerciseDetailPageData } from "./exercise-detail.data";
import { SessionBreakdownList } from "./session-breakdown-list";
import { styles } from "./exercise-detail.styles";

type ExerciseDetailParams = Promise<{ exerciseKey: string }>;

export default async function ExerciseDetailPage({
  params,
}: {
  params: ExerciseDetailParams;
}) {
  const { exerciseKey: rawExerciseKey } = await params;
  const data = await loadExerciseDetailPageData(rawExerciseKey);
  const benEnabled = await isBenFeatureEnabled(data.user);

  const screen = (
    <main className={styles.shell}>
      <section className={`${styles.stage} ${navStyles.mainInset}`}>
        <header className={styles.topRow}>
          <BackButton
            fallbackHref="/dashboard?view=progress"
            label="Back"
            className={styles.backLink}
            iconClassName={styles.backButtonIcon}
          />
        </header>

        <section className={styles.summaryCard}>
          <h1 className={styles.title}>{data.displayName}</h1>
          <p className={styles.summaryLine}>{data.summarySentence}</p>
          <p className={styles.summaryMeta}>{data.summaryMeta}</p>
        </section>

        <section className={styles.panelGrid}>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Weight over time</h2>
            <p className={styles.panelSubtitle}>
              Best top-set weight each time this exercise was trained.
            </p>
            <ExerciseDetailChart
              series={data.chartSeries}
              metric="weight"
              weightUnit={data.weightUnit}
            />
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Strength trend</h2>
            <p className={styles.panelSubtitle}>
              Top-set estimated 1RM, so extra reps at the same weight still count
              as progress.
            </p>
            <ExerciseDetailChart
              series={data.chartSeries}
              metric="strength"
              weightUnit={data.weightUnit}
            />
          </section>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Session breakdown</h2>
          <SessionBreakdownList sessions={data.sessionBreakdownRows} />
        </section>
      </section>
    </main>
  );

  return (
    <AppShell
      user={appNavUserFromSession(data.user)}
      analyticsUser={data.user}
      activeView="progress"
      benEnabled={benEnabled}
    >
      {screen}
    </AppShell>
  );
}
