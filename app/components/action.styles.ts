/**
 * One button geometry for the whole app, taken from the landing page's primary
 * CTA (`.primaryAction` in `app/landing.module.css`): a 999px pill, 1rem text at
 * weight 400, no border, differentiated by fill and colour.
 *
 * These are composed into the `*.styles.ts` objects rather than declared as CSS
 * in `app/globals.css` on purpose: unlayered CSS outranks Tailwind utilities, so
 * a global `button` rule would silently beat every per-key override in the app.
 * Composition keeps the cascade honest and the geometry in one place.
 *
 * Height is 2.75rem (44px) at every width. The landing CTA is 43px, and the app
 * documents 44px as the phone tap floor, so one number satisfies both and the
 * whole family of desktop-only shrink overrides disappears.
 *
 * # The ordering rule that shapes this file
 *
 * Tailwind emits utilities by family, in its own order rather than their order
 * in a class string. Appending a utility from a family the base already sets
 * therefore does not guarantee an override. Measured here, `.border` loses to
 * `.border-0`, `.bg-[color-mix(…)]` loses to `.bg-transparent`, and danger text
 * can lose to a later neutral text utility.
 *
 * A shared base therefore states a family only if every variant built on it
 * wants that exact value. Border, background, and colour live on the variants.
 * Each export states those families once, which leaves consumers free to add
 * `hover:` or `data-[active]:` tints; variant-prefixed utilities carry the
 * specificity needed to win.
 */

const actionMotion =
  "transition-[transform,background-color,color,border-color,opacity] duration-140 ease-[cubic-bezier(0.2,0.7,0.2,1)] active:translate-y-[1px]";

/**
 * Shape and type only: no border, background, colour, cursor or touch-action.
 *
 * The type ramp mirrors the landing CTA exactly, because that button is the
 * source of truth: `--landing-type-body` is `0.9375rem` under the landing's
 * `max-width: 52rem` breakpoint and `1rem` above it, so a measured landing CTA
 * is 15px on a phone and 16px on a desktop. A flat `1rem` here would have made
 * every app button a pixel larger than its own canon on the width that matters
 * most.
 *
 * Height stays a flat 2.75rem. The landing is 2.6875rem above the breakpoint,
 * but 43px vs 44px is invisible and 44px is the documented tap floor, so one
 * number beats a breakpoint that buys nothing.
 */
const actionGeometry = `inline-flex shrink-0 min-h-[2.75rem] items-center justify-center gap-[0.35rem] rounded-[999px] text-[0.9375rem] font-[400] leading-none tracking-normal no-underline min-[52rem]:text-[1rem] disabled:cursor-not-allowed disabled:opacity-50 ${actionMotion}`;

/** Tap interaction for anything you press once. */
const actionPointer = "cursor-pointer [touch-action:manipulation]";

const actionBase = `${actionGeometry} ${actionPointer}`;

/** The one filled action per screen. Colour comes from `.app-filled-action`. */
export const actionFilled = `${actionBase} app-filled-action border-0 px-[1.2rem]`;

/** Quiet action: muted text, no border, no fill. */
export const actionQuiet = `${actionBase} border-0 px-[1rem] text-[var(--muted)]`;

/** Secondary action that needs an edge — a hairline, never a heavier border. */
export const actionOutline = `${actionBase} border border-[var(--field-line)] px-[1.15rem] text-[var(--text)]`;

/** Destructive action. Says danger in colour, not in border weight. */
export const actionDanger = `${actionBase} border border-[color-mix(in_srgb,#b13d48_46%,transparent)] px-[1.15rem] text-[#b13d48] hover:bg-[color-mix(in_srgb,#b13d48_12%,transparent)]`;

const actionIconShape = `${actionGeometry} h-[2.75rem] w-[2.75rem] border-0 px-0`;
const actionIconBase = `${actionIconShape} ${actionPointer}`;

/** Icon-only: a circle at the same height, so it lines up with text actions. */
export const actionIcon = `${actionIconBase} text-[var(--text)]`;

/** Icon-only and quiet. */
export const actionIconQuiet = `${actionIconBase} text-[var(--muted)]`;

/** Icon-only and destructive. */
export const actionIconDanger = `${actionIconBase} text-[#b13d48] hover:bg-[color-mix(in_srgb,#b13d48_12%,transparent)]`;

/** Icon-only and filled: the collapsed-sidebar twin of the phone tab bar's `+`. */
export const actionIconFilled = `${actionIconBase} app-filled-action`;

/**
 * Chip rows (rest-timer presets, filter chips) keep the pill and the 44px
 * height but take tighter horizontal padding, because five of them share one
 * phone width. Density lives in padding, never in radius or height.
 */
export const actionChip = `${actionBase} border border-[var(--field-line)] px-[0.7rem] text-[var(--text)]`;

const actionMenuRowBase = `${actionBase} w-full justify-start border-0 px-[0.85rem] text-left`;

/** Menu rows inside a popover: full width, left-aligned, same pill. */
export const actionMenuRow = `${actionMenuRowBase} text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)]`;

/** Menu row that deletes. */
export const actionMenuRowDanger = `${actionMenuRowBase} text-[#b13d48] hover:bg-[color-mix(in_srgb,#b13d48_10%,transparent)]`;

/**
 * Nav row: the menu-row pill, muted until it is the current page. Current state
 * reads as fill plus colour, never as a heavier border or a bolder weight.
 */
export const actionNavRow = `${actionMenuRowBase} text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)] data-[active=true]:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] data-[active=true]:text-[var(--text)]`;
