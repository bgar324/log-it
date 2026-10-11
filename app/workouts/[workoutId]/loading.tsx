"use client";

import { useSearchParams } from "next/navigation";
import { resolveWorkoutReturn } from "../workout-return";
import { AppTabBar } from "@/app/components/app-nav";
import { navStyles } from "@/app/components/app-nav.styles";
import { BackButton } from "@/app/components/back-button";
import {
  useWorkspaceBenEnabled,
  useWorkspaceDesign,
} from "@/app/components/workspace-design-context";
import { WorkspaceFrame } from "@/app/components/workspace-frame";
import { WorkspaceWorkoutDetailSkeleton } from "@/app/workspace/details/workspace-detail-skeletons";
import { styles } from "./workout-detail.styles";

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

function SetRowSkeleton() {
  return (
    <div className={styles.setRow}>
      <SkeletonBlock className={`${styles.setOrder} w-[2.6rem]`} />
      <SkeletonBlock className={`${styles.setDetail} w-[min(100%,8.4rem)]`} />
      <SkeletonBlock className={`${styles.setDuration} w-[2rem]`} />
    </div>
  );
}

// The fallback has to draw the same chrome the page draws, or the frame the
// user is looking at disappears for the length of the fetch. Which chrome that
// is depends on the workspace design flag, so the fallback reads it too —
// otherwise the training tab bar flashes into the workspace on every detail
// navigation.
export default function WorkoutDetailLoading() {
  const workspaceDesign = useWorkspaceDesign();
  const benEnabled = useWorkspaceBenEnabled();
  const searchParams = useSearchParams();
  const workoutReturn = resolveWorkoutReturn({
    from: searchParams.get("from") ?? undefined,
    day: searchParams.get("day") ?? undefined,
  });

  if (workspaceDesign) {
    return (
      <WorkspaceFrame
        activeView="workouts"
        benEnabled={benEnabled}
        backHref={workoutReturn.href}
      >
        <WorkspaceWorkoutDetailSkeleton />
      </WorkspaceFrame>
    );
  }

  return (
    <main className={styles.shell}>
      <section className={`${styles.stage} ${navStyles.mainInset}`}>
        <header className={styles.topRow}>
          <div className={styles.topLead}>
            <BackButton
              fallbackHref={workoutReturn.href}
              label="Back"
              className={styles.backLink}
              iconClassName={styles.backButtonIcon}
            />
          </div>
          <div className={styles.topActions} aria-hidden="true">
            <div className={styles.detailActionsGroup}>
              {["Edit workout", "Copy workout", "Delete workout"].map((label) => (
                <span key={label} className={styles.actionButton}>
                  <SkeletonBlock className={styles.actionButtonIcon} />
                  <SkeletonBlock text={label} className={styles.actionButtonLabel} />
                </span>
              ))}
            </div>
            <div className={styles.mobileActionMenu}>
              <SkeletonBlock className="h-[2.75rem] w-[2.75rem] rounded-full" />
            </div>
          </div>
        </header>

        <section className={styles.summaryCard} aria-hidden="true">
          <SkeletonBlock className={`${styles.titleMeta} w-[5.8rem]`} />
          <SkeletonBlock className={`${styles.title} w-[min(100%,24rem)]`} />
          <SkeletonBlock className={`${styles.summaryLine} w-[min(100%,22rem)]`} />
          <SkeletonBlock className={`${styles.summaryMeta} w-[min(100%,12rem)]`} />
        </section>

        <section className={styles.exerciseList} aria-hidden="true">
          {Array.from({ length: 3 }, (_, exerciseIndex) => (
            <article key={exerciseIndex} className={styles.exerciseCard}>
              <header className={styles.exerciseHead}>
                <SkeletonBlock className={`${styles.exerciseName} w-[min(100%,16rem)]`} />
                <SkeletonBlock className={`${styles.exerciseMeta} w-[min(100%,18rem)]`} />
              </header>

              <div className={styles.setList}>
                {Array.from({ length: 4 }, (_, setIndex) => (
                  <SetRowSkeleton key={setIndex} />
                ))}
              </div>
            </article>
          ))}
        </section>
      </section>
      <AppTabBar activeView="workouts" benEnabled={benEnabled} />
    </main>
  );
}
