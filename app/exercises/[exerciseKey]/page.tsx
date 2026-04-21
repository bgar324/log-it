import Link from "next/link";
import { ThemeToggle } from "@/app/components/theme-toggle";
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

  return (
    <main className={styles.shell}>
      <section className={styles.stage}>
        <header className={styles.topRow}>
          <Link href="/dashboard?view=progress" className={styles.backLink}>
            Back to progress
          </Link>
          <ThemeToggle />
        </header>

        <section className={styles.summaryCard}>
          <h1 className={styles.title}>{data.displayName}</h1>
          <p className={styles.subtitle}>{data.subtitle}</p>
        </section>

        <section className={styles.kpiRailWrap} aria-label="Exercise metrics">
          <div className={styles.kpiRail}>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Sessions</p>
              <p className={styles.kpiValue}>{data.sessionsCount}</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Sets</p>
              <p className={styles.kpiValue}>{data.totalSetCount}</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Average Reps</p>
              <p className={styles.kpiValue}>{data.averageRepsPerSet}</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Best weight</p>
              <p className={styles.kpiValue}>{data.bestWeightLabel}</p>
            </article>
          </div>
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
}
