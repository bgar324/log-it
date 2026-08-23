# Design System

Logit uses a restrained monochrome UI. Authenticated screens are calm and sentence-led at the top of each view, dense where the user is scanning rows of workout data.

## Platform And Feel

- Logit is a mobile-first product that should feel like a native app, not a responsive website. A dedicated native app costs money we are not spending yet, so the web build stands in for it and must carry the app feel.
- Design phone-first, then add desktop density on top. The primary viewport is a phone; desktop is the enhancement.
- Favor app-like affordances: full-width primary actions on small screens, comfortable touch targets, `[touch-action:manipulation]`, correct `inputMode` on inputs, and short, subtle motion. Avoid web-page tells like tiny tap targets, hover-only affordances, and desktop-only layouts.
- When phone feel and desktop polish conflict, favor the phone.

## Foundations

- Global CSS lives in `app/globals.css`.
- Theme tokens are CSS variables on `:root`; dark mode overrides use `:root[data-theme="dark"]`.
- Core tokens include `--bg`, `--surface`, `--text`, `--muted`, `--field-bg`, `--field-line`, `--button-bg`, `--button-text`, `--focus-ring`, `--shadow`, and font variables.
- The theme toggle sets `data-theme` and `data-color-scheme`; `app/layout.tsx` initializes the stored or system theme before rendering.
- Tailwind v4 utilities are used heavily, often through exported `styles` objects.

## Surfaces

- Public/auth shell: `app/globals.css`, `app/page.tsx`, `app/auth/page.tsx`, `app/components/ui/*`. Public primitives use the same `--bg`, `--text`, `--muted`, `--field-*`, and `--focus-ring` tokens as product surfaces.
- App chrome: `app/components/app-nav.tsx` and `app/components/app-nav.styles.ts` own the bottom tab bar, the sticky top bar, and the drawer. See "Authenticated App System" below.
- Product dashboard shell: `app/dashboard/dashboard.styles.ts` and dashboard components/hooks. The desktop sidebar lists every section and supports an icon-only collapsed state.
- Split planner: `app/dashboard/split-system.styles.ts`, `app/dashboard/split-manager.tsx`, and related hooks. The split view uses a split-library sidebar plus the weekday grid/editor work area.
- Workout logger: `app/workouts/new/workout-logger.styles.ts` and logger components/hooks.
- Workout detail: `app/workouts/[workoutId]/workout-detail.styles.ts`.
- Exercise detail: `app/exercises/[exerciseKey]/exercise-detail.styles.ts`.
- Public profiles: `app/u/[username]/public-profile.styles.ts`.
- Research/editorial pages: shared article shell in `app/components/public-article.tsx`; content classes (`legal-*`, `changelog-*`) live in `app/globals.css`.

## Authenticated App System

The authenticated app is navigated by frequency of the trip, not by importance of the object.

- **First class (bottom bar, three slots):** Home, a filled log action, Nutrition. These are the trips a user makes without thinking. The bar is fixed, thumb-height, and present on every phone-width screen except task surfaces.
- **Second class (drawer):** Workouts, Progress, Split, Profile, theme, sign out. Deliberate trips tolerate one extra tap. The drawer is a *layer*, not a panel: it is the base layer of the app, and the app screen slides right to reveal it. It opens from the top-left avatar — low reach frequency justifies the low-reachability corner — and closes by tapping the exposed app surface or pressing Escape. There is no gesture trigger: an edge swipe collides with the platform back gesture in standalone web apps.
- **Two layers, always.** Layer B is the drawer underneath; layer A is the app on top of it. Never stack a nav panel over the app with a dimming scrim — the app moves, the menu stays put. The trigger appears on every browsing surface, including workout and exercise detail, so the drawer is never reachable only from Home.
- **Task surfaces** (`/workouts/new`, `/workouts/[workoutId]/edit`) carry no nav chrome. They get a sticky header with one 44px exit control and a sticky save bar the keyboard cannot cover.
- **No hamburger, no dropdown nav, and no width without navigation.** The bottom bar covers below `900px`, the sidebar covers `900px` and up.
- **Icon set (Lucide):** Home `House` · Log `Plus` · Nutrition `Apple` · Workouts `ClipboardList` · Progress `TrendingUp` · Split `CalendarDays` · Profile `UserRound` · Settings `Settings`. Pick the icon that names the *thing* (a split is a week, so it is a calendar; workouts are a log, so they are a clipboard) rather than a domain mascot; `Dumbbell`, `ChartLine`, `Blocks` and `Utensils` read as noise at 1.2rem.
- Settings is the drawer's footer entry and holds preferences only (theme, units). Sign-out is not in the drawer; account actions live on the profile view.
- A control that saves on selection must not reuse a form's unsaved input state. Write the persisted values plus the one field being changed, or the toggle silently commits whatever the user left half-typed on another view.

### Sentences, not tiles

- Say the fact in a sentence a person would speak. Today reads `Hi, Benjamin.` / `Today is Upper B.` / one muted plan note / one action — not a label/value grid.
- There are no KPI tiles anywhere in the authenticated app. Summary numbers live in one or two quiet typographic lines (`styles.statLine`, `styles.statLineMuted`), keeping every fact while removing the boxes.
- Never print the same number twice on one screen. If a value is editable below, the summary above states it once or not at all.
- Prefer a sentence to a badge for state: `Logged for today.` beats a green pill.
- An empty-state label must key off the fact it names, not off a value that happens to be missing. "First time" belongs to *no history*; a bodyweight set has no weight and is still a session that happened, so gating it on a null weight makes every pull-up row claim it was never trained. Name the states you actually have — never trained, trained with a number worth quoting, trained without one — and render each.

### Controls

- One filled primary per screen: `.app-filled-action` in `app/globals.css` (pill radius, `--button-bg`/`--button-text`). Everything else is quiet — muted text or a hairline border. Differentiate by fill and color, never by border opacity.
- **Every button comes from one place.** `app/components/action.styles.ts` owns button geometry for the whole app, derived from the landing page's `.primaryAction`: a 999px pill, 44px tall at every width, weight 400, type mirroring the landing's own ramp (`0.9375rem` under `52rem`, `1rem` above). Variants — `actionFilled`, `actionQuiet`, `actionOutline`, `actionDanger`, `actionChip`, `actionIcon*`, `actionMenuRow*`, `actionNavRow` — differ only in fill and colour. Before this existed the dashboard file alone carried 9 distinct radii, because nothing structurally stopped a new key inventing one.
- Never re-declare `rounded-*`, `min-h-*`, or `text-[…rem]` on a control. Compose a canon variant with layout-only extras (`w-full`, `justify-start`, `ml-auto`, grid placement). A collapsed or compact state SELECTS A DIFFERENT VARIANT; it never appends a modifier hoping to shrink one.
- **Tailwind v4 composition rule, learned the hard way:** utilities are emitted grouped by family in Tailwind's order, not in the order they appear in a class string, so appending a utility from a family the base already set does nothing — the one emitted later wins whoever wrote it. Measured in this repo: `.border-0` beats `.border`, `.bg-transparent` beats `.bg-[color-mix(…)]`, `.text-[var(--text)]` beats `.text-[#b13d48]`, `.cursor-pointer` beats `.cursor-grab`, `.px-[1.2rem]` beats `.px-0`, `.w-full` beats `.w-[2.75rem]`. Within one family the winner can even flip by value (`[touch-action:none]` beats `manipulation`). So a shared base states a family only if every variant built on it wants that exact value; everything contested lives on the variants. `hover:` / `data-[]:` / `min-[]:` prefixed utilities are always safe on top. Reach for a new variant, never `!`.
- Unlayered CSS outranks every Tailwind utility. `a { color: inherit }` in `app/globals.css` sat outside `@layer base` and silently killed every `text-*` class on every `<Link>` in the app — quiet actions rendered at full `--text` while the identical class on a `<button>` rendered muted. Any global element rule belongs in `@layer base`.
- Occasional tools belong in a dial, not a column. Every logger action lives in one fixed bottom-right circle (`workout-logger-tools-fab.tsx`), because a screen whose job is typing set numbers should show sets, not a stack of buttons under them. Opening blurs the page rather than drawing a panel: the actions are label-plus-circle rows on the blurred content, revealed with a per-row `transition-delay` that runs up from the trigger. Only transform and opacity animate, so the stagger never reflows the column.
- A blurred backdrop is only the visual half of modal. Anything that dims or blurs the page must also move focus into itself, cycle `Tab` at both ends, and return focus to its trigger on close — otherwise a keyboard user tabs straight into content they cannot see. Put `role="dialog"` + `aria-modal="true"` on the element that contains **everything the trap cycles through**, including the trigger when it doubles as the close button; scoping it to the inner column alone tells assistive tech the trigger does not exist while `Tab` is still landing on it. Apply the semantics only while open.
- A CSS transition needs a frame to start from. An element that mounts already in its final state jumps there instantly — the animation exists in the stylesheet and is never seen. Mount in the closed state and flip to open in a `requestAnimationFrame`, which is how the tools dial's stagger became visible.
- Motion is asymmetric on purpose: entering animates, leaving does not. The tools dial cascades in and unmounts the instant it closes, because a staggered exit reads as the menu hesitating after you have already committed to an action. Only add an exit animation when the thing leaving still needs to be read.
- Reorder lists carry one grab handle, not a handle plus up/down arrows. But the handle then owes a keyboard path: space picks the row up, the arrows move it, space drops it, escape restores the order from pickup. `aria-pressed` reports the picked-up state and the label states the position, so removing the arrows costs nothing for keyboard or screen-reader users.
- `Back` takes `actionQuiet`, the one deliberate exception to "secondary actions get a hairline". It is the quietest control on any screen it appears on, and a bordered pill in the top-left competed with the content for attention.
- Minimums on phones: **44px** (`2.75rem`) for anything a thumb hits, **16px** (`text-base`) for every text input so iOS Safari never zooms the viewport. Desktop density is restored behind `min-[620px]:` / `min-[760px]:` overrides.
- Declare inverted foregrounds in CSS, not as Tailwind arbitrary colors. `text-[var(--bg)]` on a `bg-[var(--text)]` control was observed rendering same-on-same (invisible label), which is why `.app-filled-action` exists. Always confirm a filled action in a browser.
- Write arbitrary values as literals, never assembled from a template variable (`bg-[${token}]`). Tailwind's scanner reads source text, so an interpolated class is only present if the identical literal happens to exist elsewhere in the repo.
- No native number steppers. `input[type="number"]` spin buttons are removed globally in `app/globals.css`; the numeric keyboard is the input on a phone.
- No native select carets. Chrome pins its own caret to the right border and `padding-right` will not move it, so `select:not([multiple])` in `app/globals.css` sets `appearance: none` and draws a `--select-caret` background at a real inset. The rule is deliberately specific enough to beat `.input` and the Tailwind `px-*` utilities: the right padding belongs to the caret, the left padding stays with each control, and a new dropdown cannot ship cramped. Never hand-roll an absolutely positioned chevron beside a select — that was the split selector's old pattern, and it double-drew once the rule existed.
- Settings-style screens are rows, not cards: `label · current value · action`. An editing form opens inline from its row (`accountDisclosure`) instead of sitting open on the page. Two always-open forms are what made the profile view the heaviest screen in the app.
- Never leave a permanently-disabled primary on screen. Render the save action when there is something to save; a greyed filled pill reads as broken rather than inactive.
- Irreversible actions live in a bordered, tinted danger zone (`dangerZone`) rather than as one more row in a list, so they read as a different class of control. Everything else on a settings-style screen stays a plain row.
- Editing identity happens in a dialog, not as fields parked on the page: a pencil beside the name opens first/last/username/visibility together, and dropdowns are fine for two-option preferences.
- Destructive row actions live behind an explicit edit mode, not on every row. The split editor's `Edit exercises` (in the tools menu) reveals per-row delete; deleting is immediate, with no confirmation modal, because the mode itself is the confirmation.
- Do not wrap a row of fields in a card. Inputs already read as fields; a border around them is a second frame.
- Dashboard list panels reveal, they do not paginate. `Show 24 more exercises` beats `Prev · Page 1 of 17 · Next`: nothing sits permanently disabled, and the count line above states the total once. Search narrows first; the reveal resets when the query or ordering changes. The exercise-detail session table (`session-breakdown-table.tsx`, `PAGE_SIZE = 5`) is the one surface still paging — an outlier to migrate, not a second endorsed pattern.
- A reveal button states the batch it appends, not the remainder it leaves. `Show 24 more` that adds 24 is a promise kept; `Show 71 more` that adds 24 is a lie the user catches on the first tap.
- A control must not change meaning based on which sibling is already active. Two toggles that each flipped their own direction encoded four sort states behind three words, so `Recent` meant newest, oldest, or "switch away from sessions". One `<select>` naming all four orderings replaced it.
- Put the filter before the list and above the ordering: with dozens of rows, naming the one you want beats reordering all of them. Search takes the panel's full width; the ordering rides the count line directly above the rows.
- Avoid hover-only affordances; touch never triggers them. Cards and list rows carry no hover state.

## Visual Language

- Dominant palette is black, white, transparent surfaces, thin borders, and muted text.
- Product surfaces favor transparent or page-background panels with subtle borders over heavy cards.
- Shared cards, public shells, and product panels use compact radii around `0.5rem` to `0.58rem`; controls use a `999px` pill. Avoid large rounded marketing cards, blur-heavy surfaces, and decorative shadows.
- Icon buttons use Lucide icons where applicable.
- Green success states use a darker green border with a light green fill.
- Focus states should be visible through `focus-visible` styles using `--focus-ring`.
- Motion is subtle: short color/border transitions, small active translate movement, and short enter/exit animations for overlays.

## Public Landing System

All public pages (landing, research, papers, legal, changelog, auth) share one chrome: `PublicHeader`/`PublicFooter` from `app/components/public-site.tsx`. The landing page uses a deliberately small system derived from the product UI rather than a separate marketing language.

- **Container:** `81.25rem` maximum width with `1.25rem` minimum side gutters. At `1440px`, this yields the `1300px` working width used by the hero and product frame.
- **Header:** `3.25rem` tall on desktop and `3.5rem` on phones. Navigation is quiet, single-line, and secondary to the product statement.
- **Vertical rhythm:** hero content begins `7rem` below the header; actions sit `1.375rem` below the statement; the product frame follows after `3.5rem`. Major sections use `7rem` to `8rem` of vertical separation rather than decorative dividers or filler.
- **Controls:** primary landing actions are `2.6875rem` tall on desktop and at least `2.75rem` on touch devices, use `1rem` text at regular weight, `1.35rem` inline padding, and a pill radius. Header actions use the same shape at a smaller scale.
- **Surfaces:** each landing preview renders a public-domain abstract painting backdrop inside its frame (Kandinsky's *Improvisation No. 30* for the dashboard, *Painting with Green Center* for the split planner, Marc's *Fighting Forms* for progress; served optimized from `public/art/`) with the app screen floating as an inset card on equal padding, a `0.25rem`-radius outer frame, and no frame border. Backdrops are fixed across themes; only the floating screen follows the app theme.
- **Color:** landing colors are warm near-black/near-white neutrals. Accent colors are reserved for real product state, not marketing decoration.
- **Copy:** one declarative product statement leads each section. Do not add eyebrow labels, reassurance strips, feature numbers, slogans split across oversized lines, or generic trust copy. Actions use direct verbs.

Public tokens (`--landing-*`) live on the shared `.publicRoot` class at the top of `app/landing.module.css`; every public page root applies it, and every public rule derives from those properties. Long-form public pages (papers, legal, changelog) use `PublicArticleShell` with a `46rem` article column.

## Component Conventions

- Shared public primitives are re-exported from `app/components/ui.tsx`.
- Dashboard/product screens mostly use local style objects instead of a centralized component library.
- Keep new UI consistent with the nearest local surface before adding shared abstractions.
- Prefer existing helper `cn()` implementations for class composition in the local folder.
- Avoid nested card patterns in product surfaces; use sections, rows, lists, borders, and spacing.
- Keep filters, split editing, profile editing, and logger controls feature-complete rather than decorative.
- Muted title metadata such as workout type, selected date, last-hit status, or preview status is allowed when it helps scanning. Keep it natural-case and untracked; do not use uppercase eyebrow styling for hierarchy.
- `*.styles.ts` files are plain object literals of raw Tailwind strings, not CSS modules. A duplicate key silently wins with no type error, and a stale line range in an edit can clobber the neighbouring key, so re-read before editing and typecheck after. Browser probes must select structurally (`aria-label`, `nav[aria-label="Primary"]`), never by class-name substring.
- Skeletons must mirror the shipped layout. When a view's shape changes, update the matching branch of `dashboard-view-skeleton.tsx` in the same change.

## State And Feedback

- Toast feedback uses `sonner` through `app/components/ui/toaster.tsx`.
- Sonner confirmation toasts should keep action buttons visually grouped; `app/components/ui/toaster.tsx` overrides Sonner's default button auto-margin.
- Loading states exist for route-level loading files and dashboard lazy-view skeletons.
- Dashboard client view errors render retry actions.
- Destructive or irreversible actions should keep clear confirmation/error affordances. Existing destructive color references include red tones such as `#b13d48`.
- Dashboard profile photo editing renders its modal through a body portal with `dashboard-theme-scope`, blurred backdrop, and enter/exit animations defined in `app/globals.css`.

## Known Drift / Needs Verification

- There is no single typed design-token module; CSS variables and Tailwind arbitrary values are the current source of truth.
