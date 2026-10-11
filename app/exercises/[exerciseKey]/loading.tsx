"use client";

import { AppTabBar } from "@/app/components/app-nav";
import { navStyles } from "@/app/components/app-nav.styles";
import { BackButton } from "@/app/components/back-button";
import {
  useWorkspaceBenEnabled,
  useWorkspaceDesign,
} from "@/app/components/workspace-design-context";
import { WorkspaceFrame } from "@/app/components/workspace-frame";
import { WorkspaceExerciseDetailSkeleton } from "@/app/workspace/details/workspace-detail-skeletons";
import { styles } from "./exercise-detail.styles";

function SkeletonBlock({
  className = "",
  text = "\u00a0",
}: {
  className?: string;
  text?: string;
}) {
  return (
    <span className={`${styles.skeletonBlock} ${className}`}>
      <span className="invisible">{text}</span>
    </span>
  );
}

// The shipped row's own layout keys, so the skeleton cannot drift into a
// different shape than the list it stands in for.
function SessionRowSkeleton() {
  return (
    <div className={styles.listRow}>
      <div className={styles.listRowMain}>
        <SkeletonBlock className={`${styles.listRowTitle} w-[6.4rem] max-w-full`} />
        <SkeletonBlock className={`${styles.listRowMeta} w-[7.6rem] max-w-full`} />
      </div>
      <div className={styles.listRowStats}>
        <SkeletonBlock className={`${styles.listRowValue} w-[4.4rem]`} />
        <SkeletonBlock className={`${styles.listRowMeta} w-[8.2rem]`} />
      </div>
    </div>
  );
}

// The fallback has to draw the same chrome the page draws, or the frame the
// user is looking at disappears for the length of the fetch. Which chrome that
// is depends on the workspace design flag, so the fallback reads it too —
// otherwise the training tab bar flashes into the workspace on every detail
// navigation.
export default function ExerciseDetailLoading() {
  const workspaceDesign = useWorkspaceDesign();
  const benEnabled = useWorkspaceBenEnabled();

  if (workspaceDesign) {
    return (
      <WorkspaceFrame
        activeView="progress"
        benEnabled={benEnabled}
        backHref="/dashboard?view=progress"
      >
        <WorkspaceExerciseDetailSkeleton />
      </WorkspaceFrame>
    );
  }

  return (
    <main className={styles.shell}>
      <section className={`${styles.stage} ${navStyles.mainInset}`}>
        <header className={styles.topRow}>
          <BackButton
            fallbackHref="/dashboard?view=workouts"
            label="Back"
            className={styles.backLink}
            iconClassName={styles.backButtonIcon}
          />
        </header>

        <section className={styles.summaryCard} aria-hidden="true">
          <SkeletonBlock className={`${styles.title} w-[min(100%,21rem)]`} />
          <SkeletonBlock className={`${styles.summaryLine} w-[min(100%,22rem)]`} />
          <SkeletonBlock className={`${styles.summaryMeta} w-[min(100%,16rem)]`} />
        </section>

        <section className={styles.panelGrid} aria-hidden="true">
          {[
            {
              title: "Weight over time",
              subtitle: "Best top-set weight each time this exercise was trained.",
            },
            {
              title: "Strength trend",
              subtitle: "Top-set estimated 1RM, so extra reps at the same weight still count as progress.",
            },
          ].map(({ title, subtitle }) => (
            <section key={title} className={styles.panel}>
              <SkeletonBlock className={`${styles.panelTitle} w-fit max-w-full`} text={title} />
              <SkeletonBlock className={styles.panelSubtitle} text={subtitle} />
              <SkeletonBlock className={styles.chartFrame} />
            </section>
          ))}
        </section>

        <section className={styles.panel} aria-hidden="true">
          <SkeletonBlock className={`${styles.panelTitle} w-fit max-w-full`} text="Session breakdown" />
          <div className={styles.listStack}>
            {/* One page of the session list, which pages five at a time. */}
            {Array.from({ length: 5 }, (_, index) => (
              <SessionRowSkeleton key={index} />
            ))}
          </div>
          {/* The list ends in a pager once there is a second page; reserving it
              keeps the panel from growing a row taller on arrival. */}
          <div className={styles.pagerRow}>
            <SkeletonBlock className="h-[2.75rem] w-[2.75rem] rounded-full" />
            <SkeletonBlock className={`${styles.pagerRange} w-[4.4rem]`} />
            <SkeletonBlock className="h-[2.75rem] w-[2.75rem] rounded-full" />
          </div>
        </section>
      </section>
      <AppTabBar activeView="workouts" benEnabled={benEnabled} />
    </main>
  );
}
