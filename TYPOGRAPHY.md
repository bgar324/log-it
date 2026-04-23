# Typography and UI Language

This file is a living snapshot of the current codebase, not a strict token contract.
The old "single five-tier scale" story is no longer accurate. The app now has two main
typography tracks plus one editorial variant:

- Product surfaces: dashboard, split planner, workout logger, workout detail, exercise detail
- Public surfaces: landing/auth/public-shell components built around `PublicPageShell` and `ui/*`
- Editorial surface: research/methodology content

## Foundations

- `app/globals.css` defines `--font-body` and `--font-heading`. Both currently resolve to the same
  Inter-based stack, but headings still opt into `var(--font-heading)` so the family can diverge later.
- `body` defaults to `line-height: 1.45`. Research intentionally loosens body copy to `1.6`.
- Keep `@layer base { button, input, textarea, select { font: inherit; } }`. In Tailwind v4 this is
  required so utility font sizes on form controls actually win.
- Casing is mixed case or title case. Do not add `uppercase`.
- Tracking is negative or neutral only. Do not add positive tracking.

## System Split

### Public shell

Public/auth surfaces are heading-led and visibly more spacious than the product shell.

- Hero headlines use large responsive display sizes such as `text-5xl sm:text-6xl lg:text-7xl`
  with `tracking-[-0.08em]`.
- Shared public section headers and stat values sit at `text-4xl` or `text-2xl` with
  `tracking-[-0.06em]` or `tracking-[-0.04em]`.
- Supporting copy is usually `text-sm`, `text-base`, or `text-lg` with generous leading
  (`leading-6` or `leading-7`).
- Public cards are soft and rounded: `rounded-[28px]` to `rounded-[32px]`, semantic `--app-*`
  color tokens, subtle blur, and larger spacing.

### Product shell

Product surfaces are denser, quieter, and mostly monochrome.

- The strongest recurring anchors are `0.72rem` for meta/supporting text and `0.84rem` for
  primary UI/body text.
- Compact action pills frequently use `0.76rem` or `0.78rem`. Those are no longer outliers;
  they are part of the current dense-control language.
- Product displays use `clamp(...)` values rather than a single fixed token.
- Borders, spacing, and weight do more work than casing or tracking.

### Editorial research

Research pages keep the same overall palette but use a more document-like rhythm.

- Body copy sits around `0.86rem` to `0.9rem` with `leading-[1.6]`.
- Research titles still use negative tracking, but the page is less compressed than dashboard/product UI.
- Tables and equations use explicit numeric and alignment utilities instead of dashboard card conventions.

## Actual Size Bands

These are the real ranges currently in use across the repo.

| Band | Common values in code | Typical use |
|------|------------------------|-------------|
| Micro | `11px`, `0.64rem`, `0.65rem`, `0.67rem`, `0.68rem` | Eyebrows, field labels, table headers, set labels, compact meta pills |
| Secondary | `0.71rem` to `0.78rem` | Muted meta, timestamps, action labels, toasts, pagination text, workout-detail action pills |
| Body / compact UI | `0.82rem` to `0.92rem` | Table data, descriptions, inputs, most product buttons, research copy |
| Section | `1rem` to `1.35rem` | Panel titles, exercise names, split-editor titles, research card titles |
| Display | `clamp(...)`, `text-4xl`, `text-5xl`, `text-6xl`, `text-7xl` | Page titles, KPI numerics, public hero headlines |

Do not force new work into a fake universal scale. Match the local surface you are editing.

## Display Patterns

| Surface | Pattern |
|---------|---------|
| Dashboard title | `clamp(1.55rem,6.8vw,2.2rem)` with `tracking-[-0.03em]` and `font-[540]` |
| Workout logger title | `clamp(1.8rem,7vw,2.35rem)` with `tracking-[-0.02em]` and `font-[560]` |
| Workout detail / exercise detail titles | `clamp(1.35rem,5vw,...)` with `tracking-[-0.02em]` |
| Research title | `clamp(1.35rem,5vw,1.7rem)` with `tracking-[-0.04em]` |
| Public hero | `text-5xl sm:text-6xl lg:text-7xl` with `tracking-[-0.08em]` |
| Public page header / stat value | `text-4xl` or `text-2xl` with `tracking-[-0.06em]` or `tracking-[-0.04em]` |
| KPI numerics | `tracking-[-0.05em]`, `font-[520]`, often `leading-none` |

## Weight and Tracking

### Font weights

| Weight | Current role |
|--------|--------------|
| `font-[560]` | Default emphatic heading weight across product UI, research cards, and many compact numeric labels |
| `font-[540]` | Dashboard page title |
| `font-[520]` | Brand logotype and large KPI/value numerics |
| `font-semibold` | Public micro labels and small emphasis lines |
| `font-medium` | Table headers and a few public value rows |
| unset / normal | Supporting copy and most body text |

### Tracking

- `-0.08em`: public hero headlines and the public logotype
- `-0.06em`: public page headers and large stat values
- `-0.05em`: dashboard brand and KPI numerics
- `-0.04em`: research title, public card titles, empty states
- `-0.03em`: dashboard title, research card titles, medium display headings
- `-0.02em`: workout logger and detail-page titles
- `-0.015em`: panel titles and section headings
- `-0.01em`: compact titles and the occasional dense button label
- `0`: tolerated for a few tiny meta labels
- none: default for almost all labels, table text, and body copy

## Line Height and Rhythm

- `leading-none` and `leading-[0.98]` to `leading-[1.08]`: high-emphasis display numerics and hero titles
- `leading-[1.1]` to `leading-[1.25]`: panel titles, exercise names, compact value blocks
- `1.45`: global body default
- `1.5` to `1.6`: research copy, explanatory text, and legal/auth supporting paragraphs

## Text Color Patterns

| Token or mix | Usage |
|--------------|-------|
| `var(--text)` | Primary text |
| `var(--muted)` | Secondary labels, support copy, table headers |
| `color-mix(in_srgb,var(--text)_92%,var(--muted))` | Softened table/body data |
| `color-mix(in_srgb,var(--text)_88%,var(--muted))` | Slightly dimmed primary values such as calendar-day text or research intro copy |
| `#2f7b4d`, `#b13d48`, `#a43838` | Status, destructive, and error states |

## Design Patterns Adjacent to Type

Typography is now tied closely to control styling, not just text size.

- Public surfaces use large headings, generous spacing, `SurfaceCard`, and rounded 28-32px frames.
- Product surfaces use transparent backgrounds, thin monochrome borders, tight spacing, and lower-contrast meta text.
- Small labels now rely on size, weight, and color rather than uppercase or positive tracking.
- Tables generally follow: muted `font-medium` headers around `0.65rem` to `0.72rem`, body cells around
  `0.81rem` to `0.84rem`, softened with `color-mix(...)`.
- Numeric contexts use tabular figures where comparison matters, such as date input and research equations.

## Button and Interaction Pattern

The current repo-wide button pass should be treated as part of the design language.

- Interactive controls use sentence case, not uppercase.
- If it behaves like a button, it should look clickable: `cursor-pointer`.
- Keyboard focus is explicit: `focus-visible:outline-2 ...` or `.app-focus-ring`.
- Motion is subtle and consistent: short transitions plus `active:translate-y-[1px]` or `active:translate-y-px`.
- Product buttons are usually pills or `0.5rem` to `0.58rem` rounded rectangles with monochrome borders.
- Public buttons are larger, softer, and built from the semantic `--app-*` tokens.

Reference implementations:

- `app/globals.css` for `.btn`, `.theme-icon-toggle`, `.back-link`, `.legal-nav-link`, `.switch-option`
- `app/components/ui/link-button.tsx` for public link-style buttons
- `app/dashboard/dashboard.styles.ts` and `app/dashboard/split-system.styles.ts` for shared product button motion/focus helpers

## File Map

### `app/globals.css`

Public/auth/legal foundation. Defines font tokens, base line height, control font inheritance, shared
focus-ring behavior, auth/legal copy sizes, and the non-Tailwind button styles.

### `app/components/public-page-shell.tsx`

Public hero shell. This is the clearest reference for current public-page display scale:
large hero, supporting deck, small eyebrow, and larger rounded card framing.

### `app/components/ui/cards.tsx`

Shared public-card language. Use this to match section headers, public page headers, and card title/body ratios.

### `app/components/ui/display.tsx`

Shared public display primitives for stat cards, meta pills, and empty states.

### `app/components/ui/link-button.tsx`

Reference for public action buttons and sentence-case link-as-button styling.

### `app/dashboard/dashboard.styles.ts`

Primary product-shell reference. Use this file to match dashboard headings, KPI numerics, table headers,
pagination, nav labels, and compact control sizing.

### `app/dashboard/split-system.styles.ts`

Reference for split-planner editor typography: dense controls, `1rem` section titles, `0.72rem` meta,
and `0.84rem` working-copy body text.

### `app/workouts/new/workout-logger.styles.ts`

Dense mobile-first form language. This file is the best reference for touch-friendly inputs, compact labels,
exercise meta, inline compare blocks, and form action sizing.

### `app/workouts/[workoutId]/workout-detail.styles.ts`

Compact detail-page language. Use this for pill actions, dense data tables, compact meta pills,
and low-friction secondary information.

### `app/exercises/[exerciseKey]/exercise-detail.styles.ts`

Reference for historical data views: KPI rail, chart panel headings, session rows, and border-separated tables.

### `app/research/page.styles.ts`

Editorial variant. Use this when the content reads like documentation or methodology rather than app UI.

## Guardrails

- Match the local surface before introducing new sizes or weights.
- On product pages, prefer the existing anchors: `0.72rem`, `0.84rem`, `1rem`, and local `clamp(...)` titles.
- On public pages, prefer the existing heading ladder: `text-sm` support copy, `text-2xl`/`text-4xl` section headers,
  and `text-5xl+` heroes.
- Do not add uppercase utility classes.
- Do not add positive tracking values.

## Active State Override Pattern

Tailwind v4 generates utility CSS in property-alphabetical order. When a base class and a modifier
class set the same property, the alphabetically later value can win even when the modifier should override it.

Use `!` on the modifier when a conditional state needs to beat the base class.

```ts
calendarDay: "... bg-[var(--surface)] border-[var(--dashboard-border)] ...",
calendarDayActive: "!bg-[var(--calendar-active-bg)] !border-[var(--calendar-active-border)] ...",
```

Apply this pattern to any conditional state where the override must win predictably.
