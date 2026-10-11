"use client";

import {
  useWorkspaceBenEnabled,
  useWorkspaceDesign,
} from "@/app/components/workspace-design-context";
import { WorkspaceLoggerSkeleton } from "@/app/workspace/logger/workspace-logger-skeleton";
import { styles } from "./workout-logger.styles";

const skeleton = "block motion-skeleton";
const skeletonFill = { background: "color-mix(in srgb, var(--text) 10%, transparent)" };

export default function NewWorkoutLoading({ editMode = false }: { editMode?: boolean }) {
  const isWorkspaceDesign = useWorkspaceDesign();
  const benEnabled = useWorkspaceBenEnabled();
  const setRow = benEnabled ? styles.setRowWithoutDuration : styles.setRow;

  if (isWorkspaceDesign) {
    return <WorkspaceLoggerSkeleton />;
  }

  return (
    <main className={styles.loggerShell} aria-hidden="true">
      <section className={styles.loggerStage}>
        <div className={styles.topRow}>
          <div className={styles.backLink}>
            <span className={`${skeleton} size-[0.88rem] rounded`} />
            <span className={`${skeleton} h-4 w-8 rounded`} />
          </div>
        </div>

        <header className={styles.header}>
          <div className={styles.headerMetaRow}>
            <div className={editMode ? `${styles.headerMetaButton} flex items-center` : ""}>
              <span className={`${skeleton} h-[1lh] w-40 max-w-full rounded`} />
            </div>
          </div>
          <div className={styles.titleRow}>
            <div className={styles.title}>
              <span className={`${skeleton} h-[1em] w-[min(14rem,60vw)] rounded`} />
            </div>
            <div className={styles.titleEditButton}>
              <span className={`${skeleton} size-4 rounded`} />
            </div>
          </div>
        </header>

        <div className={styles.form}>
          <div className={styles.exerciseSlideContent}>
            <article className={styles.exerciseCard}>
              <div className={styles.exerciseNameRow}>
                <div className={`${styles.nameInput} flex items-center`}>
                  <span className={`${skeleton} h-[1lh] w-3/4 rounded`} />
                </div>
              </div>

              <div className={styles.setsStack}>
                <div className={`${setRow} ${styles.setHeader}`}>
                  <span />
                  <span className={`${styles.setFieldWeight} flex h-[1lh] items-center`}>
                    <span className={`${skeleton} h-3 w-16 max-w-full rounded`} />
                  </span>
                  <span className={`${styles.setFieldReps} flex h-[1lh] items-center`}>
                    <span className={`${skeleton} h-3 w-7 rounded`} />
                  </span>
                  {!benEnabled ? <span className={`${styles.setFieldDuration} flex h-[1lh] items-center`}>
                    <span className={`${skeleton} h-3 w-5 rounded`} />
                  </span> : null}
                </div>
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className={styles.setRowGroup}>
                    <div className={setRow}>
                      <div className={styles.setNumber}>
                        <span className={`${skeleton} h-3 w-2 rounded`} />
                      </div>
                      <div className={`${styles.setField} ${styles.setFieldWeight}`}>
                        <span className={styles.setWeightControl}>
                          <span className={`${styles.setInput} ${skeleton}`} style={skeletonFill} />
                          {!benEnabled ? <span className={styles.bodyweightButton}>
                            <span className={`${skeleton} h-3 w-4 rounded`} />
                          </span> : null}
                        </span>
                      </div>
                      <div className={`${styles.setField} ${styles.setFieldReps}`}>
                        <span className={`${styles.setInput} ${skeleton}`} style={skeletonFill} />
                      </div>
                      {!benEnabled ? <div className={`${styles.setField} ${styles.setFieldDuration}`}>
                        <span className={`${styles.setInput} ${skeleton}`} style={skeletonFill} />
                      </div> : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.addSetButton}>
                  <span className={`${skeleton} h-4 w-14 rounded`} />
                </div>
                {!benEnabled ? <div className={styles.restTimerButton}>
                  <span className={`${skeleton} h-4 w-10 rounded`} />
                </div> : null}
              </div>
            </article>
            <section className={styles.guidance}>
              <table className={styles.guidanceTable}>
                <colgroup><col className={styles.guidanceSetColumn} /><col /><col /></colgroup>
                <thead>
                  <tr>
                    <th className={styles.guidanceSetNumber} />
                    <th className={styles.guidanceHeading}>
                      <span className={`${skeleton} h-[1.4em] w-20 max-w-full rounded`} />
                    </th>
                    <th className={styles.guidanceHeading}>
                      <span className={`${skeleton} h-[1.4em] w-16 max-w-full rounded`} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 3 }, (_, index) => (
                    <tr key={index}>
                      <th className={styles.guidanceSetNumber}>
                        <span className={`${skeleton} h-[1.5em] w-2 rounded`} />
                      </th>
                      {[0, 1].map(column => <td key={column} className={styles.guidanceValue}>
                        <span className={`${skeleton} h-[1.35em] w-20 max-w-full rounded`} />
                      </td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
          <div className={styles.pagerRow}>
            <span className={`${skeleton} h-11 w-11 shrink-0 rounded-full`} />
            <span className={`${skeleton} mx-auto h-11 w-24 rounded-full`} />
            <span className={`${skeleton} h-11 w-11 shrink-0 rounded-full`} />
          </div>
        </div>

        <div className={styles.toolsRow}>
          {Array.from({ length: editMode ? 3 : 4 }, (_, index) => <span key={index} className={`${skeleton} size-11 shrink-0 rounded-full`} />)}
          <span className={`${skeleton} ml-auto h-11 w-[6.5rem] shrink-0 rounded-full`} />
        </div>
      </section>
    </main>
  );
}
