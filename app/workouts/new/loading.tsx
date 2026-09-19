"use client";

import {
  useWorkspaceBenEnabled,
  useWorkspaceDesign,
} from "@/app/components/workspace-design-context";
import LegacyNewWorkoutLoading from "@/app/_legacy/workouts/new/loading";
import { WorkspaceLoggerSkeleton } from "@/app/workspace/logger/workspace-logger-skeleton";
import { styles } from "./workout-logger.styles";

// The app's one skeleton fill, kept verbatim so a logger block and a dashboard
// block shimmer as the same material. Radius is left to each usage.
const skeleton =
  "block bg-[linear-gradient(90deg,color-mix(in_srgb,var(--text)_7%,transparent),color-mix(in_srgb,var(--text)_15%,transparent),color-mix(in_srgb,var(--text)_7%,transparent))] bg-[length:220%_100%] animate-[dashboard-skeleton_1.25s_ease-in-out_infinite]";

/**
 * The fallback has to agree with the logger that replaces it: one exercise in
 * focus, the pager that moves between them, and the tools trigger. Add set and
 * Add exercise live behind menus, so neither reserves a visible row here.
 *
 * Which logger replaces it depends on the workspace and Ben flags, and a
 * Suspense fallback cannot await anything — so the answer comes from the
 * design context the authenticated layout already provides rather than a
 * session lookup here.
 */
export default function NewWorkoutLoading() {
  const isWorkspaceDesign = useWorkspaceDesign();
  const benEnabled = useWorkspaceBenEnabled();

  if (isWorkspaceDesign) {
    return <WorkspaceLoggerSkeleton />;
  }

  // Unflagged readers wait on the logger they are about to get: the shipped
  // one, whose fallback is a different shape than the focused stage below.
  if (!benEnabled) {
    return <LegacyNewWorkoutLoading />;
  }

  return (
    <main className={styles.loggerShell}>
      <section className={styles.loggerStage}>
        <div className={styles.topRow}>
          <span className={`${skeleton} h-[2.75rem] w-[5.6rem] rounded-full`} />
        </div>

        <header className={styles.header}>
          <span className={`${skeleton} h-[1rem] w-[7.5rem] rounded-[0.42rem]`} />
          <div className={styles.titleRow}>
            <span className={`${skeleton} h-[2rem] w-[min(18rem,72vw)] rounded-[0.5rem]`} />
            <span
              className={`${skeleton} h-[2.75rem] w-[2.75rem] shrink-0 rounded-full min-[620px]:hidden`}
            />
          </div>
        </header>

        <div className={styles.form}>
          {/* Workout metadata is desktop-only; the phone reaches it from the
              header instead. */}
          <section className={styles.desktopOnlyCard}>
            <div className={styles.singleMetaField}>
              <div className={styles.field}>
                <span className={`${skeleton} h-[0.9rem] w-[6rem] rounded-[0.42rem]`} />
                <div className={`${styles.nameInput} flex items-center`}>
                  <span className={`${skeleton} h-[1.4rem] w-1/3 rounded-[0.2rem]`} />
                </div>
              </div>
            </div>
          </section>

          <div className={styles.pagerRow}>
            <span className={`${skeleton} h-[2.75rem] w-[2.75rem] shrink-0 rounded-full`} />
            <span className={`${skeleton} mx-auto h-[1.5rem] w-[9rem] rounded-[0.42rem]`} />
            <span className={`${skeleton} h-[2.75rem] w-[2.75rem] shrink-0 rounded-full`} />
          </div>

          <article className={styles.exerciseCard}>
            <div className={styles.field}>
              <div className={styles.exerciseNameRow}>
                <div className={`${styles.nameInput} flex min-w-0 flex-1 items-center`}>
                  <span className={`${skeleton} h-[1.45rem] w-1/2 rounded-[0.2rem]`} />
                </div>
                <span className={`${skeleton} h-[2.75rem] w-[2.75rem] shrink-0 rounded-full`} />
              </div>
              <span className={`${skeleton} h-[1.15rem] w-[8.5rem] rounded-[0.42rem]`} />
            </div>

            <div className={styles.setsStack}>
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className={styles.setRowGroup}>
                  <span className={`${skeleton} h-[3rem] w-full rounded-[14px]`} />
                  <span className={`${skeleton} h-[1rem] w-[7.5rem] rounded-[0.42rem]`} />
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* The tools fan is the logger's only pinned control; closed, it is one
            circle in the corner. */}
        <div className={styles.fanRoot}>
          <span className={`${skeleton} absolute bottom-0 right-0 h-[3.25rem] w-[3.25rem] rounded-full`} />
        </div>
      </section>
    </main>
  );
}
