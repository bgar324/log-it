import { styles } from "./workout-logger.styles";

const skeleton =
  "animate-[dashboard-skeleton_1.2s_ease-in-out_infinite] bg-[linear-gradient(100deg,color-mix(in_srgb,var(--text)_5%,transparent)_20%,color-mix(in_srgb,var(--text)_10%,transparent)_42%,color-mix(in_srgb,var(--text)_5%,transparent)_64%)] bg-[length:220%_100%]";

export default function NewWorkoutLoading() {
  return (
    <main className={styles.loggerShell}>
      <section
        className={styles.loggerStage}
        aria-label="Loading workout logger"
        aria-busy="true"
      >
        <div className={styles.topRow}>
          <div className={`${skeleton} h-[2.75rem] w-[5.6rem] rounded-full`} />
        </div>

        <header className={styles.header}>
          <div className={`${skeleton} h-[0.72rem] w-[7.5rem] rounded-full`} />
          <div className={`${skeleton} h-[2.25rem] w-[min(18rem,76vw)] rounded-[0.44rem]`} />
        </header>

        <div className={`${skeleton} h-[3rem] w-full rounded-[0.54rem]`} />

        <div className={styles.form}>
          <div className="flex flex-col gap-[0.62rem] rounded-[0.54rem] border border-[color:color-mix(in_srgb,var(--text)_12%,transparent)] p-[0.78rem]">
            <div className={`${skeleton} h-[2.75rem] w-full rounded-[0.52rem]`} />
            <div className="grid grid-cols-2 gap-[0.55rem]">
              <div className={`${skeleton} h-[2.75rem] rounded-[0.52rem]`} />
              <div className={`${skeleton} h-[2.75rem] rounded-[0.52rem]`} />
            </div>
          </div>

          <div className="flex flex-col gap-[0.62rem] rounded-[0.54rem] border border-[color:color-mix(in_srgb,var(--text)_12%,transparent)] p-[0.78rem]">
            <div className={`${skeleton} h-[1.15rem] w-[9rem] rounded-full`} />
            <div className={`${skeleton} h-[2.75rem] w-full rounded-[0.52rem]`} />
            <div className="grid grid-cols-2 gap-[0.55rem]">
              <div className={`${skeleton} h-[2.75rem] rounded-[0.52rem]`} />
              <div className={`${skeleton} h-[2.75rem] rounded-[0.52rem]`} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
