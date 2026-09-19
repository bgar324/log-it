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
import LegacyWorkoutDetailLoading from "@/app/_legacy/workouts/[workoutId]/loading";

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return <span className={`${styles.skeletonBlock} ${className}`} />;
}

function SetRowSkeleton() {
  return (
    <div className={styles.setRow}>
      <SkeletonBlock className="h-[0.8rem] w-[2.6rem]" />
      <SkeletonBlock className="h-[0.8rem] w-[min(100%,8.4rem)]" />
      <SkeletonBlock className="h-[0.8rem] w-[2rem]" />
    </div>
  );
}

// The fallback has to draw the same chrome the page draws, or the frame the
// user is looking at disappears for the length of the fetch. Which chrome that
// is depends on the design flag, so the fallback reads it too — otherwise the
// legacy tab bar flashes into the workspace on every detail navigation.
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

  // Unflagged readers wait on the shipped detail screen, so they wait behind
  // its own fallback rather than the redesigned one below.
  if (!benEnabled) {
    return <LegacyWorkoutDetailLoading />;
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
          <div className={styles.topActions}>
            <SkeletonBlock className="h-[2rem] w-[5.2rem] rounded-full max-[759px]:hidden" />
            <SkeletonBlock className="h-[2rem] w-[5.2rem] rounded-full max-[759px]:hidden" />
            <SkeletonBlock className="h-[2rem] w-[5.2rem] rounded-full max-[759px]:hidden" />
            <SkeletonBlock className="hidden h-[2.75rem] w-[2.75rem] rounded-full max-[759px]:block" />
          </div>
        </header>

        <section className={styles.summaryCard}>
          <SkeletonBlock className="h-[0.75rem] w-[5.8rem]" />
          <SkeletonBlock className="mt-[0.5rem] h-[2rem] w-[min(100%,24rem)]" />
          <SkeletonBlock className="mt-[0.66rem] h-[0.95rem] w-[min(100%,18rem)]" />
          <SkeletonBlock className="mt-[0.28rem] h-[0.82rem] w-[min(100%,12rem)]" />
        </section>

        <section className={styles.exerciseList}>
          {Array.from({ length: 3 }, (_, exerciseIndex) => (
            <article key={exerciseIndex} className={styles.exerciseCard}>
              <header className={styles.exerciseHead}>
                <SkeletonBlock className="h-[1.05rem] w-[min(100%,16rem)]" />
                <SkeletonBlock className="mt-[0.22rem] h-[0.77rem] w-[min(100%,11rem)]" />
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
