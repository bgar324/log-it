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
    `dashboard-theme-scope flex min-h-dvh bg-[var(--bg)] ${dashboardBorder} min-[900px]:grid min-[900px]:h-dvh min-[900px]:grid-cols-[12.4rem_minmax(0,1fr)] min-[900px]:overflow-hidden`,
  sidebar:
    "hidden min-[900px]:sticky min-[900px]:top-0 min-[900px]:flex min-[900px]:h-dvh min-[900px]:min-h-0 min-[900px]:self-start min-[900px]:flex-col min-[900px]:gap-[1rem] min-[900px]:border-r min-[900px]:border-[var(--dashboard-border)] min-[900px]:bg-transparent min-[900px]:px-[0.68rem] min-[900px]:py-[1.08rem]",
  brand: "text-[2.2rem] leading-[0.92] tracking-[-0.03em] font-[520]",
  sideNav: "flex flex-col gap-[0.28rem]",
  navButton:
    `inline-flex min-h-[2.36rem] cursor-pointer items-center gap-[0.55rem] rounded-[0.5rem] border border-transparent bg-transparent px-[0.72rem] text-left text-[0.84rem] text-[var(--muted)] hover:border-[var(--dashboard-border)] hover:text-[var(--text)] data-[active=true]:border-[var(--dashboard-border-strong)] data-[active=true]:text-[var(--text)] ${buttonMotion} ${buttonFocusRing}`,
  navIcon: "h-[0.85rem] w-[0.85rem]",
  sidebarUtilityStack: "mt-auto flex flex-col gap-[0.52rem]",
  sidebarAction:
    `inline-flex min-h-[2.42rem] cursor-pointer items-center gap-[0.55rem] rounded-[0.52rem] border border-[var(--dashboard-border)] bg-transparent px-[0.72rem] text-left text-[0.84rem] text-[var(--text)] hover:border-[var(--dashboard-border-strong)] ${buttonMotion} ${buttonFocusRing}`,
  sidebarActionDisabled:
    "cursor-default border-[var(--calendar-active-border)] bg-[var(--calendar-active-bg)] text-[var(--muted)] hover:border-[var(--calendar-active-border)] active:translate-y-0",
  sidebarActionIcon: "h-[0.9rem] w-[0.9rem]",
  sidebarDivider: "h-px w-full bg-[var(--dashboard-border)]",
  sidebarSecondaryAction:
    `inline-flex min-h-[2.36rem] cursor-pointer items-center gap-[0.55rem] rounded-[0.5rem] border border-transparent bg-transparent px-[0.72rem] text-left text-[0.84rem] text-[var(--muted)] hover:border-[var(--dashboard-border)] hover:text-[var(--text)] data-[active=true]:border-[var(--dashboard-border-strong)] data-[active=true]:text-[var(--text)] ${buttonMotion} ${buttonFocusRing}`,
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
    `dashboard-kpi-action-card cursor-pointer items-start justify-center gap-[0.42rem] border-dashed text-[var(--text)] no-underline hover:border-[var(--dashboard-border-strong)] max-[760px]:gap-[0.28rem] ${buttonMotion} ${buttonFocusRing}`,
  kpiActionCardDisabled:
    "cursor-default border-[var(--calendar-active-border)] bg-[var(--calendar-active-bg)] text-[var(--muted)] hover:border-[var(--calendar-active-border)]",
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
  plainSection: "p-0",
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
    `inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-[0.42rem] border border-[var(--dashboard-border)] px-[0.56rem] py-[0.2rem] text-[0.72rem] text-[var(--text)] hover:border-[var(--dashboard-border-strong)] ${buttonMotion} ${buttonFocusRing}`,
  metricList:
    "mt-[0.66rem] flex flex-col gap-[0.36rem] overflow-x-auto [scrollbar-width:thin]",
  paginationRow:
    "mt-[0.58rem] flex flex-wrap items-center justify-between gap-[0.5rem]",
  paginationMeta: "m-0 text-[0.72rem] text-[var(--muted)]",
  paginationControls: "inline-flex items-center gap-[0.3rem]",
  paginationButton:
    `min-h-[1.9rem] cursor-pointer rounded-[0.5rem] border border-[var(--dashboard-border)] bg-transparent px-[0.62rem] text-[0.72rem] text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-[0.38] hover:enabled:border-[var(--dashboard-border-strong)] max-[760px]:min-h-[2.12rem] ${buttonMotion} ${buttonFocusRing}`,
  paginationPage:
    "text-[0.72rem] text-[var(--muted)]",
  metricHeader:
    "grid w-[max(100%,34rem)] items-center gap-[0.44rem] px-[0.6rem] max-[760px]:w-[max(100%,30rem)]",
  metricHeaderCell:
    "whitespace-nowrap text-[0.65rem] font-medium text-[var(--muted)]",
  metricHeaderPrimary: "pl-[0.06rem]",
  metricRow:
    "grid w-[max(100%,34rem)] items-center gap-[0.44rem] rounded-[0.5rem] border border-[var(--dashboard-border)] bg-transparent p-[0.58rem] text-[0.84rem] transition-[border-color,background-color] duration-150 hover:border-[var(--dashboard-border-strong)] max-[760px]:w-[max(100%,30rem)]",
  clickableMetricRow:
    `cursor-pointer text-inherit no-underline hover:translate-y-0 ${buttonFocusRing} ${buttonMotion}`,
  personalBestRow:
    "grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)_minmax(0,1fr)] w-[max(100%,24rem)] max-[760px]:w-[max(100%,22rem)]",
  exerciseRow:
    "grid-cols-[minmax(0,1.95fr)_repeat(4,minmax(0,0.9fr))] w-[max(100%,36rem)]",
  workoutHistoryRow:
    "grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)_minmax(0,0.9fr)_minmax(0,0.85fr)_minmax(0,1fr)] w-[max(100%,40rem)]",
  metricMain: "m-0 text-[0.84rem] leading-[1.3] font-[520] text-[var(--text)]",
  metricSubtle: "m-[0.18rem_0_0] text-[0.72rem] text-[var(--muted)]",
  workoutFilterToggle:
    `relative inline-flex h-[1.95rem] w-[1.95rem] cursor-pointer items-center justify-center rounded-full border border-[var(--dashboard-border)] bg-[var(--toggle-bg)] text-[var(--text)] data-[active=true]:border-[var(--dashboard-border-strong)] data-[active=true]:bg-[var(--toggle-active-bg)] data-[active=true]:text-[var(--toggle-active-icon)] ${buttonMotion} ${buttonFocusRing}`,
  workoutFilterToggleIcon: "h-[0.92rem] w-[0.92rem]",
  workoutFilterPopover:
    `${dashboardBorder} ${dashboardSurface} z-50 flex w-[min(35rem,calc(100vw-1.64rem))] max-w-[calc(100vw-1.64rem)] flex-col gap-[0.72rem] !bg-[var(--bg)] p-[0.82rem] shadow-[0_18px_44px_color-mix(in_srgb,#000_14%,transparent)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out max-[760px]:max-h-[min(34rem,calc(100dvh-1.64rem))] max-[760px]:overflow-y-auto`,
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
  profilePanel:
    "mx-auto w-full max-w-[78rem]",
  profileBody:
    "grid grid-cols-[15.5rem_minmax(0,1fr)] gap-[1.08rem] max-[900px]:grid-cols-1",
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
    "fixed inset-0 z-[80] flex items-end justify-center bg-[color-mix(in_srgb,#000_36%,transparent)] px-[0.78rem] pt-[0.78rem] pb-[calc(0.78rem+env(safe-area-inset-bottom))] min-[720px]:items-center min-[720px]:p-[1rem]",
  avatarModal:
    "flex w-full max-w-[46rem] flex-col gap-[1rem] rounded-[0.72rem] border border-[var(--dashboard-border)] bg-[var(--bg)] p-[1.1rem] shadow-[0_18px_44px_color-mix(in_srgb,#000_24%,transparent)] max-[520px]:p-[0.82rem]",
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
  skeletonWorkoutFilterGrid:
    "grid grid-cols-1 gap-[0.62rem] min-[620px]:grid-cols-2 min-[1080px]:grid-cols-4",
  skeletonTimeline: "mt-[0.66rem] flex flex-col gap-[0.42rem]",
  skeletonSplitLayout:
    "grid grid-cols-[minmax(0,1fr)_minmax(20rem,0.66fr)] gap-[0.9rem] max-[1020px]:grid-cols-1",
  skeletonSplitGrid:
    "grid grid-cols-1 gap-[0.62rem] min-[620px]:grid-cols-2 min-[1200px]:grid-cols-3",
} as const;
