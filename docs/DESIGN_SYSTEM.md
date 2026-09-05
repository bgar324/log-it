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
- Split planner: `app/dashboard/split-system.styles.ts`, `app/dashboard/split-manager.tsx`, and related hooks. Layouts below `981px` render the full week as a compact agenda and open the selected day as a full-viewport task surface; wider layouts keep the weekday grid and editor side by side.
- Workout logger: `app/workouts/new/workout-logger.styles.ts` and logger components/hooks.
- Workout detail: `app/workouts/[workoutId]/workout-detail.styles.ts`.
- Exercise detail: `app/exercises/[exerciseKey]/exercise-detail.styles.ts`.
- Public profiles: `app/u/[username]/public-profile.styles.ts`.
- Research/editorial pages: shared article shell in `app/components/public-article.tsx`; content classes (`legal-*`, `changelog-*`) live in `app/globals.css`.

## Authenticated App System

The authenticated app is navigated by frequency of the trip, not by importance of the object.

- **First class (bottom bar, three slots):** Home, a filled log action, Nutrition. These are the trips a user makes without thinking. The bar is fixed, thumb-height, and present on every phone-width screen except task surfaces.
- **Second class (drawer):** Profile, Workouts, Progress, Split, theme, sign out. Deliberate trips tolerate one extra tap. The drawer is a *layer*, not a panel: it is the base layer of the app, and the app screen slides right to reveal it. It opens from a top-left `PanelLeft` control — a familiar navigation signifier — and closes by tapping the exposed app surface or pressing Escape. There is no gesture trigger: an edge swipe collides with the platform back gesture in standalone web apps. Profile leads the list because the identity block sits directly above it.
- **Two layers, always.** Layer B is the drawer underneath; layer A is the app on top of it. Never stack a nav panel over the app with a dimming scrim — the app moves, the menu stays put. The trigger belongs on browsing surfaces that own a view (the dashboard's own top bar), not on detail surfaces reached from a list: there, Back is the only navigation a user wants, and a second control beside it competes with it.
- **The exposed app is lifted and seamed, never fogged or rounded.** Two surfaces painted `--bg` meeting at an invisible edge read as one broken screen. The fix is elevation plus a line: while the drawer is open, layer A takes a `--text` 9% veil (deliberately *lighter* than the drawer in dark, shaded in light) and a full-height `border-l` at the canon 12% hairline, and it stays full-bleed. Two alternatives were built and rejected — a `--bg` fog behind a 7px blur, which smears the app into the drawer and reads as a modal scrim, and rounding the exposed edge into an inset card, which costs bands that crop the chrome and a corner curve that eats the bottom hairline where it meets the drawer's footer. The veil is kept mounted at `opacity: 0` and ramped over the same 280ms as the slide: introduced with the open state instead, it has no previous frame to transition from and snaps to full strength across the whole screen before the app has moved.
- **Task surfaces** (`/workouts/new`, `/workouts/[workoutId]/edit`) carry no nav chrome. They get one quiet 44px Back control at the top. Save and every other logger action live in the bottom-right tools dial.
- **One drawer control, no dropdown nav, and no width without navigation.** The `PanelLeft` control opens the drawer below `900px`; the sidebar covers `900px` and up.
- **Icon set (Lucide):** Navigation `PanelLeft` · Home `House` · Log `Plus` · Nutrition `Apple` · Workouts `ClipboardList` · Progress `ChartNoAxesColumnIncreasing` · Split `CalendarDays` · Profile `UserRound` · Settings `Settings`. Pick the icon that names the *thing* (a split is a week, so it is a calendar; workouts are a log, so they are a clipboard) rather than a domain mascot; `Dumbbell`, `ChartLine`, `Blocks` and `Utensils` read as noise at 1.2rem. Progress is the bare ascending bars rather than `TrendingUp`, whose arrow reads as a stock ticker.
- Settings and sign-out share the phone drawer footer and the desktop sidebar utility stack. Settings holds preferences only (theme, units); the profile view owns email, password, and account deletion.
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
- **Tailwind v4 composition rule, learned the hard way:** utilities are emitted by family in Tailwind's order, not in their order inside a class string. Appending a utility from a family the base already sets does not guarantee an override. Measured here, `.border-0` beats `.border`, `.bg-transparent` beats `.bg-[color-mix(…)]`, `.text-[var(--text)]` beats `.text-[#b13d48]`, `.px-[1.2rem]` beats `.px-0`, and `.w-full` beats `.w-[2.75rem]`. A shared base states a family only if every variant wants the same value; contested values live on the variants. Prefixed `hover:`, `data-[]:`, and `min-[]:` utilities carry enough specificity to win. Add a canon variant instead of `!important`.
- Unlayered CSS outranks every Tailwind utility. `a { color: inherit }` in `app/globals.css` sat outside `@layer base` and silently killed every `text-*` class on every `<Link>` in the app — quiet actions rendered at full `--text` while the identical class on a `<button>` rendered muted. Any global element rule belongs in `@layer base`.
- Occasional workout-level tools belong in a dial, not a column. Save, add another exercise, reorder exercises, reset from split, and the rest timer live in one fixed bottom-right circle (`workout-logger-tools-fab.tsx`). `Add set` and `Delete exercise` stay in each exercise's overflow menu because they act on that exercise. Opening the dial blurs the page rather than drawing a panel: the actions are label-plus-circle rows on the blurred content, revealed with a per-row `transition-delay` that runs up from the trigger. Only transform and opacity animate, so the stagger never reflows the column.
- **Never move focus programmatically on a dashboard surface.** No `.focus()` on open or close, no focus traps. This is the one hard rule, and it is a measured one: seven such calls fired when overlays opened, and on iOS that dismisses the keyboard and jumps the viewport — in the logger it happened every time the dial opened mid-set. Overlays here dismiss by scrim tap or `Escape`, and focus stays wherever the user put it. Verified: focusing a set input and opening the dial leaves `document.activeElement` on the input with `scrollY` unchanged.
- A CSS transition needs a frame to start from. An element that mounts already in its final state jumps there instantly — the animation exists in the stylesheet and is never seen. Mount in the closed state and flip to open in a `requestAnimationFrame`, which is how the tools dial's stagger became visible.
- Motion is asymmetric on purpose: entering animates, leaving does not. The tools dial cascades in and unmounts the instant it closes, because a staggered exit reads as the menu hesitating after you have already committed to an action. Only add an exit animation when the thing leaving still needs to be read.
- A seven-day plan must read as one week below `981px`. Use compact agenda rows for the overview, not desktop cards stacked into a 1,400px page. Tapping a day opens one full-viewport, keyboard-safe editor with a seven-day switcher; it renders through a body portal so it covers the app tab bar or narrow desktop shell, and it opens instantly with no segment transition. At `981px` and wider the same editor remains an in-flow side panel. Never mount separate narrow and wide copies of the form.
- Week reordering is a two-tap move flow because weekdays are fixed destination slots: select a workout, then choose its day. Exercise reordering is a separate grab-handle drag flow. The split editor and workout logger share one exercise-reorder component, so their handles, row treatment, `Cancel`, and `Save order` behavior stay identical.
- **One Back control, and it is the quiet one.** `actionQuiet` pulled left by its own padding (`-ml-[1rem]`) is the canon on every authenticated surface that has a Back: logger, workout detail, exercise detail. It is the one deliberate exception to "secondary actions get a hairline" — a bordered pill in the top-left competes with the content and reads heavier than the page title under it.
- Minimums on phones: **44px** (`2.75rem`) for anything a thumb hits, **16px** (`text-base`) for every text input so iOS Safari never zooms the viewport. Desktop density is restored behind `min-[620px]:` / `min-[760px]:` overrides.
- Declare inverted foregrounds in CSS, not as Tailwind arbitrary colors. `text-[var(--bg)]` on a `bg-[var(--text)]` control was observed rendering same-on-same (invisible label), which is why `.app-filled-action` exists. Always confirm a filled action in a browser.
- Write arbitrary values as literals, never assembled from a template variable (`bg-[${token}]`). Tailwind's scanner reads source text, so an interpolated class is only present if the identical literal happens to exist elsewhere in the repo.
- No native number steppers. `input[type="number"]` spin buttons are removed globally in `app/globals.css`; the numeric keyboard is the input on a phone.
- No native select carets. Chrome pins its own caret to the right border and `padding-right` will not move it, so `select:not([multiple])` in `app/globals.css` sets `appearance: none` and draws a `--select-caret` background at a real inset. The rule is deliberately specific enough to beat `.input` and the Tailwind `px-*` utilities: the right padding belongs to the caret, the left padding stays with each control, and a new dropdown cannot ship cramped. Never hand-roll an absolutely positioned chevron beside a select — that was the split selector's old pattern, and it double-drew once the rule existed.
- Settings-style screens are rows, not cards: `label · current value · action`. An editing form opens inline from its row (`accountDisclosure`) instead of sitting open on the page. Two always-open forms are what made the profile view the heaviest screen in the app.
- Never leave a permanently-disabled primary on screen. Render the save action when there is something to save; a greyed filled pill reads as broken rather than inactive.
- Irreversible actions live in a bordered, tinted danger zone (`dangerZone`) rather than as one more row in a list, so they read as a different class of control. Everything else on a settings-style screen stays a plain row.
- Editing identity happens in a dialog, not as fields parked on the page: a pencil beside the name opens first/last/username/visibility together, and dropdowns are fine for two-option preferences.
- Destructive row actions live behind an explicit edit mode, not on every row. The split editor exposes `Add exercise` directly, while its day tools menu enters delete mode or opens the exercise-reorder drag sheet. Deleting is immediate because entering edit mode is the confirmation.
- **A Save belongs on the surface that changed something, and nowhere else.** The split week has no Save: reordering commits from its own sheet's `Save`, and day edits commit from the day editor's `Save` (top right, at every width). A page-level Save above a list that cannot itself be edited leaves the user guessing what is unsaved.
- Do not wrap a row of fields in a card. Inputs already read as fields; a border around them is a second frame.
- **The drawer's footer and the bottom tab bar are one band.** With the drawer open they sit side by side, so a mismatch in height or baseline reads as a broken line across the screen. Both derive from `--bar-row` and `--bar-pad` in `app/components/app-nav.styles.ts` and both add `env(safe-area-inset-bottom)` once, so they cannot drift; each surface declares the tokens itself rather than inheriting them, because `AppTabBar` also renders standalone inside route loading files. Nothing may crop that band at the seam — which is one reason the exposed app is not rounded.
- **An avatar carries its own label.** The edit affordance is a sliver across the bottom of the circle, clipped by its own `overflow-hidden` - not a caption underneath. A caption cost a row of layout and read as a second control. The sliver uses a literal dark scrim with light text rather than theme tokens, because it sits on a photograph in both themes.
- **Ask for a number the user cannot know and they will abandon the screen.** Nutrition offers the user's own logged days back as one-tap rows that fill the fields (`[data-nutrition-recall]`), ordered so a repeated total outranks a recent one-off. Their own history is the most accurate estimate available and needs no food database. Never block a partial entry: calories-only and protein-only are valid, and the copy must say so.
- One rhythm per stack. When controls stack into a single column on a phone, every gap between them is the same value, including the gaps that cross a container boundary - a stray `pt-*` on a footer is what makes four buttons read as two pairs.
- **A list panel must not grow taller than the phone holding it.** That is the deciding factor between revealing and paging, and it splits by what the list *is*:
  - **A searchable index pages.** The progress exercise list holds 85 rows; revealing 24 at a time pushed the search field and the ordering off the top, and the only way back to them was a long scroll. It now draws one page of `EXERCISES_PER_PAGE` (8, about one screen) with arrows pinned to the panel's edges and the position (`9-16 of 85`) between them. The panel is the same height on every page.
  - **A chronological archive reveals.** The workouts list reveals whole *months* and, past the loaded window, fetches older ones from the server (`dashboard-workouts-view.tsx`). "Further back" is the user's actual intent there, and it maps onto server paging; turning that into numbered pages would invent a cursor over a timeline nobody counts in pages.
- Paging costs one disabled arrow at each end, which an earlier version of this rule refused. It is accepted now because the alternative costs more: the old `Prev · Page 1 of 17 · Next` failed on *page size*, not on arrows - 17 pages of five made Next the only way through. Size a page to roughly one screen and the page count stays small enough that both directions are useful. Never render a pager for a single page.
- A pager states position, never just direction. Two bare chevrons leave the user unable to tell where they are or how much is left; the range line between them is the feedback.
- **The skeleton follows the page size by construction.** `EXERCISES_PER_PAGE` is exported from `use-dashboard-progress.ts` and imported by `dashboard-view-skeleton.tsx`, so the loading state cannot draw a different number of rows than the list it stands in for. A hardcoded copy there drifted the first time the size changed; a test asserts the two agree.
- A reveal button states the batch it appends, not the remainder it leaves. `Show 24 more` that adds 24 is a promise kept; `Show 71 more` that adds 24 is a lie the user catches on the first tap.
- The exercise-detail session table (`session-breakdown-table.tsx`) pages at `PAGE_SIZE = 5`. That is now consistent with the rule above rather than an outlier to migrate: it is an index, it pages, and its loading skeleton draws the same five rows.
- A control must not change meaning based on which sibling is already active. Two toggles that each flipped their own direction encoded four sort states behind three words, so `Recent` meant newest, oldest, or "switch away from sessions". One `<select>` naming all four orderings replaced it.
- Put the filter before the list and above the ordering: with dozens of rows, naming the one you want beats reordering all of them. Search takes the panel's full width; the ordering rides the count line directly above the rows.
- Avoid hover-only affordances; touch never triggers them. Cards and list rows carry no hover state.

## Visual Language

- Dominant palette is black, white, transparent surfaces, thin borders, and muted text.
- Product surfaces favor transparent or page-background panels with subtle borders over heavy cards.
- Shared cards, public shells, and product panels use compact radii around `0.5rem` to `0.58rem`; controls use a `999px` pill. Avoid large rounded marketing cards, blur-heavy surfaces, and decorative shadows.
- Icon buttons use Lucide icons where applicable.
- Green success states use a darker green border with a light green fill.
- Focus states use `focus-visible` with `--focus-ring` on public surfaces (landing, research, auth, public profiles). The authenticated app currently has none — a preference, not a constraint; see the accessibility note at the end of this file before adding or removing them there.
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
- `*.styles.ts` files are plain object literals of raw Tailwind strings, not CSS modules. A duplicate key silently wins with no type error, and a stale line range in an edit can clobber the neighbouring key, so re-read before editing and typecheck after. Browser probes must select structurally, never by class-name substring — and in the authenticated app never by `aria-label`, which no longer exists there. The same trap catches tests: a jsdom assertion searching rendered HTML for the *key* name matches nothing, so assert on `styles.X`'s resolved value. Use the stable `data-*` hooks: `[data-app-drawer-trigger="true"]`, `nav[data-app-nav="tabbar"]`, `nav[data-app-nav="sections"]`, `[data-fab-trigger="true"]`, `[data-reorder-id]`, `[data-pager="exercises"]`, `[data-nutrition-recall]`, `[data-nutrition-recall-row]`, plus the state attributes `data-state`, `data-active`, `data-primary`, `data-timing`, `data-dragging`.
- Skeletons must mirror the shipped layout. When a view's shape changes, update the matching branch of `dashboard-view-skeleton.tsx` in the same change. Build each branch out of the real view's own layout keys (`today`, `sessionList`, `pagerRow`, `nutritionRecall`, …) rather than skeleton-only copies: a skeleton that shares the view's classes cannot drift into a different shape, and the four `skeleton*` layout keys that existed to duplicate them are gone. Where a count matters, import the constant instead of hardcoding it.

## State And Feedback

- Toast feedback uses `sonner` through `app/components/ui/toaster.tsx`.
- Sonner confirmation toasts should keep action buttons visually grouped; `app/components/ui/toaster.tsx` overrides Sonner's default button auto-margin.
- Loading states exist for route-level loading files and dashboard lazy-view skeletons.
- Dashboard client view errors render retry actions.
- Destructive or irreversible actions should keep clear confirmation/error affordances. Existing destructive color references include red tones such as `#b13d48`.
- Dashboard profile photo editing renders its modal through a body portal with `dashboard-theme-scope`, blurred backdrop, and enter/exit animations defined in `app/globals.css`.

## Known Drift / Needs Verification

- There is no single typed design-token module; CSS variables and Tailwind arbitrary values are the current source of truth.

## Accessibility In The Authenticated App

The authenticated app (`app/dashboard/**`, `app/workouts/**`, `app/exercises/**`, and app chrome) does not enforce a comprehensive accessibility layer. Local surfaces may carry names and roles, but the app has no programmatic focus transfer, focus traps, keyboard drag path, or global `focus-visible` system. This records the owner's preference on a personal project, not a standard to defend.

Two of those are different in kind, and the distinction matters when changing this code:

- **Focus transfer is a hard rule, because it was measured.** Programmatic focus is what broke phone interaction: `.focus()` on open dismissed the iOS keyboard and jumped the viewport mid-set. Do not add it back. See the rule in Foundations.
- **Names, roles, and `focus-visible` are a preference, not a constraint.** They never affected touch behaviour. Nothing in the design system depends on their absence, no style selects on `aria-*`, and no test uses a role selector — so re-adding them to any surface is a free, local change if it ever becomes wanted. Doing so does **not** license re-adding focus transfer with them; a dialog can carry `role="dialog"` and still leave focus alone.

Other facts worth knowing before editing here:

- **Public surfaces were never stripped.** Landing, research, papers, legal, changelog, auth, and public profiles are unchanged, along with `app/components/ui/**`, `public-site.tsx`, and `password-field.tsx`. `app/globals.css` retains its public `focus-visible` and reduced-motion rules.
- **What remains because it is interaction rather than semantics:** `[touch-action:manipulation]`, pointer capture where direct manipulation still requires it, body scroll locks, `Escape`-to-close, scrim click-to-dismiss, `tabIndex={-1}` on invisible scrim buttons, and the 44px/16px phone minimums.
- **Week and exercise reordering stay distinct.** Week moves use ordinary source and destination buttons. Exercise ordering remains pointer-only on one grab handle per row, with pointer capture and no directional arrows.
