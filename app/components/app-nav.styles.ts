// Authenticated app chrome, built as two layers.
//
//   Layer B  the drawer, pinned to the left edge, always mounted, sitting
//            underneath everything as the base layer.
//   Layer A  the app itself (top bar, view, bottom bar). Opaque, on top.
//            Opening the drawer slides layer A to the right to reveal layer B
//            rather than sliding a panel over the app, and turns what is left
//            on screen into a card: lit by a light veil and cropped by
//            phone-screen corners.
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

// The veil: one viewport-anchored overlay over the exposed part of layer A. It
// does two things — lifts layer A and draws the seam — and it is a stage sibling
// rather than a pseudo-element on layer A because the bottom bar is a stage
// sibling too: a pseudo-element on the layer paints underneath the bar and
// leaves it bright.
//
//   Veil  `--text` at 9%, so the exposed strip reads *lighter* than the drawer
//         in dark and shaded in light. Tinting toward `--bg` instead only smears
//         the app into the background.
//   Seam  A `border-l` at the canon hairline, on the overlay rather than on the
//         drawer's right edge, so it travels with layer A, fades in with the
//         veil, and runs the full height of the viewport — including across the
//         bottom band, which the bar would otherwise paint over.
//
// Full-bleed on purpose: rounding the exposed edge and insetting it into a card
// was tried and rejected. It cost bands that crop the chrome and a corner curve
// that eats the bottom hairline where it meets the drawer's footer.
//
// Always mounted at zero opacity and ramped by the open state, never introduced
// already lit: a transition needs a previous frame to start from, so a veil
// that arrives with the open state would snap to full strength across the whole
// screen on the frame the drawer opens and only then slide away.
const layerVeil =
  "pointer-events-none fixed inset-0 z-40 border-l border-[color-mix(in_srgb,var(--text)_12%,transparent)] bg-[color-mix(in_srgb,var(--text)_9%,transparent)] opacity-0 transition-[opacity,translate] duration-[280ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]";
// Layer A is pushed aside by exactly the drawer's width, so the two edges meet.
const layerShiftOpen = "data-[drawer=open]:translate-x-[min(17.5rem,78vw)]";

export const navStyles = {
  // `overflow-x: clip` instead of `hidden`: clip does not turn the stage into a
  // scroll container, so document scrolling and the sticky top bar still work.
  stage: "relative min-h-dvh bg-[var(--bg)] [overflow-x:clip]",
  appLayer:
    `relative z-10 min-h-dvh bg-[var(--bg)] transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] ${layerShiftOpen} min-[900px]:!translate-x-0`,
  // The veil and the seam belong to `appVeil`, which is a stage sibling because
  // it has to cover the tab bar too. This is only the hit target: tap anywhere
  // on the exposed app to put it back.
  appLayerScrim:
    "absolute inset-0 z-40 cursor-default border-0 bg-transparent p-0 min-[900px]:hidden",
  appVeil: `${layerVeil} ${layerShiftOpen} data-[drawer=open]:opacity-100 min-[900px]:hidden`,

  // `invisible` is functional, not cosmetic: the closed drawer sits at the left
  // edge underneath layer A, and `visibility: hidden` is what keeps an edge tap
  // from landing on it. Visibility flips instantly rather than transitioning —
  // a discrete transition would leave the layer hidden for the first frames of
  // the slide, and layer A covers it until the slide starts anyway.
  // No bottom padding: the footer row is a flush bottom band that owns the
  // safe-area inset itself, so it can line up with the tab bar beside it.
  drawerLayer:
    "fixed inset-y-0 left-0 z-0 flex w-[min(17.5rem,78vw)] flex-col gap-[1rem] bg-[var(--bg)] px-[1.05rem] pt-[calc(1.15rem+env(safe-area-inset-top))] invisible -translate-x-[9%] transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] data-[drawer=open]:visible data-[drawer=open]:translate-x-0 min-[900px]:hidden",

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
  // It needs no veil of its own: `appCard` is a later sibling at a higher
  // z-index, so the one card covers the bar and the screen together. That is why
  // the veil lives on a stage-level overlay at all — a pseudo-element on layer A
  // paints underneath the bar and leaves it bright.
  tabBar:
    `fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 items-center ${barMetrics} ${barHairline} bg-[var(--bg)] px-[0.5rem] ${barBlockPadding} transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] ${layerShiftOpen} data-[drawer=open]:pointer-events-none min-[900px]:hidden`,
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
