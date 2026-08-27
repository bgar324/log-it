// Authenticated app chrome, built as two layers.
//
//   Layer B  the drawer, pinned to the left edge, always mounted, sitting
//            underneath everything as the base layer.
//   Layer A  the app itself (top bar, view, bottom bar). Opaque, on top.
//            Opening the drawer slides layer A to the right to reveal layer B
//            rather than sliding a panel over the app.
//
// Phones only: at min-[900px] the sidebar is the navigation and layer A never
// moves. Open state rides on a `data-drawer` attribute rather than an appended
// class: the open utilities now override base values (opacity, visibility,
// transform) instead of only adding to them, and two utilities from the same
// family win by emission order in the generated stylesheet, not by the order
// they appear in the attribute — an appended `opacity-100` cannot be relied on
// to beat a base `opacity-0`, while a `data-[drawer=open]:` variant wins on
// specificity. Every arbitrary value is spelled out in source somewhere —
// either here or in the constant it is interpolated from — because Tailwind's
// scanner reads source text and cannot see a class value computed at runtime.

import { actionIconQuiet, actionNavRow } from "./action.styles";

// One bottom strip, two owners. With the drawer open, its footer row occupies
// the left of the screen and the tab bar the right, on the same band — so a
// hairline, a height or a safe-area inset that differs by a few pixels reads as
// a broken line. Both sides are built from the fragments below, and the two
// numbers live once, as custom properties, so changing the band changes both
// halves at the same time.
//
// Declared per surface rather than inherited from the stage: a route-loading
// skeleton renders the tab bar on its own, outside the app shell.
const barMetrics = "[--bar-row:3.25rem] [--bar-pad:0.3rem]";
const barHairline = "border-t border-[color-mix(in_srgb,var(--text)_12%,transparent)]";
const barBlockPadding =
  "pt-[var(--bar-pad)] pb-[calc(var(--bar-pad)+env(safe-area-inset-bottom))]";
// The tab bar's height is this row inside `barBlockPadding` and `barHairline`.
const barRowHeight = "min-h-[var(--bar-row)]";
// The same band measured from the outside, for a surface that has to state its
// own height. `border-box` sizing (globals.css sets it on `*`, unlayered, so a
// `box-content` utility cannot override it) means the padding and the 1px
// hairline have to be added back in by hand.
const barBandHeight =
  "min-h-[calc(var(--bar-row)+var(--bar-pad)+var(--bar-pad)+1px+env(safe-area-inset-bottom))]";

// Layer A recedes rather than only moving: while the drawer is open, both of its
// halves — the screen and the tab bar beside it — fog and blur together, so the
// sliver of app left on screen reads as a layer behind instead of a second
// column of half-words competing with the nav. Tinted toward `--bg` like the
// logger's dial scrim, so it fogs in light and smokes in dark.
//
// Always mounted at zero opacity and ramped by the open state, never introduced
// already dimmed: a transition needs a previous frame to start from, so a dim
// that arrives with the open state would snap to full strength across the whole
// screen on the frame the drawer opens and only then slide away.
const layerRecede =
  "after:pointer-events-none after:absolute after:inset-0 after:z-40 after:bg-[color-mix(in_srgb,var(--bg)_65%,transparent)] after:opacity-0 after:transition-opacity after:duration-[280ms] after:ease-[cubic-bezier(0.2,0.7,0.2,1)]";
const layerRecedeOpen =
  "data-[drawer=open]:after:opacity-100 data-[drawer=open]:after:backdrop-blur-[7px]";
// Layer A is pushed aside by exactly the drawer's width, so the two edges meet.
const layerShiftOpen = "data-[drawer=open]:translate-x-[min(17.5rem,78vw)]";

export const navStyles = {
  // `overflow-x: clip` instead of `hidden`: clip does not turn the stage into a
  // scroll container, so document scrolling and the sticky top bar still work.
  stage: "relative min-h-dvh bg-[var(--bg)] [overflow-x:clip]",
  appLayer:
    `relative z-10 min-h-dvh bg-[var(--bg)] transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] ${layerRecede} ${layerRecedeOpen} ${layerShiftOpen} min-[900px]:!translate-x-0 min-[900px]:after:hidden`,
  // Purely a hit target now that the layer owns its own dim: tap anywhere on the
  // app to put it back.
  appLayerScrim:
    "absolute inset-0 z-40 cursor-default border-0 bg-transparent p-0 min-[900px]:hidden",

  // `invisible` is functional, not cosmetic: the closed drawer sits at the left
  // edge underneath layer A, and `visibility: hidden` is what keeps an edge tap
  // from landing on it. Visibility flips instantly rather than transitioning —
  // a discrete transition would leave the layer hidden for the first frames of
  // the slide, and layer A covers it until the slide starts anyway.
  // No bottom padding: the footer row is a flush bottom band that owns the
  // safe-area inset itself, so it can line up with the tab bar beside it.
  //
  // The right border is the seam between the layers. Both surfaces are painted
  // `--bg`, so with the app dimmed to the same colour this hairline is the only
  // thing that separates them. It belongs to the drawer rather than to layer A's
  // overlay because the drawer's edge is the one place the line runs unbroken
  // from the status bar to the bottom of the screen: layer A's overlay stops at
  // the tab bar, which is a stage sibling painted above it.
  drawerLayer:
    "fixed inset-y-0 left-0 z-0 flex w-[min(17.5rem,78vw)] flex-col gap-[1rem] border-r border-[color-mix(in_srgb,var(--text)_12%,transparent)] bg-[var(--bg)] px-[1.05rem] pt-[calc(1.15rem+env(safe-area-inset-top))] invisible -translate-x-[9%] transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] data-[drawer=open]:visible data-[drawer=open]:translate-x-0 min-[900px]:hidden",

  // Tighter left inset than right: the avatar is a circle, so its optical edge
  // sits inside its box and a symmetric gutter reads as too much space.
  topBar:
    "sticky top-0 z-30 flex min-h-[3.5rem] items-center gap-[0.5rem] border-b border-[color-mix(in_srgb,var(--text)_12%,transparent)] bg-[var(--bg)] pl-[0.5rem] pr-[0.82rem] min-[900px]:min-h-[3.75rem] min-[900px]:pl-[0.85rem] min-[900px]:pr-[1.18rem]",
  topBarTitle:
    "min-w-0 flex-1 truncate text-[1.0625rem] font-[540] tracking-[-0.02em] text-[var(--text)] min-[900px]:text-[1.35rem]",
  topBarAccessory: "flex shrink-0 items-center gap-[0.375rem]",

  avatarButton: `${actionIconQuiet} p-0 active:opacity-70 min-[900px]:hidden`,
  avatarImage:
    "h-[2.05rem] w-[2.05rem] rounded-[999px] border border-[color-mix(in_srgb,var(--text)_12%,transparent)] object-cover",
  avatarFallback:
    "inline-flex h-[2.05rem] w-[2.05rem] items-center justify-center rounded-[999px] bg-[color-mix(in_srgb,var(--text)_7%,transparent)] text-[0.8125rem] font-[540] text-[var(--text)]",
  // The bar is a stage sibling, not a layer-A child: a translated ancestor
  // becomes the containing block for fixed descendants, which would resolve
  // `bottom: 0` against the full page height and push the bar off-screen while
  // the drawer is open. It stays viewport-anchored and translates in sync.
  //
  // Being a sibling also puts it above layer A's overlay, so it carries its own
  // copy: same tint, same blur, same ramp. The overlay is an absolutely
  // positioned pseudo-element, so it covers the padding box and not the bar's
  // top hairline — which is what keeps that hairline continuous with the drawer
  // footer's beside it while the bar's contents fade back.
  tabBar:
    `fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 items-center ${barMetrics} ${barHairline} bg-[var(--bg)] px-[0.5rem] ${barBlockPadding} transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] ${layerRecede} ${layerRecedeOpen} ${layerShiftOpen} data-[drawer=open]:pointer-events-none min-[900px]:hidden`,
  // The bar is a fixed-height surface, so the tab keeps the band's own row
  // height and its small label; only the radius joins the canon, since a 0.6rem
  // corner here was the app's one-off.
  tabItem:
    `relative mx-auto inline-flex ${barRowHeight} w-full max-w-[6.5rem] cursor-pointer flex-col items-center justify-center gap-[0.14rem] rounded-[999px] border-0 bg-transparent text-[var(--muted)] no-underline [touch-action:manipulation] transition-colors duration-150 active:bg-[color-mix(in_srgb,var(--text)_7%,transparent)] data-[active=true]:text-[var(--text)]`,
  tabIcon: "h-[1.3rem] w-[1.3rem]",
  tabLabel: "text-[0.6875rem] leading-none tracking-[-0.01em]",
  tabAction:
    "app-filled-action relative mx-auto inline-flex h-[3.1rem] w-[3.1rem] cursor-pointer items-center justify-center rounded-[999px] border-0 [touch-action:manipulation] transition-[transform,opacity] duration-150 active:translate-y-[1px] active:opacity-90",
  tabActionIcon: "h-[1.5rem] w-[1.5rem]",

  drawerIdentity: "flex flex-col gap-[0.5rem]",
  drawerAvatarImage:
    "h-[2.6rem] w-[2.6rem] rounded-[999px] border border-[color-mix(in_srgb,var(--text)_12%,transparent)] object-cover",
  drawerAvatarFallback:
    "inline-flex h-[2.6rem] w-[2.6rem] items-center justify-center rounded-[999px] bg-[color-mix(in_srgb,var(--text)_7%,transparent)] text-[0.95rem] font-[540] text-[var(--text)]",
  drawerName: "m-0 text-[1.0625rem] font-[540] tracking-[-0.01em] text-[var(--text)]",
  drawerHandle: "m-0 text-[0.8125rem] text-[var(--muted)]",

  drawerNav: "flex flex-col gap-[0.1rem]",
  // Canon nav row: muted until it is the current page, current marked by fill
  // plus colour. Never a weight change — that reflows the label as you navigate.
  drawerItem: `${actionNavRow} gap-[0.7rem]`,
  drawerItemIcon: "h-[1.2rem] w-[1.2rem] shrink-0",
  drawerDivider: "h-px w-full bg-[color-mix(in_srgb,var(--text)_12%,transparent)]",
  // The footer row is the drawer's half of the bottom strip: same metrics, same
  // hairline, same block padding and the same band height as the tab bar it sits
  // beside, so the two line up to the pixel and stay aligned on a notched phone.
  // It bleeds past the drawer's gutter so its hairline runs edge to edge and
  // meets the bar's border with no gap.
  drawerFooterRow: `mt-auto -mx-[1.05rem] flex ${barMetrics} ${barBandHeight} items-center gap-[0.35rem] ${barHairline} px-[1.05rem] ${barBlockPadding} [&>a]:min-w-0 [&>a]:flex-1`,
  drawerIconAction: actionIconQuiet,

  mainInset: "pb-[calc(4.9rem+env(safe-area-inset-bottom))] min-[900px]:pb-0",
} as const;
