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
  "max-[760px]:h-[2.3rem] max-[760px]:min-h-[2.3rem] max-[760px]:w-[2.3rem] max-[760px]:min-w-[2.3rem] max-[760px]:px-0",
  "focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2",
  "transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-[1px]",
);
const mobileMenuItemBase = cn(
  "inline-flex min-h-[2.2rem] w-full cursor-pointer items-center gap-[0.42rem] rounded-[0.42rem] border border-transparent bg-transparent px-[0.58rem]",
  "text-left text-[0.76rem] text-[var(--text)] [touch-action:manipulation]",
  "focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2",
  "transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-[1px]",
  "hover:border-[var(--dashboard-border)]",
);
const buttonMotion =
  "transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-[1px]";
const buttonFocusRing =
  "focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2";

export const styles = {
  shell:
    `dashboard-theme-scope flex min-h-dvh bg-[var(--bg)] ${dashboardBorder} min-[900px]:grid min-[900px]:h-dvh min-[900px]:grid-cols-[12.4rem_minmax(0,1fr)] min-[900px]:overflow-hidden min-[900px]:transition-[grid-template-columns] min-[900px]:duration-300 min-[900px]:ease-[cubic-bezier(0.2,0.7,0.2,1)]`,
  shellSidebarCollapsed:
    "min-[900px]:!grid-cols-[4.25rem_minmax(0,1fr)]",
  sidebar:
    "hidden min-[900px]:sticky min-[900px]:top-0 min-[900px]:flex min-[900px]:h-dvh min-[900px]:min-h-0 min-[900px]:self-start min-[900px]:flex-col min-[900px]:gap-[1rem] min-[900px]:overflow-hidden min-[900px]:border-r min-[900px]:border-[var(--dashboard-border)] min-[900px]:bg-transparent min-[900px]:px-[0.68rem] min-[900px]:py-[1.08rem] min-[900px]:transition-[padding,background-color,border-color] min-[900px]:duration-300 min-[900px]:ease-[cubic-bezier(0.2,0.7,0.2,1)]",
  sidebarCollapsed:
    "min-[900px]:items-center min-[900px]:px-[0.48rem]",
  sidebarTop:
    "flex items-center justify-between gap-[0.5rem] transition-[justify-content] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
  sidebarTopCollapsed:
    "justify-center",
  sidebarToggle:
    `inline-flex h-[2.1rem] w-[2.1rem] shrink-0 cursor-w-resize items-center justify-center rounded-[0.5rem] border-0 bg-transparent text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)] transition-[transform,background-color,color,box-shadow,opacity] duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] active:translate-y-[1px] ${buttonFocusRing}`,
  sidebarCollapsedLogoToggle:
    `group relative inline-flex h-[2.36rem] w-[2.36rem] shrink-0 cursor-e-resize items-center justify-center rounded-[0.5rem] border-0 bg-transparent text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)] transition-[transform,background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] active:translate-y-[1px] ${buttonFocusRing}`,
  sidebarCollapsedLogo:
    "absolute inset-0 flex items-center justify-center opacity-100 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-90 group-hover:opacity-0 group-focus-visible:scale-90 group-focus-visible:opacity-0",
  sidebarCollapsedToggleIconWrap:
    "absolute inset-0 flex scale-110 items-center justify-center opacity-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100",
  sidebarToggleIcon: "h-[1rem] w-[1rem]",
  brand: "text-[2.2rem] leading-[0.92] tracking-[-0.03em] font-[520]",
  sideNav: "flex flex-col gap-[0.28rem]",
  sideNavCollapsed: "items-center",
  navButton:
    `inline-flex min-h-[2.36rem] cursor-pointer items-center gap-[0.55rem] overflow-hidden rounded-[0.5rem] border border-transparent bg-transparent px-[0.72rem] text-left text-[0.84rem] text-[var(--muted)] hover:border-[var(--dashboard-border)] hover:text-[var(--text)] data-[active=true]:border-[var(--dashboard-border-strong)] data-[active=true]:text-[var(--text)] transition-[width,min-width,transform,border-color,background-color,color,box-shadow,padding,gap] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] active:translate-y-[1px] ${buttonFocusRing}`,
  navButtonCollapsed:
    "h-[2.36rem] w-[2.36rem] justify-center gap-0 px-0",
  navIcon: "h-[0.85rem] w-[0.85rem]",
  navLabelCollapsed: "sr-only",
  sidebarUtilityStack: "mt-auto flex flex-col gap-[0.52rem]",
  sidebarUtilityStackCollapsed: "items-center",
  sidebarAction:
    `inline-flex min-h-[2.42rem] cursor-pointer items-center gap-[0.55rem] overflow-hidden rounded-[0.52rem] border border-[var(--dashboard-border)] bg-transparent px-[0.72rem] text-left text-[0.84rem] text-[var(--text)] hover:border-[var(--dashboard-border-strong)] transition-[width,min-width,transform,border-color,background-color,color,box-shadow,padding,gap] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] active:translate-y-[1px] ${buttonFocusRing}`,
  sidebarActionCollapsed:
    "h-[2.42rem] w-[2.42rem] justify-center gap-0 px-0",
  sidebarActionDisabled:
    "cursor-default border-[var(--calendar-active-border)] bg-[var(--calendar-active-bg)] text-[var(--muted)] hover:border-[var(--calendar-active-border)] active:translate-y-0",
  sidebarActionLogged:
    "cursor-default !border-[color-mix(in_srgb,#21834d_42%,transparent)] !bg-[color-mix(in_srgb,#21834d_10%,var(--bg))] !text-[color-mix(in_srgb,#21834d_82%,var(--text))] hover:!border-[color-mix(in_srgb,#21834d_42%,transparent)] active:translate-y-0",
  sidebarActionIcon: "h-[0.9rem] w-[0.9rem]",
  sidebarDivider: "h-px w-full bg-[var(--dashboard-border)]",
  sidebarSecondaryAction:
    `inline-flex min-h-[2.36rem] cursor-pointer items-center gap-[0.55rem] overflow-hidden rounded-[0.5rem] border border-transparent bg-transparent px-[0.72rem] text-left text-[0.84rem] text-[var(--muted)] hover:border-[var(--dashboard-border)] hover:text-[var(--text)] data-[active=true]:border-[var(--dashboard-border-strong)] data-[active=true]:text-[var(--text)] transition-[width,min-width,transform,border-color,background-color,color,box-shadow,padding,gap] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] active:translate-y-[1px] ${buttonFocusRing}`,
  main:
    "flex w-full min-w-0 flex-1 flex-col gap-[0.86rem] bg-[var(--bg)] px-[0.96rem] pt-[1rem] pb-[1.2rem] max-[760px]:px-[0.82rem] min-[900px]:h-dvh min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:overscroll-contain min-[900px]:px-[1.18rem] min-[900px]:pt-[1.06rem] min-[900px]:pb-[1.3rem] [scrollbar-gutter:stable]",
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
  kpiGrid:
    "grid grid-cols-1 gap-[0.56rem] min-[900px]:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]",
  dashboardKpiGrid:
    "[&_.dashboard-kpi-action-card]:hidden max-[760px]:grid-cols-2 max-[760px]:[&_.dashboard-kpi-action-card]:flex",
  progressKpiGrid: "max-[760px]:grid-cols-2",
  kpiCard:
    `${dashboardSurface} flex min-h-[4.95rem] flex-col gap-[0.28rem] px-[0.7rem] py-[0.62rem]`,
  kpiActionCard:
    `dashboard-kpi-action-card cursor-pointer items-start justify-center gap-[0.42rem] border-dashed text-[var(--text)] no-underline hover:border-[var(--dashboard-border-strong)] max-[760px]:gap-[0.28rem] ${buttonMotion} ${buttonFocusRing}`,
  kpiActionCardDisabled:
    "cursor-default border-[var(--calendar-active-border)] bg-[var(--calendar-active-bg)] text-[var(--muted)] hover:border-[var(--calendar-active-border)]",
  kpiActionCardLogged:
    "cursor-default !border-[color-mix(in_srgb,#21834d_42%,transparent)] !bg-[color-mix(in_srgb,#21834d_10%,var(--bg))] !text-[color-mix(in_srgb,#21834d_82%,var(--text))] hover:!border-[color-mix(in_srgb,#21834d_42%,transparent)] active:translate-y-0",
  kpiActionIcon: "h-[1.02rem] w-[1.02rem] max-[760px]:h-[0.92rem] max-[760px]:w-[0.92rem] -mt-3",
  kpiActionText:
    "text-[1rem] leading-[1.1] max-[760px]:text-[clamp(1.4rem,4.6vw,2rem)] max-[760px]:leading-none max-[760px]:tracking-[-0.03em] max-[760px]:font-[520]",
  kpiLabel: "m-0 text-[0.72rem] text-[var(--muted)]",
  kpiValue:
    "m-0 break-words text-[clamp(1.4rem,4.6vw,2rem)] leading-none tracking-[-0.03em] font-[520]",
  inlineBars: "mt-[0.28rem] flex min-h-[0.9rem] items-end gap-[0.2rem]",
  inlineBar:
    "flex-1 rounded-[0.18rem] bg-[color-mix(in_srgb,var(--text)_24%,transparent)]",
  panel: `${dashboardSurface} p-[0.82rem]`,
  dashboardInsightGrid:
    "grid grid-cols-1 gap-[0.56rem] min-[900px]:grid-cols-2",
  plainSection: "min-h-0 p-0",
  panelHead:
    "flex items-center justify-between gap-[0.5rem] max-[760px]:flex-wrap max-[760px]:items-stretch",
  panelTitle: "m-0 text-[1rem] tracking-[-0.03em] font-[560]",
  panelSubtitle: "m-[0.2rem_0_0.8rem] text-[0.72rem] text-[var(--muted)]",
  calendarHead:
    "flex flex-wrap items-center justify-between gap-[0.5rem]",
  calendarNav: "inline-flex items-center gap-[0.35rem]",
  calendarNavButton:
    `min-h-[1.9rem] cursor-pointer rounded-[0.5rem] border border-[var(--dashboard-border)] bg-transparent px-[0.58rem] text-[0.65rem] text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-[0.38] hover:enabled:border-[var(--dashboard-border-strong)] ${buttonMotion} ${buttonFocusRing}`,
  calendarWeekdayRow: "mt-[0.2rem] grid grid-cols-7 gap-[0.32rem]",
  calendarWeekday: "text-center text-[0.65rem] text-[var(--muted)]",
  calendarGrid: "grid grid-cols-7 gap-[0.32rem]",
  calendarDay:
    "relative flex aspect-square items-center justify-center rounded-[0.42rem] border border-[var(--dashboard-border)] bg-[var(--surface)] text-[color-mix(in_srgb,var(--text)_88%,var(--muted))]",
  calendarDayActive:
    "!border-[var(--calendar-active-border)] !bg-[var(--calendar-active-bg)] text-[var(--text)]",
  calendarDayClickable:
    `cursor-pointer text-inherit no-underline hover:border-[var(--dashboard-border-strong)] ${buttonMotion} ${buttonFocusRing}`,
  calendarDayNumber: "text-[0.84rem] leading-none",
  calendarDayEmpty: "aspect-square rounded-[0.42rem] border border-transparent",
  searchInput:
    "h-[2.18rem] w-[clamp(9rem,34vw,14rem)] rounded-[0.52rem] border border-[var(--dashboard-border)] bg-[var(--bg)] px-[0.74rem] text-[0.84rem] text-[var(--text)] placeholder:text-[color-mix(in_srgb,var(--muted)_82%,transparent)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2 max-[760px]:h-[2.5rem] max-[760px]:w-full",
  exerciseToolbar:
    "flex min-w-0 items-center justify-end gap-[0.46rem] max-[760px]:w-full max-[760px]:flex-wrap max-[760px]:justify-start",
  exerciseSortControls:
    "relative inline-grid min-h-[2.18rem] shrink-0 grid-cols-2 overflow-hidden rounded-[0.74rem] border border-[var(--dashboard-border)] bg-transparent p-[0.08rem] max-[760px]:min-h-[2.5rem]",
  exerciseSortIndicator:
    "pointer-events-none absolute top-[0.08rem] bottom-[0.08rem] left-[0.08rem] z-0 w-[calc(50%-0.08rem)] rounded-[0.62rem] border border-[var(--dashboard-border)] bg-[var(--bg)] transition-transform duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] [[data-active-sort=sessions]_&]:translate-x-full",
  exerciseSortButton:
    `relative z-10 inline-flex min-w-[5.5rem] cursor-pointer items-center justify-center gap-[0.34rem] rounded-[0.62rem] border border-transparent bg-transparent px-[0.78rem] text-[0.86rem] text-[color-mix(in_srgb,var(--muted)_74%,transparent)] hover:text-[var(--text)] data-[active=true]:text-[var(--text)] max-[760px]:min-w-[calc(50vw-2.1rem)] max-[760px]:px-[0.64rem] ${buttonMotion} ${buttonFocusRing}`,
  exerciseSortIcon:
    "h-[0.92rem] w-[0.92rem] shrink-0",
  metricList:
    "mt-[0.66rem] flex flex-col gap-[0.36rem] overflow-x-visible min-[761px]:overflow-x-auto min-[761px]:[scrollbar-width:thin]",
  paginationRow:
    "mt-[0.58rem] flex flex-wrap items-center justify-between gap-[0.5rem]",
  paginationMeta: "m-0 text-[0.72rem] text-[var(--muted)]",
  paginationControls: "inline-flex items-center gap-[0.3rem]",
  paginationButton:
    `min-h-[1.9rem] cursor-pointer rounded-[0.5rem] border border-[var(--dashboard-border)] bg-transparent px-[0.62rem] text-[0.72rem] text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-[0.38] hover:enabled:border-[var(--dashboard-border-strong)] max-[760px]:min-h-[2.12rem] ${buttonMotion} ${buttonFocusRing}`,
  paginationPage:
    "text-[0.72rem] text-[var(--muted)]",
  metricHeader:
    "grid w-[max(100%,34rem)] items-center gap-[0.44rem] px-[0.6rem] max-[760px]:hidden",
  metricHeaderCell:
    "whitespace-nowrap text-[0.65rem] font-medium text-[var(--muted)]",
  metricHeaderPrimary: "pl-[0.06rem]",
  metricRow:
    "grid w-full min-w-0 items-center gap-[0.44rem] rounded-[0.5rem] border border-[var(--dashboard-border)] bg-transparent p-[0.58rem] text-[0.84rem] transition-[border-color,background-color] duration-150 hover:border-[var(--dashboard-border-strong)] min-[761px]:w-[max(100%,34rem)] max-[760px]:gap-x-[0.48rem] max-[760px]:gap-y-[0.12rem] max-[760px]:px-[0.56rem] max-[760px]:py-[0.52rem]",
  clickableMetricRow:
    `cursor-pointer text-inherit no-underline hover:translate-y-0 ${buttonFocusRing} ${buttonMotion}`,
  metricMobileLabel:
    "min-w-0",
  personalBestRow:
    "grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)_minmax(0,1fr)] min-[761px]:w-[max(100%,24rem)] max-[760px]:grid-cols-[4.8rem_minmax(0,1fr)_auto] max-[760px]:[&>*:nth-child(3)]:justify-self-end",
  workoutSummaryLine:
    "m-0 hidden min-w-0 truncate text-[0.84rem] leading-[1.3] font-[520] text-[var(--text)] max-[760px]:block",
  workoutSummaryMeta:
    "text-[var(--muted)] font-[400]",
  workoutMobileStats:
    "hidden min-w-0 whitespace-nowrap text-right max-[760px]:block",
  workoutDesktopStat:
    "min-w-0 max-[760px]:hidden",
  exerciseMobileStats:
    "hidden min-w-0 text-right max-[760px]:flex max-[760px]:flex-col max-[760px]:gap-[0.12rem] max-[760px]:whitespace-nowrap",
  exerciseMobileStatPrimary:
    "text-[0.84rem] text-[var(--text)]",
  exerciseMobileStatSecondary:
    "text-[0.72rem] text-[var(--muted)]",
  exerciseDesktopStat:
    "min-w-0 max-[760px]:hidden",
  exerciseRow:
    "grid-cols-[minmax(0,1.95fr)_repeat(4,minmax(0,0.9fr))] min-[761px]:w-[max(100%,36rem)] max-[760px]:grid-cols-[minmax(0,1fr)_auto] max-[760px]:items-center max-[760px]:gap-x-[0.62rem]",
  workoutHistoryRow:
    "grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)_minmax(0,0.9fr)_minmax(0,0.85fr)_minmax(0,1fr)] min-[761px]:w-[max(100%,40rem)] max-[760px]:grid-cols-[4.8rem_minmax(0,1fr)_auto] max-[760px]:[&>*:nth-child(2)]:min-w-0 max-[760px]:[&>*:nth-child(5)]:justify-self-end max-[760px]:[&>*:nth-child(6)]:hidden",
  metricMain: "m-0 text-[0.84rem] leading-[1.3] font-[520] text-[var(--text)]",
  metricSubtle: "m-[0.18rem_0_0] text-[0.72rem] text-[var(--muted)]",
  workoutFilterToggle:
    `relative inline-flex h-[1.95rem] w-[1.95rem] cursor-pointer items-center justify-center rounded-full border border-[var(--dashboard-border)] bg-[var(--toggle-bg)] text-[var(--text)] data-[active=true]:border-[var(--dashboard-border-strong)] data-[active=true]:bg-[var(--toggle-active-bg)] data-[active=true]:text-[var(--toggle-active-icon)] ${buttonMotion} ${buttonFocusRing}`,
  workoutFilterToggleIcon: "h-[0.92rem] w-[0.92rem]",
  workoutFilterPopover:
    `${dashboardBorder} ${dashboardSurface} z-50 flex w-[min(35rem,calc(100vw-1.64rem))] max-w-[calc(100vw-1.64rem)] flex-col gap-[0.72rem] !bg-[var(--bg)] p-[0.82rem] shadow-[0_14px_32px_color-mix(in_srgb,#000_12%,transparent)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out max-[760px]:max-h-[min(34rem,calc(100dvh-1.64rem))] max-[760px]:overflow-y-auto`,
  workoutFilterGrid:
    "grid grid-cols-1 gap-[0.62rem] min-[620px]:grid-cols-2 min-[1080px]:grid-cols-4",
  workoutFilterField:
    "flex min-w-0 flex-col gap-[0.28rem] text-[0.72rem] text-[var(--muted)]",
  workoutFilterInput:
    "min-h-[2.5rem] min-w-0 rounded-[0.42rem] border border-[var(--dashboard-border)] bg-[var(--bg)] px-[0.72rem] text-[0.84rem] text-[var(--text)] outline-none focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2",
  workoutFilterFooter:
    "flex flex-wrap items-center justify-between gap-[0.55rem] border-t border-[var(--dashboard-border)] pt-[0.68rem] max-[420px]:items-stretch",
  workoutFilterMeta:
    "m-0 text-[0.72rem] text-[var(--muted)]",
  workoutFilterReset:
    `inline-flex min-h-[2.18rem] cursor-pointer items-center justify-center rounded-[0.46rem] border border-[var(--dashboard-border)] bg-transparent px-[0.74rem] text-[0.76rem] text-[var(--text)] hover:border-[var(--dashboard-border-strong)] disabled:cursor-not-allowed disabled:opacity-40 max-[420px]:w-full ${buttonMotion} ${buttonFocusRing}`,
  timeline: "mt-[0.66rem] flex flex-col gap-[0.9rem]",
  monthSection: "flex flex-col gap-[0.42rem]",
  monthTitle:
    "m-0 text-[0.72rem] text-[var(--muted)]",
  chartGrid:
    "grid grid-cols-1 gap-[0.56rem] min-[900px]:grid-cols-2",
  chartPanel: `${dashboardSurface} p-[0.82rem]`,
  chartFrame: "mt-[0.52rem] h-[15rem] w-full",
  nutritionSummaryMeta:
    "m-[0.14rem_0_0] truncate text-[0.68rem] text-[var(--muted)]",
  nutritionForm:
    "grid grid-cols-2 gap-[0.52rem] min-[760px]:grid-cols-4 max-[420px]:grid-cols-1",
  nutritionField:
    "flex min-w-0 flex-col gap-[0.28rem] text-[0.7rem] text-[var(--muted)]",
  nutritionInput:
    "min-h-[2.6rem] min-w-0 rounded-[0.42rem] border border-[var(--dashboard-border)] bg-[var(--bg)] px-[0.72rem] text-[0.9rem] text-[var(--text)] outline-none focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2 max-[760px]:min-h-[2.75rem]",
  nutritionFormActions:
    "mt-[0.72rem] flex justify-end max-[520px]:mt-[0.62rem]",
  nutritionSaveButton:
    `inline-flex min-h-[2.6rem] cursor-pointer items-center justify-center gap-[0.4rem] rounded-[0.48rem] border border-[var(--dashboard-border)] bg-transparent px-[1.1rem] text-[0.84rem] text-[var(--text)] hover:border-[var(--dashboard-border-strong)] disabled:cursor-progress disabled:opacity-50 max-[520px]:w-full max-[760px]:min-h-[2.75rem] ${buttonMotion} ${buttonFocusRing}`,
  nutritionButtonIcon:
    "h-[0.86rem] w-[0.86rem] shrink-0 stroke-current",
  nutritionChartHead:
    "flex flex-wrap items-center justify-between gap-[0.55rem] max-[520px]:items-stretch",
  nutritionSegments:
    "relative inline-grid min-h-[2.12rem] grid-cols-3 overflow-hidden rounded-[0.68rem] border border-[var(--dashboard-border)] bg-transparent p-[0.08rem] max-[520px]:w-full",
  nutritionSegmentButton:
    `inline-flex min-w-[4.1rem] cursor-pointer items-center justify-center rounded-[0.56rem] border border-transparent bg-transparent px-[0.58rem] text-[0.76rem] text-[var(--muted)] hover:text-[var(--text)] data-[active=true]:border-[var(--dashboard-border)] data-[active=true]:text-[var(--text)] max-[520px]:min-w-0 ${buttonMotion} ${buttonFocusRing}`,
  nutritionChartFrame:
    "mt-[0.52rem] h-[14rem] w-full",
  nutritionRow:
    "grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,0.9fr))] min-[761px]:w-[max(100%,40rem)] max-[760px]:grid-cols-[minmax(0,1fr)_auto] max-[760px]:items-center max-[760px]:gap-x-[0.62rem]",
  nutritionDesktopStat:
    "min-w-0 max-[760px]:hidden",
  nutritionMobileStats:
    "hidden min-w-0 text-right max-[760px]:flex max-[760px]:flex-col max-[760px]:gap-[0.12rem] max-[760px]:whitespace-nowrap",
  nutritionMobileStatPrimary:
    "text-[0.84rem] text-[var(--text)]",
  nutritionMobileStatSecondary:
    "text-[0.72rem] text-[var(--muted)]",
  profilePanel:
    "w-full",
  profileBody:
    "grid w-full grid-cols-[18rem_minmax(0,1fr)] gap-[1.08rem] max-[900px]:grid-cols-1",
  profileIdentityPanel:
    `${dashboardSurface} flex min-w-0 flex-col gap-[0.72rem] p-[1rem] max-[900px]:grid max-[900px]:grid-cols-[auto_minmax(0,1fr)] max-[900px]:items-center max-[900px]:gap-x-[0.86rem] max-[760px]:p-[0.82rem]`,
  profileEditorPanel:
    `${dashboardSurface} flex min-w-0 flex-col gap-[1rem] p-[1rem] max-[760px]:p-[0.82rem]`,
  profileTopBar:
    "flex items-center",
  profilePhotoControl:
    "inline-flex min-h-[4.9rem] items-center gap-[0.72rem] text-[var(--text)]",
  profileControlsField:
    "flex min-w-0 items-center gap-[0.58rem] max-[520px]:flex-wrap",
  profilePhotoButton:
    "group relative h-[13.2rem] w-full shrink-0 overflow-hidden rounded-[0.58rem] max-[900px]:row-span-3 max-[900px]:h-[6.2rem] max-[900px]:w-[6.2rem]",
  profilePhotoPreview:
    `flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-[0.58rem] border border-[var(--dashboard-border)] bg-[var(--calendar-active-bg)] bg-cover bg-center text-[var(--text)] data-[has-image=true]:border-[var(--dashboard-border-strong)] disabled:cursor-not-allowed disabled:opacity-60 [&>svg]:h-[1.2rem] [&>svg]:w-[1.2rem] ${buttonFocusRing}`,
  profilePhotoEditOverlay:
    "pointer-events-none absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,#000_42%,transparent)] text-[0.78rem] font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
  profileIdentityText:
    "min-w-0",
  profileRailName:
    "m-0 truncate text-[1.05rem] leading-[1.15] font-[560] text-[var(--text)]",
  profileRailMeta:
    `block m-[0.16rem_0_0] truncate !text-[var(--muted)] !no-underline text-[0.74rem] hover:!underline ${buttonFocusRing}`,
  profileJoinedMeta:
    "m-0 truncate text-[0.72rem] text-[var(--muted)]",
  profileForm:
    "grid min-w-0 grid-cols-1 content-start gap-x-[1rem] gap-y-[0.82rem] min-[900px]:grid-cols-2",
  profileField:
    "flex flex-col gap-[0.32rem] [&>span]:text-[0.72rem] [&>span]:leading-none [&>span]:text-[var(--muted)]",
  profileInput:
    "min-h-[2.78rem] rounded-[0.38rem] border border-[var(--dashboard-border)] bg-[var(--bg)] px-[0.78rem] text-[0.84rem] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2 max-[760px]:min-h-[2.62rem]",
  profileFileInput: "sr-only",
  profileFooter:
    "flex flex-wrap items-center justify-between gap-[0.7rem] border-t border-[var(--dashboard-border)] pt-[1rem]",
  profileActions:
    "inline-flex flex-wrap items-center gap-[0.55rem]",
  profileActionForm: "m-0",
  buttonInlineIcon: "h-[0.88rem] w-[0.88rem] shrink-0",
  profileSaveButton:
    `inline-flex min-h-[2.5rem] cursor-pointer items-center justify-center gap-[0.42rem] rounded-[0.52rem] border border-[var(--dashboard-border)] bg-transparent px-[0.92rem] text-[0.84rem] text-[var(--text)] hover:border-[var(--dashboard-border-strong)] disabled:cursor-not-allowed disabled:opacity-50 ${buttonMotion} ${buttonFocusRing}`,
  profileSignOutButton:
    `inline-flex min-h-[2.5rem] cursor-pointer items-center justify-center gap-[0.42rem] rounded-[0.52rem] border border-[var(--dashboard-border)] bg-transparent px-[0.92rem] text-[0.84rem] text-[var(--text)] hover:border-[var(--dashboard-border-strong)] ${buttonMotion} ${buttonFocusRing}`,
  primaryButton:
    `inline-flex min-h-[2.34rem] cursor-pointer items-center justify-center gap-[0.38rem] rounded-[0.52rem] border border-[var(--dashboard-border)] bg-transparent px-[0.92rem] text-[0.84rem] text-[var(--text)] hover:border-[var(--dashboard-border-strong)] disabled:cursor-not-allowed disabled:opacity-50 max-[760px]:min-h-[2.52rem] ${buttonMotion} ${buttonFocusRing}`,
  secondaryButton:
    `inline-flex min-h-[2.34rem] cursor-pointer items-center justify-center gap-[0.38rem] rounded-[0.52rem] border border-[var(--dashboard-border)] bg-transparent px-[0.92rem] text-[0.84rem] text-[var(--text)] hover:border-[var(--dashboard-border-strong)] disabled:cursor-not-allowed disabled:opacity-50 max-[760px]:min-h-[2.52rem] ${buttonMotion} ${buttonFocusRing}`,
  avatarModalOverlay:
    `dashboard-theme-scope fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[color-mix(in_srgb,var(--bg)_12%,transparent)] px-[0.78rem] py-[calc(0.78rem+env(safe-area-inset-bottom))] backdrop-blur-[8px] animate-[dashboard-modal-backdrop_180ms_cubic-bezier(0.2,0.7,0.2,1)_both] data-[closing=true]:animate-[dashboard-modal-backdrop-exit_160ms_cubic-bezier(0.4,0,1,1)_both] min-[720px]:p-[1rem] ${dashboardBorder}`,
  avatarModal:
    "my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-[46rem] flex-col gap-[1rem] overflow-y-auto rounded-[0.56rem] border border-[var(--dashboard-border)] bg-[var(--bg)] p-[1.1rem] shadow-[0_14px_32px_color-mix(in_srgb,var(--text)_10%,transparent)] animate-[dashboard-modal-panel_220ms_cubic-bezier(0.2,0.7,0.2,1)_both] data-[closing=true]:animate-[dashboard-modal-panel-exit_160ms_cubic-bezier(0.4,0,1,1)_both] max-[520px]:p-[0.82rem]",
  avatarModalHead:
    "flex items-center justify-between gap-[0.75rem]",
  avatarModalTitle:
    "m-0 text-[1.18rem] leading-[1.15] font-[560] text-[var(--text)]",
  avatarModalClose:
    `inline-flex h-[2.05rem] w-[2.05rem] shrink-0 cursor-pointer items-center justify-center rounded-[0.45rem] border border-[var(--dashboard-border)] bg-transparent text-[var(--text)] hover:border-[var(--dashboard-border-strong)] ${buttonMotion} ${buttonFocusRing}`,
  avatarModalPreviewWrap:
    "grid items-start gap-[1rem] min-[720px]:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]",
  avatarCropFrame:
    "relative aspect-square w-full touch-none overflow-hidden rounded-[0.58rem] border border-[var(--dashboard-border)] bg-[var(--calendar-active-bg)] cursor-grab active:cursor-grabbing",
  avatarCropImage:
    "pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none",
  avatarCropEmpty:
    "flex h-full w-full items-center justify-center text-[0.78rem] text-[var(--muted)]",
  avatarCropControls:
    "flex min-w-0 flex-col gap-[0.78rem]",
  avatarCropField:
    "flex flex-col gap-[0.38rem] text-[0.78rem] text-[var(--muted)] [&>input]:accent-[var(--text)]",
  avatarCropActions:
    "grid grid-cols-1 gap-[0.5rem] min-[520px]:grid-cols-2",
  avatarModalButton:
    `inline-flex min-h-[2.5rem] cursor-pointer items-center justify-center gap-[0.42rem] rounded-[0.52rem] border border-[var(--dashboard-border)] bg-transparent px-[0.92rem] text-[0.84rem] text-[var(--text)] hover:border-[var(--dashboard-border-strong)] disabled:cursor-not-allowed disabled:opacity-50 ${buttonMotion} ${buttonFocusRing}`,
  avatarModalFooter:
    "flex flex-col gap-[0.5rem] pt-[0.1rem] min-[520px]:flex-row min-[520px]:justify-end",
  empty: "m-[0.68rem_0_0] text-[0.84rem] text-[var(--muted)]",
  skeletonBlock:
    "block rounded-[0.42rem] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--text)_7%,transparent),color-mix(in_srgb,var(--text)_15%,transparent),color-mix(in_srgb,var(--text)_7%,transparent))] bg-[length:220%_100%] animate-[dashboard-skeleton_1.25s_ease-in-out_infinite]",
  skeletonPanel: `${dashboardSurface} flex flex-col gap-[0.82rem] p-[0.82rem]`,
  skeletonPanelHead:
    "flex items-center justify-between gap-[0.7rem] max-[760px]:flex-col max-[760px]:items-stretch",
  skeletonKpiCard:
    `${dashboardSurface} flex min-h-[4.95rem] flex-col justify-between gap-[0.28rem] px-[0.7rem] py-[0.62rem]`,
  skeletonMetricList: "flex flex-col gap-[0.42rem]",
  skeletonTimeline: "mt-[0.66rem] flex flex-col gap-[0.42rem]",
  skeletonSplitLayout:
    "grid grid-cols-[minmax(0,1fr)_minmax(20rem,0.66fr)] gap-[0.9rem] max-[1020px]:grid-cols-1",
  skeletonSplitGrid:
    "grid grid-cols-1 gap-[0.62rem] min-[620px]:grid-cols-2 min-[1200px]:grid-cols-3",
} as const;
