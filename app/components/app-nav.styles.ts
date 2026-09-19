import { actionIconQuiet } from "./action.styles";

export const navStyles = {
  stage: "relative min-h-dvh bg-[var(--bg)] [overflow-x:clip]",
  topBar: "relative z-30 mx-auto flex w-full max-w-[72rem] flex-col gap-6 px-5 pt-[calc(1rem+env(safe-area-inset-top))] min-[900px]:px-8 min-[900px]:pt-6",
  utilityRow: "flex min-h-11 items-center justify-between gap-4",
  identityLink: "inline-flex size-11 shrink-0 items-center justify-center rounded-full [touch-action:manipulation]",
  headerAvatar: "size-10 rounded-full object-cover ring-1 ring-[var(--app-line)]",
  headerAvatarFallback: "inline-flex size-10 items-center justify-center rounded-full bg-[var(--app-surface-raised)] text-sm font-medium",
  titleRow: "flex min-w-0 items-center justify-between gap-3",
  titleBack: `${actionIconQuiet} -ml-2 shrink-0`,
  topBarTitle: "m-0 min-w-0 flex-1 text-[2.1rem] font-[650] leading-[1.1] tracking-[-0.03em] min-[900px]:text-[2.5rem]",
  topBarAccessory: "flex shrink-0 items-center gap-2",
  utilityButton: `${actionIconQuiet} bg-[var(--app-surface)]`,
  utilityIcon: "size-[1.25rem]",
  // Direct destinations retain 44px targets at 320px without a second row.
  tabBar: "fixed left-5 right-5 bottom-[var(--app-dock-bottom)] z-30 isolate flex items-center overflow-x-auto rounded-full border border-[var(--app-line)] bg-[color-mix(in_srgb,var(--app-surface-raised)_94%,transparent)] p-1 shadow-[0_8px_35px_color-mix(in_srgb,#000_14%,transparent)] backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[900px]:hidden",
  tabIndicator: "pointer-events-none absolute inset-1 bg-[var(--app-accent-soft)] transition-[clip-path,opacity,background-color]! duration-[260ms] ease-[var(--ui-motion-ease)] motion-reduce:transition-none!",
  tabItem: "relative z-10 inline-flex h-12 w-full min-w-11 flex-1 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[var(--muted)] no-underline [touch-action:manipulation] transition-[color,transform] duration-200 active:scale-95 data-[active=true]:text-[var(--text)]",
  tabIcon: "size-[1.35rem]",
  mainInset: "pb-[var(--app-dock-height)] min-[900px]:pb-0",
} as const;
