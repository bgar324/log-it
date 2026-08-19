# Design System

Logit uses a restrained monochrome product UI. The working surfaces are dense, direct, and built for repeated scanning of workout data.

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
- Product dashboard shell: `app/dashboard/dashboard.styles.ts` and dashboard components/hooks. Desktop sidebar supports an icon-only collapsed state; mobile navigation remains a separate menu.
- Split planner: `app/dashboard/split-system.styles.ts`, `app/dashboard/split-manager.tsx`, and related hooks. The split view uses a split-library sidebar plus the weekday grid/editor work area. Split summary actions are icon-only with accessible labels; active state is communicated by icon and sidebar metadata.
- Workout logger: `app/workouts/new/workout-logger.styles.ts` and logger components/hooks.
- Workout detail: `app/workouts/[workoutId]/workout-detail.styles.ts`.
- Exercise detail: `app/exercises/[exerciseKey]/exercise-detail.styles.ts`.
- Public profiles: `app/u/[username]/public-profile.styles.ts`.
- Research/editorial pages: shared article shell in `app/components/public-article.tsx`; content classes (`legal-*`, `changelog-*`) live in `app/globals.css`.

## Visual Language

- Dominant palette is black, white, transparent surfaces, thin borders, and muted text.
- Product surfaces favor transparent or page-background panels with subtle borders over heavy cards.
- Buttons are usually bordered, natural-case, and use compact radii.
- Shared cards, public shells, and product panels use compact radii around `0.5rem` to `0.58rem`; avoid large rounded marketing cards, blur-heavy surfaces, and decorative shadows.
- Icon buttons use Lucide icons where applicable.
- Green success states use a darker green border with a light green fill, for example the dashboard `Logged!` action.
- Focus states should be visible through `focus-visible` styles using `--focus-ring`.
- Motion is subtle: short color/border transitions, small active translate movement, and short enter/exit animations for modal overlays.
- Dashboard and logger layouts are responsive, with mobile-specific touch targets and compact desktop density.

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

## State And Feedback

- Toast feedback uses `sonner` through `app/components/ui/toaster.tsx`.
- Sonner confirmation toasts should keep action buttons visually grouped; `app/components/ui/toaster.tsx` overrides Sonner's default button auto-margin.
- Loading states exist for route-level loading files and dashboard lazy-view skeletons.
- Dashboard client view errors render retry actions.
- Destructive or irreversible actions should keep clear confirmation/error affordances. Existing destructive color references include red tones such as `#b13d48`.
- Dashboard profile photo editing renders its modal through a body portal with `dashboard-theme-scope`, blurred backdrop, and enter/exit animations defined in `app/globals.css`.

## Known Drift / Needs Verification

- There is no single typed design-token module; CSS variables and Tailwind arbitrary values are the current source of truth.
