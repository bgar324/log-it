function cn(...values: string[]) {
  return values.filter(Boolean).join(" ");
}

const dashboardBorder =
  "[--dashboard-border:color-mix(in_srgb,var(--text)_12%,transparent)] [--dashboard-border-strong:color-mix(in_srgb,var(--text)_18%,transparent)]";
const dashboardSurface =
  "rounded-[0.54rem] border border-[var(--dashboard-border)] bg-transparent shadow-none";
const headerActionBase = cn(
  "inline-flex min-h-[2rem] cursor-pointer items-center justify-center gap-[0.35rem] rounded-full border px-[0.72rem]",
  "border-[var(--dashboard-border)] bg-transparent text-[0.76rem] text-[var(--text)] [touch-action:manipulation]",
  "max-[760px]:w-[2.3rem] max-[760px]:min-w-[2.3rem] max-[760px]:px-0",
);
const mobileMenuItemBase = cn(
  "inline-flex min-h-[2.2rem] w-full cursor-pointer items-center gap-[0.42rem] rounded-[0.42rem] border border-transparent bg-transparent px-[0.58rem]",
  "text-left text-[0.76rem] text-[var(--text)] [touch-action:manipulation]",
  "hover:border-[var(--dashboard-border)]",
);

export const styles = {
  shell:
    `dashboard-theme-scope flex min-h-dvh bg-[var(--bg)] ${dashboardBorder} min-[900px]:grid min-[900px]:h-dvh min-[900px]:grid-cols-[12.4rem_minmax(0,1fr)] min-[900px]:overflow-hidden`,
  sidebar:
    "hidden min-[900px]:sticky min-[900px]:top-0 min-[900px]:flex min-[900px]:h-dvh min-[900px]:min-h-0 min-[900px]:self-start min-[900px]:flex-col min-[900px]:gap-[1rem] min-[900px]:border-r min-[900px]:border-[var(--dashboard-border)] min-[900px]:bg-transparent min-[900px]:px-[0.68rem] min-[900px]:py-[1.08rem]",
  brand: "text-[2.2rem] leading-[0.92] tracking-[-0.05em] font-[520]",
  sideNav: "flex flex-col gap-[0.28rem]",
  navButton:
    "inline-flex min-h-[2.36rem] cursor-pointer items-center gap-[0.55rem] rounded-[0.5rem] border border-transparent bg-transparent px-[0.72rem] text-left text-[0.72rem] text-[var(--muted)] transition-[border-color,background-color,color] duration-150 hover:border-[var(--dashboard-border)] hover:text-[var(--text)] data-[active=true]:border-[var(--dashboard-border-strong)] data-[active=true]:text-[var(--text)]",
  navIcon: "h-[0.85rem] w-[0.85rem]",
  sidebarUtilityStack: "mt-auto flex flex-col gap-[0.52rem]",
  sidebarAction:
    "inline-flex min-h-[2.42rem] cursor-pointer items-center gap-[0.55rem] rounded-[0.52rem] border border-[var(--dashboard-border)] bg-transparent px-[0.72rem] text-left text-[0.72rem] text-[var(--text)] transition-[transform,border-color,background-color] duration-[140ms] hover:border-[var(--dashboard-border-strong)] active:translate-y-[1px]",
  sidebarActionDisabled:
    "cursor-default border-[var(--calendar-active-border)] bg-[var(--calendar-active-bg)] text-[var(--muted)] hover:border-[var(--calendar-active-border)] active:translate-y-0",
  sidebarActionIcon: "h-[0.9rem] w-[0.9rem]",
  sidebarDivider: "h-px w-full bg-[var(--dashboard-border)]",
  sidebarSecondaryAction:
    "inline-flex min-h-[2.36rem] cursor-pointer items-center gap-[0.55rem] rounded-[0.5rem] border border-transparent bg-transparent px-[0.72rem] text-left text-[0.72rem] text-[var(--muted)] transition-[border-color,background-color,color] duration-150 hover:border-[var(--dashboard-border)] hover:text-[var(--text)] data-[active=true]:border-[var(--dashboard-border-strong)] data-[active=true]:text-[var(--text)]",
  main:
    "mx-auto flex w-full max-w-[92rem] flex-1 flex-col gap-[0.86rem] bg-[var(--bg)] px-[0.96rem] pt-[1rem] pb-[1.2rem] max-[760px]:px-[0.82rem] min-[900px]:h-dvh min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:overscroll-contain min-[900px]:px-[1.18rem] min-[900px]:pt-[1.06rem] min-[900px]:pb-[1.3rem] [scrollbar-gutter:stable]",
  header:
    "flex items-start justify-between gap-[0.75rem] max-[760px]:items-center",
  headerText: "flex min-w-0 flex-col",
  title:
    "m-0 text-[clamp(1.55rem,6.8vw,2.2rem)] leading-[1.05] tracking-[-0.03em] font-[540]",
  headerActions:
    "inline-flex shrink-0 items-center gap-[0.5rem] max-[760px]:hidden",
  mobileHeaderActions:
    "hidden shrink-0 items-center gap-[0.5rem] max-[760px]:inline-flex",
  mobileMenu: "relative hidden max-[760px]:inline-flex",
  mobileMenuToggle: headerActionBase,
  mobileMenuToggleIcon: "h-[1rem] w-[1rem]",
  mobileMenuPanel:
    "absolute right-0 top-[calc(100%+0.36rem)] z-20 flex w-[12rem] flex-col gap-[0.22rem] rounded-[0.56rem] border border-[var(--dashboard-border)] bg-[var(--bg)] p-[0.28rem] min-[900px]:hidden",
  mobileMenuNav: "flex flex-col gap-[0.34rem]",
  mobileMenuItem: cn(
    mobileMenuItemBase,
    "data-[active=true]:border-[var(--dashboard-border-strong)] data-[active=true]:text-[var(--text)]",
  ),
  mobileMenuItemIcon: "h-[0.92rem] w-[0.92rem]",
  tableCellTitle: "block font-[560]",
  tableCellMeta: "mt-[0.14rem] block text-[0.72rem] text-[var(--muted)]",
  kpiGrid:
    "grid grid-cols-1 gap-[0.56rem] min-[900px]:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]",
  dashboardKpiGrid:
    "[&_.dashboard-kpi-action-card]:hidden max-[760px]:grid-cols-2 max-[760px]:[&_.dashboard-kpi-action-card]:flex",
  progressKpiGrid: "max-[760px]:grid-cols-2",
  kpiCard:
    `${dashboardSurface} flex min-h-[4.95rem] flex-col gap-[0.28rem] px-[0.7rem] py-[0.62rem]`,
  kpiActionCard:
    "dashboard-kpi-action-card cursor-pointer items-start justify-center gap-[0.42rem] border-dashed text-[var(--text)] no-underline hover:border-[var(--dashboard-border-strong)] max-[760px]:gap-[0.28rem]",
  kpiActionCardDisabled:
    "cursor-default border-[var(--calendar-active-border)] bg-[var(--calendar-active-bg)] text-[var(--muted)] hover:border-[var(--calendar-active-border)]",
  kpiActionIcon: "h-[1.02rem] w-[1.02rem] max-[760px]:h-[0.92rem] max-[760px]:w-[0.92rem] -mt-3",
  kpiActionText:
    "text-[1rem] leading-[1.1] max-[760px]:text-[clamp(1.4rem,4.6vw,2rem)] max-[760px]:leading-none max-[760px]:tracking-[-0.05em] max-[760px]:font-[520]",
  kpiLabel: "m-0 text-[0.72rem] text-[var(--muted)]",
  kpiValue:
    "m-0 break-words text-[clamp(1.4rem,4.6vw,2rem)] leading-none tracking-[-0.05em] font-[520]",
  inlineBars: "mt-[0.28rem] flex min-h-[0.9rem] items-end gap-[0.2rem]",
  inlineBar:
    "flex-1 rounded-[0.18rem] bg-[color-mix(in_srgb,var(--text)_24%,transparent)]",
  panel: `${dashboardSurface} p-[0.82rem]`,
  dashboardInsightGrid:
    "grid grid-cols-1 gap-[0.56rem] min-[900px]:grid-cols-2",
  plainSection: "p-0",
  panelHead:
    "flex items-center justify-between gap-[0.5rem] max-[760px]:flex-wrap max-[760px]:items-stretch",
  panelTitle: "m-0 text-[1rem] tracking-[-0.015em] font-[560]",
  panelSubtitle: "m-[0.2rem_0_0.8rem] text-[0.72rem] text-[var(--muted)]",
  calendarHead:
    "flex flex-wrap items-center justify-between gap-[0.5rem]",
  calendarNav: "inline-flex items-center gap-[0.35rem]",
  calendarNavButton:
    "min-h-[1.9rem] cursor-pointer rounded-[0.5rem] border border-[var(--dashboard-border)] bg-transparent px-[0.58rem] text-[0.65rem] text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-[0.38] hover:enabled:border-[var(--dashboard-border-strong)]",
  calendarWeekdayRow: "mt-[0.2rem] grid grid-cols-7 gap-[0.32rem]",
  calendarWeekday: "text-center text-[0.65rem] text-[var(--muted)]",
  calendarGrid: "grid grid-cols-7 gap-[0.32rem]",
  calendarDay:
    "relative flex aspect-square items-center justify-center rounded-[0.42rem] border border-[var(--dashboard-border)] bg-[var(--surface)] text-[color-mix(in_srgb,var(--text)_88%,var(--muted))]",
  calendarDayActive:
    "!border-[var(--calendar-active-border)] !bg-[var(--calendar-active-bg)] text-[var(--text)]",
  calendarDayNumber: "text-[0.84rem] leading-none",
  calendarDayEmpty: "aspect-square rounded-[0.42rem] border border-transparent",
  searchInput:
    "h-[2.18rem] w-[clamp(9rem,34vw,14rem)] rounded-[0.52rem] border border-[var(--dashboard-border)] bg-[var(--bg)] px-[0.74rem] text-[0.84rem] text-[var(--text)] placeholder:text-[color-mix(in_srgb,var(--muted)_82%,transparent)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2 max-[760px]:h-[2.5rem] max-[760px]:w-full",
  tableWrap: "mt-[0.56rem] overflow-x-auto",
  table:
    "min-w-[42rem] w-full table-fixed border-collapse border-spacing-0 [&_th]:border-b [&_th]:border-[var(--dashboard-border)] [&_th]:px-[0.48rem] [&_th]:py-[0.4rem] [&_th]:text-left [&_th]:text-[0.65rem] [&_th]:font-medium  [&_th]:text-[var(--muted)] [&_th:last-child]:whitespace-nowrap [&_th:last-child]:pr-[0.48rem] [&_td]:border-b [&_td]:border-[var(--dashboard-border)] [&_td]:bg-transparent [&_td]:px-[0.48rem] [&_td]:py-[0.64rem] [&_td]:text-[0.84rem] [&_td]:text-[color-mix(in_srgb,var(--text)_92%,var(--muted))] [&_td:last-child]:whitespace-nowrap [&_td:last-child]:pr-[0.48rem] [&_td:last-child]:text-left",
  workoutTableDateColumn: "w-[14%]",
  workoutTableWorkoutColumn: "w-[26%]",
  workoutTableExercisesColumn: "w-[12%]",
  workoutTableSetsColumn: "w-[12%]",
  workoutTableVolumeColumn: "w-[18%]",
  workoutTableActionsColumn: "w-[12%]",
  tableLink:
    "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-[0.42rem] border border-[var(--dashboard-border)] px-[0.56rem] py-[0.2rem] text-[0.72rem] text-[var(--text)] transition-[border-color,background-color] duration-150 hover:border-[var(--dashboard-border-strong)]",
  metricList:
    "mt-[0.66rem] flex flex-col gap-[0.36rem] overflow-x-auto [scrollbar-width:thin]",
  paginationRow:
    "mt-[0.58rem] flex flex-wrap items-center justify-between gap-[0.5rem]",
  paginationMeta: "m-0 text-[0.72rem] text-[var(--muted)]",
  paginationControls: "inline-flex items-center gap-[0.3rem]",
  paginationButton:
    "min-h-[1.9rem] cursor-pointer rounded-[0.5rem] border border-[var(--dashboard-border)] bg-transparent px-[0.62rem] text-[0.72rem] text-[var(--text)] transition-[border-color,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-[0.38] hover:enabled:border-[var(--dashboard-border-strong)] max-[760px]:min-h-[2.12rem]",
  paginationPage:
    "text-[0.72rem] text-[var(--muted)]",
  metricHeader:
    "grid w-[max(100%,34rem)] items-center gap-[0.44rem] px-[0.6rem] max-[760px]:w-[max(100%,30rem)]",
  metricHeaderCell:
    "whitespace-nowrap text-[0.65rem] font-medium text-[var(--muted)]",
  metricHeaderPrimary: "pl-[0.06rem]",
  metricRow:
    "grid w-[max(100%,34rem)] items-center gap-[0.44rem] rounded-[0.5rem] border border-[var(--dashboard-border)] bg-transparent p-[0.58rem] text-[0.84rem] transition-[border-color,background-color] duration-150 hover:border-[var(--dashboard-border-strong)] max-[760px]:w-[max(100%,30rem)]",
  clickableMetricRow: "cursor-pointer text-inherit no-underline hover:translate-y-0",
  personalBestRow:
    "grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)_minmax(0,1fr)] w-[max(100%,24rem)] max-[760px]:w-[max(100%,22rem)]",
  exerciseRow:
    "grid-cols-[minmax(0,1.95fr)_repeat(4,minmax(0,0.9fr))] w-[max(100%,36rem)]",
  workoutHistoryRow:
    "grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)_minmax(0,0.9fr)_minmax(0,0.85fr)_minmax(0,1fr)] w-[max(100%,40rem)]",
  metricMain: "m-0 text-[0.84rem] leading-[1.3] font-[520] text-[var(--text)]",
  metricSubtle: "m-[0.18rem_0_0] text-[0.72rem] text-[var(--muted)]",
  timeline: "mt-[0.66rem] flex flex-col gap-[0.9rem]",
  monthSection: "flex flex-col gap-[0.42rem]",
  monthTitle:
    "m-0 text-[0.72rem] text-[var(--muted)]",
  chartGrid:
    "grid grid-cols-1 gap-[0.56rem] min-[900px]:grid-cols-2",
  chartPanel: `${dashboardSurface} p-[0.82rem]`,
  chartFrame: "mt-[0.52rem] h-[15rem] w-full",
  profileForm:
    "mt-[0.72rem] grid grid-cols-1 gap-[0.58rem] min-[900px]:grid-cols-2",
  profileField:
    "flex flex-col gap-[0.24rem] [&>span]:text-[0.72rem] [&>span]:text-[var(--muted)]",
  profileInput:
    "min-h-[2.48rem] rounded-[0.52rem] border border-[var(--dashboard-border)] bg-[var(--bg)] px-[0.7rem] text-[0.84rem] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2 max-[760px]:min-h-[2.65rem]",
  profileActions:
    "mt-[0.8rem] inline-flex flex-nowrap items-center gap-[0.45rem] max-[760px]:flex-wrap min-[900px]:col-span-2",
  profileActionForm: "m-0",
  primaryButton:
    "min-h-[2.34rem] cursor-pointer rounded-[0.52rem] border border-[var(--dashboard-border)] bg-transparent px-[0.92rem] text-[0.84rem] text-[var(--text)] hover:border-[var(--dashboard-border-strong)] disabled:cursor-not-allowed disabled:opacity-50 max-[760px]:min-h-[2.52rem]",
  secondaryButton:
    "min-h-[2.34rem] cursor-pointer rounded-[0.52rem] border border-[var(--dashboard-border)] bg-transparent px-[0.92rem] text-[0.84rem] text-[var(--text)] hover:border-[var(--dashboard-border-strong)] max-[760px]:min-h-[2.52rem]",
  profileStatus:
    "m-0 text-[0.72rem] data-[state=success]:text-[#2f7b4d] data-[state=error]:text-[#b13d48] min-[900px]:col-span-2",
  empty: "m-[0.68rem_0_0] text-[0.84rem] text-[var(--muted)]",
} as const;
