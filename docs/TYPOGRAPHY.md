# Typography

Typography should make training data easy to scan. Logit uses a quiet, direct, operational tone rather than marketing or editorial display patterns.

## Foundations

- `app/layout.tsx` imports `GeistSans` and `GeistMono` from `geist` and attaches their CSS variables to `<html>`.
- `app/globals.css` defines `--font-body`, `--font-heading`, and `--font-mono`.
- Body and heading fonts resolve to Geist Sans.
- Mono text resolves to Geist Mono and should be reserved for code-like or technical identifiers.
- Global letter spacing is `-0.03em`; `app/globals.css` currently enforces it broadly.
- Body line height defaults to `1.45`.
- Form controls inherit font settings through the Tailwind base layer.

## Rules

- Do not use uppercase styling or all-caps labels for hierarchy.
- Do not introduce alternate tracking values; use `-0.03em` for new/touched text.
- Do not add eyebrow text as a reusable design pattern.
- Use size, weight, spacing, placement, muted color, and borders for hierarchy.
- Keep display text sized to its container; compact panels and controls should not use hero-scale type.
- Use natural casing: sentence case, title case, or user-entered casing as appropriate.

## Type Bands

Use these as practical ranges, not a rigid token scale.

| Band | Range | Typical use |
| --- | --- | --- |
| Micro | `0.64rem` to `0.68rem` | Field labels, table headers, compact metadata |
| Secondary | `0.71rem` to `0.78rem` | Muted meta, timestamps, helper text, small action labels |
| Body / compact UI | `0.82rem` to `0.92rem` | Inputs, buttons, descriptions, table data, sidebar labels |
| Section | `1rem` to `1.35rem` | Panel titles, exercise names, split-editor titles |
| Display | `1.55rem` and up | Page titles, KPI numerics, public headings |

## Weight And Line Height

- Product headings and numeric emphasis commonly use `font-[520]` to `font-[560]`.
- Table headers, labels, and compact controls use medium weight or normal weight.
- Display text uses `line-height` around `1` to `1.08`.
- Section titles use `1.1` to `1.25`.
- Body copy uses `1.45`.
- Legal, research, and long-form explanatory copy may use `1.55` to `1.6`.

## Surface References

- `app/dashboard/dashboard.styles.ts`: primary product shell, sidebar, KPI, table, filter, profile, and skeleton typography.
- `app/dashboard/split-system.styles.ts`: split planner typography.
- `app/workouts/new/workout-logger.styles.ts`: mobile-first logger forms, exercise cards, comparison blocks, and action sizing.
- `app/workouts/[workoutId]/workout-detail.styles.ts`: workout detail tables and action pills.
- `app/exercises/[exerciseKey]/exercise-detail.styles.ts`: exercise history, charts, and session rows.
- `app/components/ui/cards.tsx`, `display.tsx`, `link-button.tsx`: shared public primitives.
- `app/research/page.styles.ts`: editorial research variant.

## Known Drift

- Some existing classes and prop names still use `eyebrow` or `tracking-*`. Treat these as legacy drift when touching that surface.
- Tailwind active-state overrides sometimes need `!` modifiers when base and state classes set the same property.
