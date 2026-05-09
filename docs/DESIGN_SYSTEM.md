# Design System

Logit uses a restrained monochrome product UI. The working surfaces are dense, direct, and built for repeated scanning of workout data.

## Foundations

- Global CSS lives in `app/globals.css`.
- Theme tokens are CSS variables on `:root`; dark mode overrides use `:root[data-theme="dark"]`.
- Core tokens include `--bg`, `--surface`, `--text`, `--muted`, `--field-bg`, `--field-line`, `--button-bg`, `--button-text`, `--focus-ring`, `--shadow`, and font variables.
- The theme toggle sets `data-theme` and `data-color-scheme`; `app/layout.tsx` initializes the stored or system theme before rendering.
- Tailwind v4 utilities are used heavily, often through exported `styles` objects.

## Surfaces

- Public/auth shell: `app/globals.css`, `app/page.tsx`, `app/auth/page.tsx`, `app/components/ui/*`. Public primitives use the same `--bg`, `--text`, `--muted`, `--field-*`, and `--focus-ring` tokens as product surfaces.
- Product dashboard shell: `app/dashboard/dashboard.styles.ts` and dashboard components/hooks. Desktop sidebar supports an icon-only collapsed state; mobile navigation remains a separate menu.
- Split planner: `app/dashboard/split-system.styles.ts`, `app/dashboard/split-manager.tsx`, `app/dashboard/split-assistant-panel.tsx`, and related hooks. The split view uses a split-library sidebar plus the weekday grid/editor work area. The dotted `Ask Ben` sidebar item replaces the main work area with the assistant panel. Split summary actions are icon-only with accessible labels; active state is communicated by icon and sidebar metadata.
- Workout logger: `app/workouts/new/workout-logger.styles.ts` and logger components/hooks.
- Workout detail: `app/workouts/[workoutId]/workout-detail.styles.ts`.
- Exercise detail: `app/exercises/[exerciseKey]/exercise-detail.styles.ts`.
- Public profiles: `app/u/[username]/public-profile.styles.ts`.
- Research/editorial pages: `app/research/page.styles.ts`.

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

## Component Conventions

- Shared public primitives are re-exported from `app/components/ui.tsx`.
- Dashboard/product screens mostly use local style objects instead of a centralized component library.
- Keep new UI consistent with the nearest local surface before adding shared abstractions.
- Prefer existing helper `cn()` implementations for class composition in the local folder.
- Avoid nested card patterns in product surfaces; use sections, rows, lists, borders, and spacing.
- Keep filters, split editing, profile editing, and logger controls feature-complete rather than decorative.
- Assistant-generated split previews should remain scannable: show weekday, workout type, and generated exercise/set rows directly in the preview instead of hiding the useful structure behind decorative cards.
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
