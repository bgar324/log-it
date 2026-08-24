import {
  actionDanger,
  actionFilled,
  actionIcon,
  actionIconFilled,
  actionIconQuiet,
  actionMenuRow,
  actionNavRow,
  actionOutline,
  actionQuiet,
} from "@/app/components/action.styles";

// One hairline, one value. The old `--dashboard-border-strong` companion existed
// only to thicken a border on hover or when active; state now reads as a fill
// tint, so nothing consumes it.
const dashboardBorder =
  "[--dashboard-border:color-mix(in_srgb,var(--text)_12%,transparent)]";
const dashboardSurface =
  "rounded-[0.54rem] border border-[var(--dashboard-border)] bg-transparent shadow-none";
const buttonMotion =
  "transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-[1px]";

// Every button-like key below is a constant from `app/components/action.styles`
// plus layout-only extras (width, order, overflow, positioning). Radius, height,
// font size and border weight live in the canon and nowhere else, so no two
// buttons in this app can disagree about them.
//
// A collapsed or otherwise variant state SELECTS A DIFFERENT KEY rather than
// appending a modifier: Tailwind emits each utility family in its own fixed
// order, so `px-0`, `w-[2.75rem]` and `gap-0` all lose to the values a canon
// variant already set. Only `hover:`, `data-[]:` and `min-[]:` prefixed
// utilities are safe to append.
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
    `${actionIconQuiet} hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)]`,
  sidebarCollapsedLogoToggle:
    `group relative ${actionIcon} hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)]`,
  sidebarCollapsedLogo:
    "absolute inset-0 flex items-center justify-center opacity-100 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-90 group-hover:opacity-0",
  sidebarCollapsedToggleIconWrap:
    "absolute inset-0 flex scale-110 items-center justify-center opacity-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-100 group-hover:opacity-100",
  sidebarToggleIcon: "h-[1rem] w-[1rem]",
  brand: "text-[2.2rem] leading-[0.92] tracking-[-0.03em] font-[520]",
  sideNav: "flex flex-col gap-[0.28rem]",
  sideNavCollapsed: "items-center",
  // Current page reads as a fill tint plus a colour, never as a heavier border.
  navButton: `${actionNavRow} overflow-hidden`,
  navButtonCollapsed:
    `${actionIconQuiet} hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)] data-[active=true]:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] data-[active=true]:text-[var(--text)]`,
  navIcon: "h-[0.85rem] w-[0.85rem]",
  navLabelCollapsed: "hidden",
  sidebarUtilityStack: "mt-auto flex flex-col gap-[0.52rem]",
  sidebarUtilityStackCollapsed: "items-center",
  // The desktop twin of the phone tab bar's filled `+`, so it is filled here too.
  sidebarAction: `${actionFilled} w-full justify-start overflow-hidden`,
  sidebarActionCollapsed: actionIconFilled,
  sidebarActionIcon: "h-[0.9rem] w-[0.9rem]",
  sidebarDivider: "h-px w-full bg-[var(--dashboard-border)]",
  main:
    "flex w-full min-w-0 flex-1 flex-col bg-[var(--bg)] min-[900px]:h-dvh min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:overscroll-contain [scrollbar-gutter:stable]",
  mainContent:
    "flex min-w-0 flex-1 flex-col gap-[0.86rem] px-[0.96rem] pt-[1rem] pb-[calc(5rem+env(safe-area-inset-bottom))] max-[760px]:px-[0.82rem] min-[900px]:px-[1.18rem] min-[900px]:pt-[1.06rem] min-[900px]:pb-[1.3rem]",

  // Today: sentences, not tiles.
  today: "flex flex-col gap-[0.34rem] pt-[0.3rem]",
  todayGreeting: "m-0 text-[1.05rem] text-[var(--muted)]",
  todayPlan:
    "m-0 text-[clamp(1.75rem,7.6vw,2.35rem)] leading-[1.06] tracking-[-0.03em] font-[540] text-[var(--text)]",
  todayNote: "m-0 text-[0.9375rem] text-[var(--muted)]",
  todayActionRow:
    "mt-[0.72rem] flex flex-col gap-[0.5rem] min-[620px]:flex-row min-[620px]:items-center",
  // `relative` positions the LinkPendingOverlay these render inside.
  todayAction: `${actionFilled} relative`,
  todayQuietAction: `${actionQuiet} relative`,
  todayLogged:
    "m-0 inline-flex min-h-[2.75rem] items-center text-[1rem] text-[color-mix(in_srgb,#21834d_82%,var(--text))]",
  statLine: "m-0 text-[0.9375rem] text-[var(--text)]",
  statLineMuted: "m-[0.1rem_0_0] text-[0.875rem] text-[var(--muted)]",
  sectionHead: "flex items-baseline justify-between gap-[0.6rem]",
  sectionTitle: "m-0 text-[1.0625rem] tracking-[-0.02em] font-[520] text-[var(--text)]",
  settingRow:
    "m-0 flex min-h-[3.25rem] flex-wrap items-center justify-between gap-[0.75rem] [&_.theme-toggle-option]:min-h-[2.75rem] [&_.theme-toggle-option]:min-w-[2.75rem]",
  settingLabel: "text-[1rem] text-[var(--text)]",
  settingSelect:
    "min-h-[2.75rem] min-w-[10rem] cursor-pointer rounded-[0.52rem] border border-[var(--dashboard-border)] bg-[var(--bg)] px-[0.8rem] text-[1rem] text-[var(--text)] disabled:cursor-progress",
  panel: `${dashboardSurface} p-[0.82rem]`,
  plainSection: "min-h-0 p-0",
  panelHead:
    "flex items-center justify-between gap-[0.5rem] max-[760px]:flex-wrap max-[760px]:items-stretch",
  panelTitle: "m-0 text-[1rem] tracking-[-0.03em] font-[560]",
  panelSubtitle: "m-[0.2rem_0_0.8rem] text-[0.72rem] text-[var(--muted)]",
  // Search owns the panel's full width; the sort select and the count share the
  // line directly above the list so the ordering names what you are looking at.
  searchInput:
    "mt-[0.6rem] h-[2.75rem] w-full rounded-[0.52rem] border border-[var(--dashboard-border)] bg-[var(--bg)] px-[0.74rem] text-base text-[var(--text)] placeholder:text-[color-mix(in_srgb,var(--muted)_82%,transparent)]",
  exerciseListMeta:
    "mt-[0.6rem] flex flex-wrap items-center justify-between gap-[0.5rem]",
  exerciseCount: "m-0 text-[0.84rem] text-[var(--muted)]",
  exerciseSortSelect:
    "min-h-[2.75rem] cursor-pointer rounded-[0.52rem] border border-[var(--dashboard-border)] bg-[var(--bg)] pl-[0.7rem] text-[0.9375rem] text-[var(--text)] min-[760px]:min-h-[2.2rem] min-[760px]:text-[0.84rem]",
  // The reveal needs more air than the row gap, or it reads as one more row.
  listRevealButton: actionOutline,
  // Arrows pinned to the edges with the position between them: a thumb reaches
  // either end without moving, and the range says where you are so two bare
  // chevrons are not the only feedback.
  pagerRow: "mt-[0.72rem] flex items-center justify-between gap-[0.5rem]",
  pagerButton: `${actionIconQuiet} disabled:opacity-40`,
  pagerIcon: "h-[1.05rem] w-[1.05rem] shrink-0 stroke-current",
  pagerRange: "tabular-nums text-[0.8125rem] text-[var(--muted)]",

  // Today's plan, exercise by exercise: what it asks for on the left, what you
  // hit last time on the right. Borderless with a hairline between, because ten
  // bordered rows inside a bordered panel is a second frame around every row.
  sessionList: "mt-[0.5rem] flex flex-col",
  sessionRow:
    "flex min-w-0 items-baseline justify-between gap-[0.75rem] border-b border-[var(--dashboard-border)] py-[0.62rem] last:border-b-0 last:pb-0",
  sessionRowMain: "flex min-w-0 flex-col gap-[0.12rem]",
  sessionRowStats: "flex shrink-0 flex-col items-end gap-[0.12rem] text-right",
  sessionRowTopSet:
    "m-0 text-[0.9375rem] text-[var(--text)] [font-variant-numeric:tabular-nums]",
  metricList:
    "mt-[0.66rem] flex flex-col gap-[0.36rem] overflow-x-visible min-[761px]:overflow-x-auto min-[761px]:[scrollbar-width:thin]",
  metricHeader:
    "grid w-[max(100%,34rem)] items-center gap-[0.44rem] px-[0.6rem] max-[760px]:hidden",
  metricHeaderCell:
    "whitespace-nowrap text-[0.65rem] font-medium text-[var(--muted)]",
  metricHeaderPrimary: "pl-[0.06rem]",
  metricRow:
    "grid w-full min-w-0 items-center gap-[0.44rem] rounded-[0.5rem] border border-[var(--dashboard-border)] bg-transparent p-[0.58rem] text-[0.84rem] min-[761px]:w-[max(100%,34rem)] max-[760px]:min-h-[2.75rem] max-[760px]:gap-x-[0.48rem] max-[760px]:gap-y-[0.12rem] max-[760px]:px-[0.56rem] max-[760px]:py-[0.6rem] max-[760px]:text-[0.9rem]",
  // A row-shaped <Link>, not a button: it keeps the row's own geometry.
  clickableMetricRow:
    `cursor-pointer text-inherit no-underline hover:translate-y-0 ${buttonMotion}`,
  metricMobileLabel:
    "min-w-0",
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
  // Filters on: a fill tint, not a stronger ring.
  workoutFilterToggle:
    `${actionIcon} data-[active=true]:bg-[color-mix(in_srgb,var(--text)_8%,transparent)]`,
  workoutFilterToggleIcon: "h-[0.92rem] w-[0.92rem]",
  workoutFilterPopover:
    `${dashboardBorder} ${dashboardSurface} z-50 flex w-[min(35rem,calc(100vw-1.64rem))] max-w-[calc(100vw-1.64rem)] flex-col gap-[0.72rem] !bg-[var(--bg)] p-[0.82rem] shadow-[0_14px_32px_color-mix(in_srgb,#000_12%,transparent)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out max-[760px]:max-h-[min(34rem,calc(100dvh-1.64rem))] max-[760px]:overflow-y-auto`,
  workoutFilterGrid:
    "grid grid-cols-1 gap-[0.62rem] min-[620px]:grid-cols-2 min-[1080px]:grid-cols-4",
  workoutFilterField:
    "flex min-w-0 flex-col gap-[0.28rem] text-[0.72rem] text-[var(--muted)]",
  workoutFilterInput:
    "min-h-[2.5rem] min-w-0 rounded-[0.42rem] border border-[var(--dashboard-border)] bg-[var(--bg)] px-[0.72rem] text-[0.84rem] text-[var(--text)] outline-none max-[760px]:min-h-[2.75rem] max-[760px]:text-base",
  workoutFilterFooter:
    "flex flex-wrap items-center justify-between gap-[0.55rem] border-t border-[var(--dashboard-border)] pt-[0.68rem] max-[420px]:items-stretch",
  workoutFilterMeta:
    "m-0 text-[0.72rem] text-[var(--muted)]",
  workoutFilterReset: `${actionOutline} max-[420px]:w-full`,
  retryButton: actionOutline,
  timeline: "mt-[0.66rem] flex flex-col gap-[0.9rem]",
  monthSection: "flex flex-col gap-[0.42rem]",
  monthTitle:
    "m-0 text-[0.72rem] text-[var(--muted)]",
  chartGrid:
    "grid grid-cols-1 gap-[0.56rem] min-[900px]:grid-cols-2",
  chartPanel: `${dashboardSurface} p-[0.82rem]`,
  chartFrame: "mt-[0.52rem] h-[15rem] w-full",
  nutritionForm:
    "grid grid-cols-2 gap-[0.52rem] min-[760px]:grid-cols-4 max-[420px]:grid-cols-1",
  nutritionField:
    "flex min-w-0 flex-col gap-[0.28rem] text-[0.7rem] text-[var(--muted)]",
  nutritionInput:
    "min-h-[2.6rem] min-w-0 rounded-[0.42rem] border border-[var(--dashboard-border)] bg-[var(--bg)] px-[0.72rem] text-[0.9rem] text-[var(--text)] outline-none max-[760px]:min-h-[2.75rem] max-[760px]:text-base",
  nutritionFormActions:
    "mt-[0.72rem] flex justify-end max-[520px]:mt-[0.62rem]",
  nutritionSaveButton: `${actionFilled} max-[520px]:w-full`,
  nutritionButtonIcon:
    "h-[0.86rem] w-[0.86rem] shrink-0 stroke-current",
  // "I don't know the numbers" is solved by not asking twice: these rows replay
  // a day the user already logged into the form below.
  nutritionRecall: "mt-[0.66rem] flex flex-col gap-[0.14rem]",
  nutritionRecallRow:
    `${actionMenuRow} data-[active=true]:bg-[color-mix(in_srgb,var(--text)_8%,transparent)]`,
  nutritionRecallLabel: "min-w-0 flex-1 truncate",
  nutritionRecallStat: "shrink-0 tabular-nums text-[0.84rem] text-[var(--muted)]",
  nutritionChartHead:
    "flex flex-wrap items-center justify-between gap-[0.55rem] max-[520px]:items-stretch",
  // The track is a pill because its segments are: a 0.68rem track around 999px
  // buttons clips their corners.
  nutritionSegments:
    "relative inline-grid grid-cols-3 rounded-[999px] border border-[var(--dashboard-border)] p-[0.08rem] max-[520px]:w-full",
  // Selected is a fill tint plus a colour. Nothing gains a border.
  nutritionSegmentButton:
    `${actionQuiet} data-[active=true]:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] data-[active=true]:text-[var(--text)]`,
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
  profileIdentity:
    "flex items-center gap-[0.9rem] pt-[0.2rem]",
  profileIdentityText: "min-w-0 flex-1",
  profileName:
    "m-0 truncate text-[1.35rem] leading-[1.15] tracking-[-0.02em] font-[560] text-[var(--text)]",
  profileMeta: "m-[0.2rem_0_0] truncate text-[0.9375rem] text-[var(--muted)]",
  profileNameRow: "flex min-w-0 items-center gap-[0.35rem]",
  profileEditButton: actionIconQuiet,
  dangerZone:
    "flex flex-col items-start gap-[0.5rem] rounded-[0.54rem] border border-[color-mix(in_srgb,#b13d48_42%,transparent)] bg-[color-mix(in_srgb,#b13d48_9%,var(--bg))] p-[0.95rem]",
  dangerZoneTitle:
    "m-0 text-[1.0625rem] tracking-[-0.02em] font-[540] text-[color-mix(in_srgb,#b13d48_88%,var(--text))]",
  dangerZoneText: "m-0 text-[0.9375rem] leading-[1.45] text-[var(--muted)]",
  profilePhotoButton:
    "relative flex h-[4.5rem] w-[4.5rem] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[999px] border border-[var(--dashboard-border)] bg-[var(--calendar-active-bg)] bg-cover bg-center text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60 [&>svg]:h-[1.3rem] [&>svg]:w-[1.3rem]",
  // The label rides on the photo the way social apps do it, clipped by the
  // circle's own overflow. A caption underneath cost a row of layout and read
  // as a separate control; this reads as part of the picture.
  profilePhotoSliver:
    "absolute inset-x-0 bottom-0 bg-[color-mix(in_srgb,#000_58%,transparent)] py-[0.2rem] text-center text-[0.6875rem] leading-none text-[#f1f0eb]",
  profileField:
    "flex flex-col gap-[0.32rem] [&>span]:text-[0.72rem] [&>span]:leading-none [&>span]:text-[var(--muted)]",
  profileInput:
    "min-h-[2.78rem] rounded-[0.38rem] border border-[var(--dashboard-border)] bg-[var(--bg)] px-[0.78rem] text-[0.84rem] text-[var(--text)] max-[760px]:min-h-[2.75rem] max-[760px]:text-base",
  profileFileInput: "hidden",
  buttonInlineIcon: "h-[0.88rem] w-[0.88rem] shrink-0",
  profileSaveButton: actionFilled,
  dialogCancelButton: actionOutline,
  profileDeleteButton: `${actionDanger} ml-auto`,
  // Account rows: label, current value, and an action that opens an inline
  // form. No nested cards, no always-open forms.
  accountRow:
    "flex min-h-[3.25rem] flex-wrap items-center gap-x-[0.75rem] gap-y-[0.2rem] border-b border-[var(--dashboard-border)] py-[0.55rem] last:border-b-0",
  accountRowLabel: "min-w-0 flex-1 text-[1rem] text-[var(--text)]",
  accountRowValue: "min-w-0 truncate text-[0.9375rem] text-[var(--muted)]",
  accountRowAction: actionQuiet,
  accountDisclosure:
    "flex flex-col gap-[0.72rem] pb-[0.9rem] pt-[0.2rem] [&>button]:self-start",
  dangerTitle:
    "m-0 text-[1.18rem] leading-[1.15] tracking-[-0.03em] font-[560] text-[color-mix(in_srgb,#b13d48_82%,var(--text))]",
  deleteModalText: "m-0 text-[0.82rem] leading-[1.5] text-[var(--muted)]",
  deleteModalStrong: "text-[var(--text)] font-[560]",
  dangerButton: actionDanger,
  avatarModalOverlay:
    `dashboard-theme-scope fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[color-mix(in_srgb,var(--bg)_12%,transparent)] px-[0.78rem] py-[calc(0.78rem+env(safe-area-inset-bottom))] backdrop-blur-[8px] animate-[dashboard-modal-backdrop_180ms_cubic-bezier(0.2,0.7,0.2,1)_both] data-[closing=true]:animate-[dashboard-modal-backdrop-exit_160ms_cubic-bezier(0.4,0,1,1)_both] min-[720px]:p-[1rem] ${dashboardBorder}`,
  // On a phone every child stacks into one column with the buttons, so the
  // panel gap is the same 0.5rem step; roomier only once there is width for it.
  avatarModal:
    "my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-[46rem] flex-col gap-[1rem] overflow-y-auto rounded-[0.56rem] border border-[var(--dashboard-border)] bg-[var(--bg)] p-[1.1rem] shadow-[0_14px_32px_color-mix(in_srgb,var(--text)_10%,transparent)] animate-[dashboard-modal-panel_220ms_cubic-bezier(0.2,0.7,0.2,1)_both] data-[closing=true]:animate-[dashboard-modal-panel-exit_160ms_cubic-bezier(0.4,0,1,1)_both] max-[520px]:gap-[0.5rem] max-[520px]:p-[0.82rem]",
  avatarModalHead:
    "flex items-center justify-between gap-[0.75rem]",
  avatarModalTitle:
    "m-0 text-[1.18rem] leading-[1.15] font-[560] text-[var(--text)]",
  avatarModalClose: actionIconQuiet,
  avatarModalPreviewWrap:
    "grid items-start gap-[1rem] max-[520px]:gap-[0.5rem] min-[720px]:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]",
  avatarCropFrame:
    "relative aspect-square w-full touch-none overflow-hidden rounded-[0.58rem] border border-[var(--dashboard-border)] bg-[var(--calendar-active-bg)] cursor-grab active:cursor-grabbing",
  avatarCropImage:
    "pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none",
  avatarCropEmpty:
    "flex h-full w-full items-center justify-center text-[0.78rem] text-[var(--muted)]",
  avatarCropControls:
    "flex min-w-0 flex-col gap-[0.5rem]",
  avatarCropField:
    "flex flex-col gap-[0.38rem] text-[0.78rem] text-[var(--muted)] [&>input]:accent-[var(--text)]",
  avatarCropActions:
    "grid grid-cols-1 gap-[0.5rem] min-[520px]:grid-cols-2",
  // Three roles, three treatments: the modal's one primary, its secondaries,
  // and the destructive one. They used to be byte-identical.
  avatarModalApply: actionFilled,
  avatarModalButton: actionOutline,
  avatarModalRemove: actionDanger,
  // No top padding: on a phone the four buttons are one stack, so the gap here
  // has to be the same 0.5rem the groups use, not that plus a stray pad.
  avatarModalFooter:
    "flex flex-col gap-[0.5rem] min-[520px]:flex-row min-[520px]:justify-end",
  empty: "m-[0.68rem_0_0] text-[0.84rem] text-[var(--muted)]",
  skeletonBlock:
    "block rounded-[0.42rem] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--text)_7%,transparent),color-mix(in_srgb,var(--text)_15%,transparent),color-mix(in_srgb,var(--text)_7%,transparent))] bg-[length:220%_100%] animate-[dashboard-skeleton_1.25s_ease-in-out_infinite]",
} as const;
