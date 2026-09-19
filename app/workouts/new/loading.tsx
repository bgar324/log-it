"use client";

import { useWorkspaceDesign } from "@/app/components/workspace-design-context";
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
 * Which logger replaces it depends on the workspace design, and a Suspense
 * fallback cannot await anything — so the answer comes from the design context
 * the authenticated layout already provides rather than a session lookup here.
 */
export default function NewWorkoutLoading() {
  const isWorkspaceDesign = useWorkspaceDesign();

  if (isWorkspaceDesign) {
    return <WorkspaceLoggerSkeleton />;
  }

  return (
    <main className={styles.loggerShell}>
      <section className={styles.loggerStage}>
        <div className={styles.topRow}>
          <span className={`${skeleton} h-[2.75rem] w-[5.6rem] rounded-full`} />
        </div>

        <header className={styles.header}>
          <span className={`${skeleton} h-4 w-48 rounded-[0.42rem]`} />
          <div className={styles.titleRow}>
            <span className={`${skeleton} h-[2rem] w-[min(18rem,72vw)] rounded-[0.5rem]`} />
            <span
              className={`${skeleton} h-11 w-11 shrink-0 rounded-full`}
            />
          </div>
        </header>

        <div className={styles.form}>
          <div className={styles.exerciseSlideContent}>
          <article className={styles.exerciseCard}>
            <div className={styles.field}>
              <div className={styles.exerciseNameRow}>
                <div className={`${styles.nameInput} flex min-w-0 flex-1 items-center`}>
                  <span className={`${skeleton} h-[1.45rem] w-1/2 rounded-[0.2rem]`} />
                </div>
                <span className={`${skeleton} h-[2.75rem] w-[2.75rem] shrink-0 rounded-full`} />
              </div>
            </div>

            <div className={styles.setsStack}>
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className={styles.setRowGroup}>
                  <span className={`${skeleton} h-[3rem] w-full rounded-[14px]`} />
                </div>
              ))}
            </div>
          </article>
          <div className={styles.guidance} aria-hidden="true">
            <div className="grid grid-cols-2 gap-4">
              <span className={`${skeleton} h-4 w-24 rounded`} />
              <span className={`${skeleton} h-4 w-24 rounded`} />
              <span className={`${skeleton} h-10 w-full rounded`} />
              <span className={`${skeleton} h-10 w-full rounded`} />
            </div>
          </div>
          </div>
          <div className={styles.pagerRow}>
            <span className={`${skeleton} h-11 w-11 shrink-0 rounded-full`} />
            <span className={`${skeleton} mx-auto h-6 w-16 rounded-full`} />
            <span className={`${skeleton} h-11 w-11 shrink-0 rounded-full`} />
          </div>
        </div>

        <div className={styles.toolsRow} aria-hidden="true">
          <span className={`${skeleton} size-11 rounded-full`} />
          <span className={`${skeleton} size-11 rounded-full`} />
          <span className={`${skeleton} ml-auto h-11 w-[6.5rem] rounded-full`} />
        </div>
      </section>
    </main>
  );
}
