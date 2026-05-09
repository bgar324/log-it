import { BackButton } from "@/app/components/back-button";
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
          <BackButton
            fallbackHref="/progress"
            label="Back"
            className={styles.backLink}
            iconClassName={styles.backButtonIcon}
          />
          <ThemeToggle />
        </header>

        <section className={styles.summaryCard}>
          <p className={styles.titleMeta}>{data.subtitle}</p>
          <h1 className={styles.title}>{data.displayName}</h1>
          <div className={styles.metaRow} aria-label="Exercise metrics">
            {[
              { label: "Sessions", value: data.sessionsCount },
              { label: "Sets", value: data.totalSetCount },
              { label: "Average reps", value: data.averageRepsPerSet },
              { label: "Best weight", value: data.bestWeightLabel },
            ].map((item) => (
              <span key={item.label} className={styles.metaPill}>
                <span className={styles.metaPillLabel}>{item.label}</span>
                <span className={styles.metaPillValue}>{item.value}</span>
              </span>
            ))}
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
