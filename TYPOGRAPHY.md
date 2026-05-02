# Typography and UI Language

This file is the source of truth for Logit's typography and UI text treatment.
It should describe the intended system, not every legacy class that currently
exists in the codebase.

Logit is a workout journal, so the interface should feel quiet, direct, and
operational. Typography should help people scan training data quickly without
turning the product into a marketing page or editorial layout.

## Non-Negotiables

- Do not use eyebrow text as a design pattern.
- Do not use uppercase styling for UI text.
- Use Geist across the application. Geist Sans is the default UI family; Geist
  Mono is reserved for code-like content.
- Use `-0.03em` letter spacing across the interface. This is the baseline, not a
  special display treatment.
- Do not introduce alternate tracking values for headings, metrics, buttons,
  cards, labels, or brand text.
- Do not use positive tracking for labels, captions, table headers, or meta
  text.
- Do not use all-caps labels for hierarchy. Use size, weight, color, spacing,
  and placement instead.
- Keep display text sized to its container. Large type belongs to page-level
  headers, not compact panels or controls.

If you find `tracking-*` or `letter-spacing` values that are not `-0.03em`,
normalize them when touching that surface. If you find `uppercase`,
`text-transform: uppercase`, or an `eyebrow` prop/class/name in existing code,
treat it as legacy drift to remove when touching that surface.

## Foundations

- `app/layout.tsx` imports `GeistSans` and `GeistMono` from the `geist` package
  and attaches their CSS variables to the root `<html>` element.
- `app/globals.css` defines `--font-body`, `--font-heading`, and `--font-mono`.
- `--font-body` and `--font-heading` resolve to Geist Sans.
- `--font-mono` resolves to Geist Mono and should be used only for code, keys,
  terminal-like output, hashes, or similarly technical identifiers.
- `body` sets the global `letter-spacing: -0.03em`.
- `body` defaults to `line-height: 1.45`.
- Research and legal copy may loosen to roughly `1.55` or `1.6` where long-form
  reading needs it.
- Keep `@layer base { button, input, textarea, select { font: inherit; } }`.
  In Tailwind v4 this keeps form controls aligned with local utility classes.
- Text should use natural casing: sentence case, title case, or user-entered
  casing depending on the content.

## Surface Model

The app has three typography contexts.

## Product Surfaces

Product surfaces include dashboard, split planner, workout logger, workout
detail, exercise detail, profile, and progress views.

These are dense working interfaces. They should be calm, monochrome, and easy to
scan repeatedly.

- Page titles: about `1.55rem` to `2.35rem`, usually responsive with `clamp(...)`.
- Section titles: about `1rem` to `1.35rem`.
- Primary UI/body text: about `0.82rem` to `0.92rem`.
- Secondary/meta text: about `0.71rem` to `0.78rem`.
- Micro labels: about `0.64rem` to `0.68rem`, used sparingly for form labels,
  table headers, and compact metadata.
- Desktop sidebar navigation and sidebar actions use `0.84rem`; smaller
  `0.72rem` labels felt undersized against the desktop product shell. The
  `logit` sidebar brand remains display-sized and should not be normalized down.
- Use `font-[520]` to `font-[560]` for product headings and numeric emphasis.
- Use normal weight or `font-medium` for labels and table headers.
- Do not add a separate eyebrow above titles. If context is needed, put it in
  regular supporting copy below the title or in adjacent metadata.

Good product hierarchy is:

- one clear page title
- compact section titles
- muted supporting copy
- tabular or aligned numbers where comparison matters
- visible borders and spacing for grouping

## Public Surfaces

Public surfaces include landing, auth, legal shell elements, and reusable
`app/components/ui/*` primitives.

These can be more spacious than the product shell, but should still avoid
marketing-style typography tricks.

- Public hero headings may be larger than product headings, but keep tracking
  normalized to `-0.03em`.
- Public cards may use larger section titles, but avoid nested cards and avoid
  decorative text layers.
- Supporting copy should carry explanation. Do not put explanatory prefaces in
  eyebrow text.
- Buttons and links use natural case.

The public shell should feel like the entrance to the same application, not a
separate campaign site.

## Editorial Surfaces

Research and methodology pages are the editorial variant.

- Body copy can sit around `0.86rem` to `0.95rem` with `line-height: 1.55` to
  `1.6`.
- Titles should be modest and readable, not hero-scale unless the whole page is
  intentionally a document cover.
- Equations, tables, and charts may use explicit numeric alignment.
- Do not use uppercase labels or tracked headings to make content feel
  "academic." Use structure and spacing instead.

## Type Bands

Use these bands as practical ranges, not a rigid token scale.

| Band | Range | Typical use |
|------|-------|-------------|
| Micro | `0.64rem` to `0.68rem` | Field labels, table headers, compact metadata |
| Secondary | `0.71rem` to `0.78rem` | Muted meta, timestamps, helper text, small action labels |
| Body / compact UI | `0.82rem` to `0.92rem` | Descriptions, inputs, buttons, table data, desktop sidebar labels, research copy |
| Section | `1rem` to `1.35rem` | Panel titles, exercise names, split-editor titles |
| Display | `1.55rem` and up | Page titles, KPI numerics, public headings |

Match the local surface before introducing a new size.

## Display Patterns

The app uses a consistent `-0.03em` tracking baseline. Do not introduce tighter
display-only values such as `-0.05em`, `-0.06em`, or `-0.08em`. New or touched
display text should follow these intentions:

| Surface | Intended pattern |
|---------|------------------|
| Dashboard title | Responsive page title, medium weight, `letter-spacing: -0.03em` |
| Workout logger title | Responsive page title, compact line height, `letter-spacing: -0.03em` |
| Workout detail title | Title plus regular metadata pills; no eyebrow |
| Exercise detail title | Exercise name as title, supporting sentence below |
| Research title | Document-style title, readable line height, `letter-spacing: -0.03em` |
| Public hero | Large heading if needed, normalized tracking, no eyebrow |
| KPI numerics | Tabular or aligned numbers where useful, normalized tracking |

## Weight

| Weight | Role |
|--------|------|
| `font-[560]` | Emphatic product headings and compact section titles |
| `font-[540]` | Page titles where `560` feels too heavy |
| `font-[520]` | Numeric emphasis and brand-adjacent display text |
| `font-semibold` | Occasional emphasis in public UI |
| `font-medium` | Table headers, labels, compact controls |
| normal | Body copy, descriptions, most metadata |

Weight should create hierarchy without changing casing or inventing new tracking
values.

## Line Height

- `1` to `1.08`: high-emphasis display text and compact numeric values.
- `1.1` to `1.25`: section titles, exercise names, dense value blocks.
- `1.45`: default body and general UI copy.
- `1.5` to `1.6`: legal, research, explanatory, and longer-form text.

Avoid compressed line-height on multi-line body copy.

## Color

| Token or mix | Usage |
|--------------|-------|
| `var(--text)` | Primary text |
| `var(--muted)` | Secondary labels, helper text, table headers |
| `color-mix(in_srgb,var(--text)_92%,var(--muted))` | Softened table/body data |
| `color-mix(in_srgb,var(--text)_88%,var(--muted))` | Slightly dimmed primary values |
| `#2f7b4d`, `#b13d48`, `#a43838` | Status, destructive, and error states |

Color should support hierarchy. Do not compensate for weak hierarchy with
uppercase or alternate letter spacing.

## Adjacent UI Rules

- Product pages use transparent backgrounds, thin monochrome borders, tight
  spacing, and direct labels.
- Public pages can use more generous spacing, but should still feel related to
  the product.
- Tables use muted medium-weight headers and compact body cells.
- Buttons use natural-case labels and clear affordance.
- If it behaves like a button, it should look clickable and use `cursor-pointer`.
- Keyboard focus must be visible through `.app-focus-ring` or a local
  `focus-visible` style.
- Motion should stay subtle: short transitions and small active-state movement.

## File Map

### `app/globals.css`

Foundation for font tokens, base line height, form-control inheritance, auth,
legal, public shell, and non-Tailwind shared button styles.

### `app/dashboard/dashboard.styles.ts`

Primary product-shell reference for dashboard headings, KPI values, table
headers, pagination, navigation labels, and compact controls. Desktop sidebar
navigation/action text should sit at `0.84rem`; keep the `logit` brand at its
larger display size.

### `app/dashboard/split-system.styles.ts`

Reference for split-planner typography: dense controls, compact section titles,
small metadata, and working-copy body text.

### `app/workouts/new/workout-logger.styles.ts`

Reference for mobile-first form typography, touch-friendly inputs, exercise
cards, comparison blocks, and form action sizing.

### `app/workouts/[workoutId]/workout-detail.styles.ts`

Reference for workout detail typography, dense data tables, action pills, and
secondary information. The existing `titleEyebrow` naming is legacy and should
not be copied.

### `app/exercises/[exerciseKey]/exercise-detail.styles.ts`

Reference for historical data views: KPI rail, chart panel headings, session
rows, and border-separated tables.

### `app/components/public-page-shell.tsx`

Public shell reference. Any eyebrow-like patterns are legacy drift; keep the
shell but remove those treatments when editing it. Hero tracking should remain
at the global `-0.03em` baseline.

### `app/components/ui/cards.tsx`

Shared public-card language. Existing `eyebrow` API is legacy drift and should
not be used in new code.

### `app/components/ui/display.tsx`

Shared public display primitives for stat cards, meta pills, and empty states.

### `app/components/ui/link-button.tsx`

Reference for public link-style buttons and sentence-case action labels.

### `app/research/page.styles.ts`

Editorial variant for research and methodology content.

## Cleanup Targets

The current codebase still contains older typography decisions. When touching a
surface, remove these locally instead of preserving them:

- `tracking-[...]` and `tracking-*`
- CSS `letter-spacing` values other than `-0.03em`
- `uppercase` and `text-transform: uppercase`
- class, variable, or prop names that make eyebrow text a reusable pattern
- title prefaces rendered as standalone eyebrow text

Prefer replacing eyebrow content with one of:

- a regular subtitle below the title
- a metadata pill in an existing meta row
- a table/chart label where it describes data
- no text, if it repeats the page title or surrounding context

## Guardrails

- Match the local surface before adding new sizes or weights.
- On product pages, prefer the existing anchors: `0.72rem`, `0.84rem`, `1rem`,
  and responsive page titles.
- In the desktop dashboard sidebar, use `0.84rem` for navigation and action
  labels. Reserve smaller `0.72rem` text for metadata and compact helper copy.
- On public pages, use larger type only when the layout genuinely needs it.
- Do not create hierarchy with casing or alternate tracking.
- Do not add eyebrow components, props, slots, or class names.
- Keep text readable at mobile and desktop widths.

## Active State Override Pattern

Tailwind v4 generates utility CSS in property-alphabetical order. When a base
class and a modifier class set the same property, the alphabetically later value
can win even when the modifier should override it.

Use `!` on the modifier when a conditional state needs to beat the base class.

```ts
calendarDay: "... bg-[var(--surface)] border-[var(--dashboard-border)] ...",
calendarDayActive: "!bg-[var(--calendar-active-bg)] !border-[var(--calendar-active-border)] ...",
```

Apply this pattern to any conditional state where the override must win
predictably.
