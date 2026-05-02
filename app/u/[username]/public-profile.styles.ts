function cn(...values: string[]) {
  return values.filter(Boolean).join(" ");
}

const border =
  "[--profile-border:color-mix(in_srgb,var(--text)_12%,transparent)] [--profile-border-strong:color-mix(in_srgb,var(--text)_20%,transparent)]";
const surface =
  "rounded-[0.58rem] border border-[var(--profile-border)] bg-transparent";

export const publicProfileStyles = {
  shell: cn(
    border,
    "min-h-dvh bg-[var(--bg)] px-[0.86rem] py-[0.86rem] text-[var(--text)]",
  ),
  stage:
    "mx-auto flex w-full max-w-[76rem] flex-col gap-[0.72rem] py-[0.24rem] min-[860px]:py-[0.8rem]",
  topRow: "flex items-center justify-between gap-[0.72rem]",
  homeLink:
    "inline-flex min-h-[2.15rem] cursor-pointer items-center text-[2rem] leading-none font-[520] text-[var(--text)] transition-[transform,color] duration-150 hover:text-[color-mix(in_srgb,var(--text)_78%,var(--muted))] active:translate-y-[1px] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2",
  hero:
    "grid gap-[0.72rem] min-[900px]:grid-cols-[minmax(0,1.28fr)_minmax(19rem,0.72fr)] min-[900px]:items-stretch",
  identityColumn:
    "flex min-w-0 flex-col gap-[0.58rem] min-[900px]:h-full",
  identityCard: cn(surface, "flex flex-1 flex-col p-[0.82rem]"),
  identityTop:
    "grid gap-[0.86rem] min-[680px]:grid-cols-[minmax(11rem,14rem)_minmax(0,1fr)] min-[680px]:items-start",
  avatar:
    "flex aspect-square w-full max-w-[14rem] shrink-0 items-center justify-center overflow-hidden rounded-[0.58rem] border border-[var(--profile-border)] bg-[var(--calendar-active-bg)] max-[680px]:w-[7.5rem]",
  avatarImage: "h-full w-full object-cover",
  avatarFallback:
    "text-[2rem] leading-none font-[560] text-[var(--text)]",
  nameBlock: "min-w-0 pt-[0.08rem]",
  name: "m-0 break-words text-[clamp(1.75rem,5vw,2.65rem)] leading-[1.06] font-[560]",
  handle: "m-[0.28rem_0_0] text-[0.9rem] text-[var(--muted)]",
  tenure: "m-[0.18rem_0_0] text-[0.78rem] text-[var(--muted)]",
  featureSection:
    "grid grid-cols-1 gap-[0.58rem] min-[680px]:grid-cols-3",
  featureItem:
    "min-w-0 rounded-[0.52rem] border border-[var(--profile-border)] bg-transparent p-[0.62rem]",
  featureLabel: "m-0 text-[0.72rem] text-[var(--muted)]",
  featureValue: "m-[0.16rem_0_0] text-[0.92rem] leading-[1.25] font-[560]",
  featureDetail: "m-[0.14rem_0_0] text-[0.72rem] text-[var(--muted)]",
  featureBackoffList:
    "m-[0.52rem_0_0] flex list-none flex-col gap-[0.22rem] border-t border-[var(--profile-border)] p-[0.42rem_0_0]",
  featureBackoffItem:
    "flex min-w-0 flex-wrap items-baseline gap-x-[0.28rem] gap-y-[0.02rem]",
  featureBackoffLabel:
    "min-w-0 text-[0.74rem] leading-[1.25] text-[color-mix(in_srgb,var(--text)_88%,var(--muted))]",
  featureBackoffSeparator:
    "text-[0.74rem] leading-[1.25] text-[color-mix(in_srgb,var(--text)_56%,var(--muted))]",
  featureBackoffDetail:
    "text-[0.7rem] leading-[1.25] text-[var(--muted)]",
  chartCard: cn(surface, "flex min-h-[21rem] flex-col p-[0.82rem]"),
  chartHead: "flex items-center justify-between gap-[0.75rem]",
  chartTitle: "m-0 text-[1rem] leading-[1.15] font-[560]",
  infoLink:
    "group relative inline-flex h-[2rem] w-[2rem] shrink-0 cursor-pointer items-center justify-center rounded-[0.45rem] border border-[var(--profile-border)] text-[var(--muted)] transition-[transform,border-color,color] duration-150 hover:border-[var(--profile-border-strong)] hover:text-[var(--text)] active:translate-y-[1px] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2",
  infoIcon: "h-[0.92rem] w-[0.92rem]",
  infoTooltip:
    "pointer-events-none absolute right-0 top-[calc(100%+0.42rem)] z-20 w-max max-w-[12rem] rounded-[0.46rem] border border-[var(--profile-border)] bg-[var(--bg)] px-[0.62rem] py-[0.42rem] text-[0.72rem] leading-[1.2] text-[var(--text)] opacity-0 shadow-[0_10px_28px_color-mix(in_srgb,#000_14%,transparent)] transition-[opacity,transform] duration-150 translate-y-[-0.12rem] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
  chartWrap: "mt-[0.4rem] flex flex-1 items-center justify-center",
  radarSvg: "h-auto w-full max-w-[22rem] overflow-visible",
  radarGrid: "fill-none stroke-[color-mix(in_srgb,var(--text)_38%,transparent)]",
  radarAxis: "stroke-[color-mix(in_srgb,var(--text)_24%,transparent)]",
  radarShape:
    "fill-[color-mix(in_srgb,var(--text)_10%,transparent)] stroke-[var(--text)]",
  radarPoint: "fill-[var(--text)]",
  radarLabel: "fill-[var(--text)] text-[0.7rem] font-[560]",
  radarValue: "fill-[var(--muted)] text-[0.65rem]",
  statsGrid:
    "grid grid-cols-2 gap-[0.5rem] min-[760px]:grid-cols-4",
  statCard: cn(surface, "min-h-[4.65rem] p-[0.62rem]"),
  statLabel: "m-0 text-[0.72rem] text-[var(--muted)]",
  statValue: "m-[0.2rem_0_0] break-words text-[1.05rem] leading-[1.12] font-[560]",
  statWide: "max-[760px]:col-span-2",
  splitSection: cn(surface, "p-[0.82rem]"),
  splitHead:
    "flex flex-wrap items-end justify-between gap-[0.5rem] border-b border-[var(--profile-border)] pb-[0.7rem]",
  splitTitle: "m-0 text-[1rem] leading-[1.15] font-[560]",
  splitMeta: "m-0 text-[0.72rem] text-[var(--muted)]",
  splitGrid:
    "mt-[0.72rem] grid grid-cols-1 gap-[0.48rem] min-[680px]:grid-cols-2 min-[1020px]:grid-cols-4",
  splitDayCard:
    "min-h-[7.2rem] rounded-[0.52rem] border border-[var(--profile-border)] bg-transparent p-[0.62rem]",
  splitDayRest:
    "text-[color-mix(in_srgb,var(--text)_78%,var(--muted))]",
  splitDayHead: "flex items-start justify-between gap-[0.5rem]",
  splitDayName: "m-0 text-[0.72rem] text-[var(--muted)]",
  splitDaySets: "m-0 text-right text-[0.68rem] text-[var(--muted)]",
  splitDayType:
    "m-[0.3rem_0_0] text-[0.98rem] leading-[1.15] font-[560] text-[var(--text)]",
  splitDayExercises:
    "m-[0.35rem_0_0] text-[0.72rem] leading-[1.35] text-[var(--muted)]",
  splitExerciseList:
    "m-[0.46rem_0_0] flex max-h-[5.18rem] list-none flex-col gap-[0.22rem] overflow-y-auto p-0 pr-[0.18rem] [scrollbar-width:thin]",
  splitExerciseItem:
    "grid min-h-[1.62rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-[0.5rem] rounded-[0.38rem] border border-[var(--profile-border)] px-[0.42rem] py-[0.22rem]",
  splitExerciseName:
    "min-w-0 truncate text-[0.72rem] leading-[1.25] text-[var(--text)]",
  splitExerciseSets:
    "whitespace-nowrap text-[0.65rem] text-[var(--muted)]",
  splitEmpty:
    "rounded-[0.52rem] border border-dashed border-[var(--profile-border-strong)] p-[0.8rem] text-[0.84rem] text-[var(--muted)] min-[680px]:col-span-2 min-[1020px]:col-span-4",
} as const;
