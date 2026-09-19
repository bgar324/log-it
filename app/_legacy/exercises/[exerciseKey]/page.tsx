import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { isIonicEnabled } from "@/lib/ionic-feature-flag";
import { isWorkspaceEnabled } from "@/lib/workspace-feature-flag";
import { AppShell } from "@/app/_legacy/components/app-nav";
import { appNavUserFromSession } from "@/app/_legacy/components/app-nav.user";
import { navStyles } from "@/app/_legacy/components/app-nav.styles";
import { isBenFeatureEnabled } from "@/lib/posthog-feature-flags";
import { BackButton } from "@/app/_legacy/components/back-button";
import { WorkspaceFrame } from "@/app/components/workspace-frame";
import { WorkspaceExerciseDetail } from "@/app/workspace/details/workspace-exercise-detail";
import { toWorkspaceExerciseDetail } from "@/app/workspace/details/workspace-exercise-detail.data";
import { ExerciseDetailChart } from "@/app/_legacy/exercises/[exerciseKey]/exercise-detail-chart";
import { loadExerciseDetailPageData } from "@/app/exercises/[exerciseKey]/exercise-detail.data";
import { SessionBreakdownList } from "@/app/_legacy/exercises/[exerciseKey]/session-breakdown-list";
import { styles } from "@/app/_legacy/exercises/[exerciseKey]/exercise-detail.styles";

type ExerciseDetailParams = Promise<{ exerciseKey: string }>;

export default async function ExerciseDetailPage({
  params,
}: {
  params: ExerciseDetailParams;
}) {
  const { exerciseKey: rawExerciseKey } = await params;
  const user = await requireSessionUser();
  if (await isIonicEnabled(user)) redirect(`/ionic/exercises/${encodeURIComponent(rawExerciseKey)}`);
  const data = await loadExerciseDetailPageData(rawExerciseKey);
  const workspaceEnabled = isWorkspaceEnabled(data.user);
  const benEnabled = await isBenFeatureEnabled(data.user);

  // The workspace design owns the whole authenticated frame, so it returns
  // before the legacy screen is built rather than being swapped inside it.
  if (workspaceEnabled) {
    return (
      <WorkspaceFrame
        activeView="progress"
        benEnabled={benEnabled}
        backHref="/dashboard?view=progress"
      >
        <WorkspaceExerciseDetail detail={toWorkspaceExerciseDetail(data)} />
      </WorkspaceFrame>
    );
  }

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
