import {
  actionDanger,
  actionFilled,
  actionIcon,
  actionIconQuiet,
  actionIconDanger,
  actionMenuRowDanger,
  actionNavRow,
  actionOutline,
  actionQuiet,
} from "@/app/components/action.styles";
import { fieldBoxed, fieldUnderline } from "@/app/components/field.styles";
import { daySelectorStyles } from "@/app/components/day-selector.styles";
import { cn } from "../classnames";


// The logger's one grouping surface: 24px radius, hairline, raised fill. Every
// panel on the screen is this material, so nothing reads as a second system.
const panelSurface = cn(
  "rounded-[var(--app-radius)] border border-[color:var(--app-line)]",
  "bg-[var(--app-surface-raised)]",
);

export const styles = {
  // Reserve both floating rows so the last inputs and guidance can clear them.
  loggerShell: cn(
    "flex min-h-dvh justify-center px-[1rem] pt-[0.85rem] max-[380px]:px-[0.85rem]",
    "pb-[calc(10rem+env(safe-area-inset-bottom))]",
    "min-[620px]:px-[1.5rem] min-[620px]:pt-[1.4rem]",
  ),
  // Narrower than the browsing screens on purpose: one exercise at a time is a
  // task, and a task column that runs the full desktop width stops being one.
  loggerStage: cn(
    "flex w-full max-w-[36rem] flex-col gap-[0.75rem]",
    "min-[620px]:max-w-[42rem] min-[620px]:gap-[1rem]",
  ),
  // Header scrolls normally; workout actions remain reachable at the bottom.
  topRow: "flex items-center justify-between gap-[0.6rem] pb-[0.35rem]",
  // Deliberate canon exception: Back is the quietest control on the screen, so
  // it takes the muted variant with no hairline. Pulled left by exactly the
  // quiet variant's own padding, so the label lines up with the title below it.
  backLink: `${actionQuiet} -ml-[1rem]`,
  backButtonIcon: "h-[0.88rem] w-[0.88rem] shrink-0 stroke-current",
  header: "flex flex-col gap-[0.3rem] [touch-action:pan-y_pinch-zoom]",
  headerMetaRow: "flex min-w-0 flex-wrap items-center gap-2 text-[0.8125rem] text-[var(--muted)]",
  headerMetaButton: "min-h-11 min-w-11 cursor-pointer border-0 bg-transparent p-0 text-left text-inherit [touch-action:manipulation] disabled:cursor-default",
  headerMetaInput: `${fieldBoxed} min-h-11 min-w-0 max-w-full rounded-[14px] px-2 text-base`,
  titleRow: "flex min-w-0 items-center gap-0",
  title:
    "m-0 min-w-0 break-words text-[clamp(1.35rem,5vw,1.75rem)] leading-[1.15] tracking-[-0.03em] font-[500] text-[var(--text)]",
  titleInput: `${fieldUnderline} min-h-11 min-w-0 flex-1 bg-transparent px-0 text-[clamp(1.35rem,5vw,1.75rem)] font-[500] leading-[1.15] tracking-[-0.03em]`,
  titleEditButton: `${actionIconQuiet} shrink-0`,
  form: "flex flex-col gap-[0.75rem] p-[2px] min-[620px]:gap-[1rem]",
  card: cn(panelSurface, "flex flex-col gap-[0.65rem] p-[1rem]"),
  field: "flex flex-col gap-[0.25rem]",

  // Confirmation surfaces share the app's dialog treatment.
  confirmOverlay: cn(
    "fixed inset-0 z-[80] flex items-center justify-center",
    "bg-[color:color-mix(in_srgb,#000_36%,transparent)] px-[0.9rem] py-[0.9rem]",
    "pb-[calc(0.9rem+env(safe-area-inset-bottom))]",
    "min-[620px]:p-[1rem]",
  ),
  // One background utility only: two `bg-*` classes on one element leave which
  // wins up to stylesheet order. The theme's own `.auth-dialog-content` rule
  // carries the radius and the line for every legacy dialog.
  confirmDialog: cn(
    "flex w-full max-w-[26rem] flex-col gap-[0.7rem] p-[1rem]",
    "rounded-[var(--app-radius)] border border-[color:var(--app-line)] bg-[var(--surface)]",
    "shadow-[0_18px_44px_color-mix(in_srgb,#000_22%,transparent)]",
  ),
  confirmTitle:
    "m-0 text-[1.15rem] leading-[1.2] tracking-[-0.02em] font-[560] text-[var(--text)]",
  confirmBody:
    "m-0 text-[0.9375rem] leading-[1.5] text-[color:color-mix(in_srgb,var(--text)_88%,var(--muted))]",
  confirmActions: "grid grid-cols-2 gap-[0.55rem] pt-[0.15rem]",
  confirmSecondaryButton: `${actionOutline} w-full`,
  confirmPrimaryButton: `${actionDanger} w-full`,

  // The identity field: no box, one bottom edge that darkens on focus.
  nameInput: cn(
    fieldUnderline,
    "w-full min-h-[2.75rem] rounded-none px-0 py-[0.45rem]",
    "text-[clamp(1.5rem,6.5vw,1.85rem)] leading-[1.2] tracking-[-0.03em] font-[600]",
  ),

  // One exercise at a time. The pager is the only way position is shown, so it
  // states it in words as well as in the controls around it.
  pagerRow: "pointer-events-none fixed inset-x-5 bottom-[calc(4rem+var(--app-dock-bottom,0.5rem))] z-40 mx-auto flex max-w-[42rem] items-center justify-between gap-2",
  pagerButton: `${daySelectorStyles.arrowButton} pointer-events-auto`,
  pagerJumpTrigger: cn(
    "pointer-events-auto mx-auto flex min-w-0 cursor-pointer items-center justify-center gap-[0.4rem] rounded-full",
    "min-h-11 border-0 bg-[var(--app-surface-raised)] px-4 text-center",
    "[touch-action:manipulation] outline-none",
    "transition-colors duration-[var(--ui-motion-state)] ease-[var(--ui-motion-ease)]",
    "hover:bg-[color-mix(in_srgb,var(--text)_5%,transparent)]",
    "focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]",
  ),
  // Position below the card, not a second copy of the exercise name.
  pagerJumpLabel: cn(
    "min-w-0 truncate text-[0.9375rem] leading-[1.15] font-[500] text-[var(--text)]",
    "[font-variant-numeric:tabular-nums]",
  ),
  pagerJumpCount: "font-[400] text-[var(--muted)]",
  pagerIcon: daySelectorStyles.arrowIcon,
  pagerCaret: "h-[0.85rem] w-[0.85rem] shrink-0 stroke-current text-[var(--muted)]",
  guidance: cn(panelSurface, "flex min-w-0 flex-col gap-3 p-[1.15rem] max-[380px]:p-[0.85rem]"),
  guidanceTable: "w-full table-fixed border-collapse",
  guidanceSetColumn: "w-7",
  guidanceHeading: "pb-3 text-left align-bottom text-[0.8125rem] font-normal leading-[1.4] text-[var(--muted)]",
  guidanceSetNumber: "py-2 text-left align-top text-[0.75rem] font-normal leading-[1.5] tabular-nums text-[var(--muted)]",
  guidanceValue: "py-2 pr-2 text-left align-top text-[0.9375rem] font-medium leading-[1.35] tracking-[-0.015em] tabular-nums text-[var(--text)]",
  guidanceMissing: "text-[var(--muted)]",
  guidanceNote: "m-0 text-[0.75rem] leading-[1.55] text-[var(--muted)]",
  guidanceRetry: `${actionQuiet} -ml-4 self-start`,
  // Direct access to every exercise in the session, in order.
  jumpMenu: cn(
    "z-50 flex max-h-[60vh] w-[min(20rem,84vw)] flex-col gap-[0.1rem] overflow-y-auto",
    "border p-[0.35rem] outline-none",
    "border-[color:var(--app-line)] bg-[var(--app-surface-raised)]",
    "shadow-[0_18px_40px_color-mix(in_srgb,#000_26%,transparent)]",
  ),
  jumpRow: actionNavRow,
  jumpRowIndex:
    "w-[1.25rem] shrink-0 text-left text-[0.75rem] text-[var(--muted)] [font-variant-numeric:tabular-nums]",
  jumpRowName: "min-w-0 flex-1 truncate text-left text-[0.9375rem]",
  jumpRowMeta:
    "shrink-0 text-[0.75rem] text-[var(--muted)] [font-variant-numeric:tabular-nums]",

  exerciseCarousel: "w-full min-w-0 max-w-full [&>.swiper-wrapper]:ease-[var(--ui-motion-ease)]! motion-reduce:[&>.swiper-wrapper]:duration-0!",
  exerciseSlideContent: "m-0 flex min-w-0 flex-col gap-4 border-0 p-0",
  exerciseCard: cn(
    panelSurface,
    "flex flex-col gap-[0.75rem] px-[1.15rem] py-4 max-[380px]:px-[0.85rem]",
  ),
  // Add set sits left; the rest timer, when the account has one, sits opposite
  // it rather than taking a sixth floating circle the 320px row cannot hold.
  cardFooter: "flex items-center justify-between gap-2",
  addSetButton: `${actionQuiet} self-start`,
  restTimerButton: `${actionQuiet} px-[0.75rem]`,
  restTimerClock: "[font-variant-numeric:tabular-nums]",
  // Suggestions anchor to the full name row without moving the sets below it.
  exerciseNameRow: "relative flex items-start gap-[0.4rem]",
  // `PopoverContent` ships no styling, so every caller owns its surface.
  exerciseMenu: cn(
    "z-50 flex w-[13.5rem] flex-col border p-[0.35rem] outline-none",
    "border-[color:var(--app-line)] bg-[var(--app-surface-raised)]",
    "shadow-[0_18px_40px_color-mix(in_srgb,#000_26%,transparent)]",
  ),
  exerciseMenuDangerItem: actionMenuRowDanger,
  icon: "h-4 w-4 shrink-0 stroke-current",
  compareHint: "mt-[-0.1rem] text-[0.9375rem] leading-[1.5] text-[var(--muted)]",
  spinningIcon:
    "h-[1.05rem] w-[1.05rem] shrink-0 stroke-current animate-[spin_0.85s_linear_infinite]",

  // Compact rows keep all touch targets at least 44px tall.
  setsStack: "-ml-3 flex flex-col gap-2 overflow-x-visible py-[2px]",
  setRowGroup: "flex flex-col gap-[0.15rem]",
  swipeSet: "w-full min-w-0 [&>.swiper-wrapper]:items-stretch! [&>.swiper-wrapper]:ease-[var(--ui-motion-ease)]! motion-reduce:[&>.swiper-wrapper]:duration-0!",
  swipeSetContent: "bg-[var(--app-surface-raised)]",
  swipeSetDelete: "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-[#c52b28] p-0 text-white [touch-action:manipulation]",
  setHeader: "text-xs text-[var(--muted)]",
  setRow: cn(
    "grid grid-cols-[2.75rem_minmax(0,1fr)_4rem_3.5rem] items-center gap-[0.36rem] bg-transparent",
    "max-[380px]:grid-cols-[2.75rem_minmax(0,1fr)_3.4rem_2.95rem] max-[380px]:gap-[0.24rem]",
    "min-[620px]:grid-cols-[2.75rem_minmax(6rem,1fr)_minmax(5rem,0.7fr)_minmax(5rem,0.7fr)]",
    "min-[620px]:gap-[0.5rem]",
  ),
  setRowWithoutDuration: cn(
    "grid grid-cols-[2.75rem_minmax(0,1fr)_4.5rem] items-center gap-[0.36rem] bg-transparent",
    "max-[380px]:grid-cols-[2.75rem_minmax(0,1fr)_4.2rem] max-[380px]:gap-[0.24rem]",
    "min-[620px]:grid-cols-[2.75rem_minmax(6rem,1fr)_minmax(5rem,0.7fr)]",
    "min-[620px]:gap-[0.5rem]",
  ),
  setNumber: cn(
    "order-1 m-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-center text-[0.8125rem] font-[500] text-[var(--muted)] [touch-action:manipulation] disabled:cursor-default",
    "[font-variant-numeric:tabular-nums]",
    "min-[620px]:min-w-[1.5rem] min-[620px]:font-normal",
  ),
  setField: "min-w-0 flex flex-col gap-[0.3rem] min-[620px]:gap-0",
  setFieldWeight: "order-2",
  setFieldReps: "order-3",
  setFieldDuration: "order-4",
  setFieldLabel:
    "sr-only",
  setInput: cn(
    fieldBoxed,
    "w-full min-h-[3rem] px-[0.65rem] py-[0.375rem] text-[1.375rem] tabular-nums disabled:opacity-100 data-[compact=true]:text-base",
    "max-[380px]:px-[0.45rem]",
  ),
  setWeightControl: "relative block min-w-0",
  setWeightInputWithBodyweight: "pr-[2.95rem] min-[620px]:pr-[2.6rem]",
  bodyweightButton: cn(
    "absolute bottom-0 right-0 top-0 inline-flex w-[2.75rem] cursor-pointer items-center justify-center rounded-r-[14px] border-l bg-transparent",
    "border-[color:var(--app-line)]",
    "text-[0.75rem] font-[400] text-[var(--muted)] [touch-action:manipulation]",
    "transition-[translate,border-color,background-color,color,box-shadow] duration-[var(--ui-motion-state)] ease-[var(--ui-motion-ease)] active:translate-y-[1px]",
    "hover:text-[var(--text)]",
    "data-[active=true]:bg-[var(--app-accent-soft)] data-[active=true]:text-[var(--text)]",
    "min-[620px]:w-[2.4rem] min-[620px]:text-[0.7rem]",
  ),

  // Independent floating controls; no enclosing bar, scrim, or expandable fan.
  toolsRow: "pointer-events-none fixed inset-x-5 bottom-[var(--app-dock-bottom,max(0.5rem,env(safe-area-inset-bottom)))] z-50 mx-auto flex max-w-[42rem] items-center gap-2 max-[380px]:inset-x-3 max-[380px]:gap-1",
  toolCircle: `${actionIcon} pointer-events-auto bg-[var(--app-surface-raised)] shadow-[0_4px_16px_color-mix(in_srgb,#000_14%,transparent)]`,
  toolDelete: `${actionIconDanger} pointer-events-auto bg-[var(--app-surface-raised)] shadow-[0_4px_16px_color-mix(in_srgb,#000_14%,transparent)]`,
  toolSave: `${actionFilled} pointer-events-auto ml-auto h-11 w-[6.5rem] px-2 shadow-[0_4px_16px_color-mix(in_srgb,#000_14%,transparent)]`,
  toolIcon: "h-5 w-5 shrink-0 stroke-current",

  saveButton: `${actionFilled} w-full`,
} as const;
