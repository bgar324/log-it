# Design System

The authenticated app uses an ink-and-ivory palette, Geist typography, and soft grouped surfaces. Home is sentence-led; History and Analysis give recorded training data the space it needs.

## Authenticated design status

The owner authorized the reference-driven redesign behind the existing PostHog `Ben` flag. The rules below describe that design. Unflagged users and public previews retain the previous UI; Nova and Ionic remain disabled.

`training-theme.css` scopes the new palette to documents containing `[data-training-design="true"]`. Public pages retain their existing warm palette. Portalled controls inherit the authenticated document tokens.

`ui/popover.tsx` owns anchored disclosure presence and dismissal; `ui/legacy-dialog.tsx` owns dialog presence, scroll locking, and busy-dismissal protection. Neither transfers focus automatically. Closing content is inert. The owner interface has no navigation drawer.

## Authenticated Nova workspace

Status: disabled in production at the owner's request. These rules describe the retained experiment, not the active owner's interface.

The owner-only workspace uses the reference application's shadcn `radix-nova` system: neutral tokens, Geist, standard buttons and fields, visible tabs, and ordinary sheets, dialogs, and menus. `app/components/workspace-ui/` is the control source of truth. Do not mix legacy pill controls into these screens.

On phones, primary navigation is a fixed bottom tab bar with icons and labels. Account actions live at its right edge. Desktop keeps the header tabs. Search stays above the content. The shared `--workspace-nav-height` reserves space for the bar and the home-indicator inset; pinned workout actions sit above it. Feedback appears at the top rather than covering either bottom action area.

Home is the first tab, not the logger. Its hierarchy is today's plan and one contextual workout action, recent sessions, then the planned exercises. Home only reads unfinished drafts; the logger owns restoring, saving, and discarding them. Do not replace this overview with an Already logged notice or add KPI tiles.

The workspace theme is document-scoped by `[data-workspace-design="nova"]`; public and unflagged surfaces keep their warm palette. Radix portals inherit the active workspace tokens. Existing charts need the `workspace-chart-theme` adapter because legacy `--muted` means text while Nova `--muted` means a background.

Every workout exercise and set stays readable in one document. History and progress use sentence-led summaries and compact rows. Normal detail clicks open a right sheet; copied URLs and modifier clicks still open the full page. Keep the invoking row focused after dismissal and retain sheet content through its exit animation.

Use the reference tab indicator and short content/overlay motion, respecting reduced motion. Library focus traps and Escape behavior own overlays; dragging must cancel before Escape dismisses its sheet. Phone inputs use at least 16px text and controls have at least 44px targets, including triggers whose `asChild` composition changes `data-slot`.

The legacy and dormant rules below do not override this workspace canon. Verification uses dedicated headless Chromium, never the user's browser profile; emulation is not physical-device testing.

## Dormant Ionic variant

This experiment is disabled in production after owner feedback. The following rules apply only to its retained code.

The owner-only `/ionic` application intentionally uses Ionic's adaptive iOS and Material appearance instead of the legacy monochrome controls documented below. Ionic owns tabs, menus, back navigation, sheets, alerts, lists, numeric fields, segmented controls, and drag handles. Keep summaries sentence-led and data rows operational.

`app/ionic/ionic.css` scopes layout and chart-token mappings under `.ionic-app`. Do not import Ionic's global structure reset into the public or legacy app. The shell loads Ionic core styles only with the enabled client and maps the stored theme to `ion-palette-dark`. `useThemePreference()` remains the shared preference writer for both interfaces.

Phone controls retain 44px targets and 16px input text, including Ionic's otherwise shorter iOS segments. Secondary native text uses `--ion-color-medium` for readable contrast. Keep platform control geometry rather than recreating pill or drawer designs on top of Ionic.

The logger has a visible Finish action, an exercise switcher, and an active set editor with native Ionic fields. Its tools use a standard action sheet, not the legacy dial. Save-time interaction locks protect typed values; they do not replace draft recovery. Verify both platform modes headlessly, including real gestures and failed save paths. Physical device keyboard behavior still needs device testing.

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
- App chrome: `app/components/app-nav.tsx` and `app/components/app-nav.styles.ts` own direct bottom navigation and header utilities. The original drawer exists only in the unflagged baseline.
- Data lists: `app/components/data-list.styles.ts` owns the row and pager shape shared by today's plan, the progress exercise index, and an exercise's session history. See the list rule under "Controls".
- Product dashboard shell: `app/dashboard/dashboard.styles.ts` and dashboard components/hooks. The desktop sidebar lists every section and supports an icon-only collapsed state.
- Split planner: `app/dashboard/split-system.styles.ts`, `app/dashboard/split-manager.tsx`, and related hooks. Layouts below `981px` render the full week as a compact agenda and open the selected day as a full-viewport task surface; wider layouts keep the weekday grid and editor side by side.
- Workout logger: `app/workouts/new/workout-logger.styles.ts` and logger components/hooks.
- Workout detail: `app/workouts/[workoutId]/workout-detail.styles.ts`.
- Exercise detail: `app/exercises/[exerciseKey]/exercise-detail.styles.ts`, which composes the shared data-list shape for its session history.
- Public profiles: `app/u/[username]/public-profile.styles.ts`.
- Research/editorial pages: shared article shell in `app/components/public-article.tsx`; content classes (`legal-*`, `changelog-*`) live in `app/globals.css`.

## Authenticated app system

### Navigation and hierarchy

- Phones use one floating icon-only pill with Home, History, Log, Split, Analysis, Profile, and Sign out. All seven controls remain visible at 320px and keep a 44px minimum target.
- Profile's avatar and the Settings gear remain in the top utility row. There is no header ellipsis or hidden secondary navigation.
- The owner shell has no drawer layers, scrim, slide animation, or scroll lock. Desktop retains its collapsible sidebar from 900px upward.
- Logger routes are task surfaces without the main dock. Their Back link retains the originating view; editing returns to the workout detail. Detail and loading screens retain the same return context.
- The dock reserves `--app-dock-height`, including the safe-area inset. Content can scroll beyond the dock; it must not end underneath it.

### Home, History, and Analysis

- Home shows the weekday, a personal plan sentence, one primary action, three compact calendar months, the latest session, and today's planned exercises. Resume takes precedence over Open, then Start.
- Calendar dots mean recorded activity. Blank dots do not mean failure, and future days are dimmed. Home does not invent recovery scores or coaching claims.
- History uses a horizontal strip of recorded days, not empty calendar days. Selecting a date reveals its sessions and sets. Older reveals more months or fetches another server page. The selected date survives detail, edit, Back, and reload.
- Analysis leads with one large graph. Week, Month, and Year select its window; Sessions, Sets, and Volume select its measure. The three metric cards control the graph rather than acting as unrelated KPIs.
- Heuristic notes describe recorded data. Weekly consistency counts weeks with a recorded session, not daily adherence to a split. A current week without a session is pending, not a broken streak.
- Graphs appear without an initial reveal. Deliberate period and metric changes may animate. Reduced motion disables those animations and animated day-strip scrolling.
- Searchable exercise indexes keep their existing edge-chevron pagination and range line. Rows keep identity left and numbers right, with hairlines between them.

### Logger and split editing

- The logger shows one exercise and all its sets. Previous, Next, a jump list, and horizontal swipes change exercises without dropping typed values. Swipes starting inside fields or controls do not navigate.
- The active exercise name leads the form. Numeric entries are larger than metadata and keep a single Weight/Reps header rather than repeating visible labels for every field.
- The protected tools control expands into an arc of 52px circles. Save stays inside that fan, away from the opening thumb. The trigger paints above entering actions so a rapid second tap cannot hit an invisible Save.
- Add set and Delete exercise remain in the exercise menu. Workout details use the shared dialog. Set completion is not required.
- Saved splits appear as folders with actual weekday structure and an explicit active state. Tapping opens a split; Set active is a separate action. Long press and the visible options button open the same menu.
- Day edits remain in the library when another folder opens. Leaving warns about any dirty split, not only the selected one. Pending saves disable renaming and other conflicting mutations.
- Below 981px, a split day opens as one full-viewport task surface. Wider layouts show the same editor beside the week. Week moves use source/destination buttons; exercise order uses the shared drag sheet with Cancel and Save order.

### Shared controls and feedback

- General actions compose `action.styles.ts`. Hero actions, metric selectors, recorded-day cards, navigation tabs, and fan circles have distinct roles and geometry, but all retain the 44px phone minimum.
- Text inputs and selects use at least 16px text on phones. Logger number fields are larger. `field.styles.ts` owns field feedback; the authenticated theme sets 14px field corners.
- Popovers and dialogs do not move focus on open or close. Tab remains available to enter and traverse them. Editing-menu pointer presses preserve the current input.
- Menus and dialogs retain outgoing content for their actual exit animation, then unmount. Outgoing content is immediately inert. Do not add per-page exit timers.
- Feedback sits below the phone utility row, leaving Back and the dock reachable. Informational toast bodies pass pointer events through; explicit toast actions remain interactive.
- Profile and Settings use rows with focused editing dialogs. Destructive actions remain distinct and confirmed. A preference write uses saved profile values, never another form's unsaved draft.
- Data rows do not gain hover-only affordances. Numeric fields have no native steppers. Selects use the shared inset caret.
- Tailwind arbitrary values must be literal strings. State variants such as `aria-pressed:` and `data-selected:` must win through selector specificity, not class-string order.
- Skeletons use the resolved view's layout classes. Update the skeleton whenever a surface changes. Verify geometry in the browser rather than pinning class strings in tests.

## Visual language

- Dark background: `#0d0e11`; surfaces: `#1a1b20` and `#24252b`; text: `#f5f5f4`.
- Light background: `#f6f5f2`; raised surface: white; text: `#1c1d21`.
- The analytical accent is ice blue in dark mode and muted blue in light mode. It identifies recorded activity, selected metrics, and the active split.
- Grouped surfaces use 24px corners, fields use 14px, and general actions remain pills. Avoid nested frames and decorative glows.
- View and exercise changes use short, small movements. The tools fan uses staggered entry. Reduced motion preserves the same states without those movements.

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
- `*.styles.ts` exports literal Tailwind strings; Home and the activity calendar also use CSS modules. Browser probes use accessible names, roles, and stable `data-*` hooks, not class-name fragments. Tests assert observable behavior rather than serialized style strings.
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

Shared authenticated menus and dialogs carry names and roles, use consistent Escape/outside dismissal, and prevent automatic open/close focus transfer. Owner navigation uses ordinary links and a sign-out form, with no drawer focus trap. Exercise reordering remains pointer-driven; this is not a claim of comprehensive accessibility coverage.

Two of those are different in kind, and the distinction matters when changing this code:

- **Focus transfer is a hard rule, because it was measured.** Programmatic focus is what broke phone interaction: `.focus()` on open dismissed the iOS keyboard and jumped the viewport mid-set. Do not add it back. See the rule in Foundations.
- Names and roles do not cause the phone keyboard problem. They belong on shared interaction boundaries, and rendering tests use their observable semantics. Adding them does not license automatic focus transfer.

Other facts worth knowing before editing here:

- Public appearance and navigation remain separate from this authenticated interaction layer. `app/globals.css` retains public focus-visible and reduced-motion rules.
- **What remains because it is interaction rather than semantics:** `[touch-action:manipulation]`, pointer capture where direct manipulation still requires it, body scroll locks, `Escape`-to-close, scrim click-to-dismiss, `tabIndex={-1}` on invisible scrim buttons, and the 44px/16px phone minimums.
- **Week and exercise reordering stay distinct.** Week moves use ordinary source and destination buttons. Exercise ordering remains pointer-only on one grab handle per row, with pointer capture and no directional arrows.
