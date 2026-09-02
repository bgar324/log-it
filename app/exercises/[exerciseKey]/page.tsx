import { AppDrawerTrigger, AppShell } from "@/app/components/app-nav";
import { appNavUserFromSession } from "@/app/components/app-nav.user";
import { navStyles } from "@/app/components/app-nav.styles";
import { BackButton } from "@/app/components/back-button";
import { ExerciseDetailChart } from "./exercise-detail-chart";
import { loadExerciseDetailPageData } from "./exercise-detail.data";
import { SessionBreakdownTable } from "./session-breakdown-table";
import { styles } from "./exercise-detail.styles";

type ExerciseDetailParams = Promise<{ exerciseKey: string }>;

export default async function ExerciseDetailPage({
  params,
}: {
  params: ExerciseDetailParams;
}) {
  const { exerciseKey: rawExerciseKey } = await params;
  const data = await loadExerciseDetailPageData(rawExerciseKey);

  const sessionsLabel = `${data.sessionsCount} ${
    data.sessionsCount === 1 ? "session" : "sessions"
  }`;
  const setsLabel = `${data.totalSetCount} ${data.totalSetCount === 1 ? "set" : "sets"}`;
  const repsLabel = `${data.averageRepsPerSet} ${
    data.averageRepsPerSet === 1 ? "rep" : "reps"
  } per set on average`;

  const screen = (
    <main className={styles.shell}>
      <section className={`${styles.stage} ${navStyles.mainInset}`}>
        <header className={styles.topRow}>
          <div className={styles.topLead}>
            <AppDrawerTrigger />
            <BackButton
              fallbackHref="/dashboard?view=progress"
              label="Back"
              className={styles.backLink}
              iconClassName={styles.backButtonIcon}
            />
          </div>
        </header>

        <section className={styles.summaryCard}>
          <p className={styles.titleMeta}>{data.subtitle}</p>
          <h1 className={styles.title}>{data.displayName}</h1>
          <p className={styles.summaryLine}>
            {`${sessionsLabel} · ${setsLabel} · ${repsLabel}`}
          </p>
          <p className={styles.summaryMeta}>{`Best weight ${data.bestWeightLabel}`}</p>
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
            <h2 className={styles.panelTitle}>Strength trend (weight + reps)</h2>
            <p className={styles.panelSubtitle}>
              Top-set estimated 1RM (Epley), so extra reps at the same weight still count as progress.
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
          <SessionBreakdownTable sessions={data.sessionBreakdownRows} />
        </section>
      </section>
    </main>
  );

  return (
    <AppShell user={appNavUserFromSession(data.user)} activeView="progress">
      {screen}
    </AppShell>
  );
}
