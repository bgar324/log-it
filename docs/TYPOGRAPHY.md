# Typography

Typography should make training data easy to scan. Logit uses a quiet, direct, operational tone rather than marketing or editorial display patterns.

## Foundations

- `app/layout.tsx` imports `GeistSans` from `geist` and attaches its CSS variable to `<html>`.
- `app/globals.css` defines `--font-body`, `--font-heading`, and `--font-mono`.
- Body and heading fonts resolve to Geist Sans.
- Mono text uses the system monospace stack and should be reserved for code-like or technical identifiers; it is not a globally preloaded webfont.
- Body letter spacing defaults to `-0.03em` and inherits normally. It is not forced onto every element with `!important`, so specialized controls and numeric text can override tracking.
- Body line height defaults to `1.45`.
- Form controls inherit font settings through the Tailwind base layer.

## Rules

- Do not use uppercase styling or all-caps labels for hierarchy.
- Do not introduce alternate tracking values; use `-0.03em` for new/touched text.
- Muted title metadata is allowed for concrete context such as dates, workout types, last-hit status, or preview status. Keep it natural-case, untracked, and visually secondary; do not use uppercase eyebrow styling as a reusable hierarchy pattern.
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

## Landing Type Scale

The public site (landing, research, papers, legal, changelog, auth) uses four roles. These are fixed roles, not a menu of interchangeable display styles.

| Role | Desktop size / line height | Phone size / line height | Use |
| --- | --- | --- | --- |
| Navigation | `0.875rem / 1.25rem` | `0.8125rem / 1.125rem` | Header and footer links |
| Action and body | `1rem / 1.5rem` | `0.9375rem / 1.40625rem` | Buttons and explanatory copy |
| Product statement | `1.625rem / 2.03125rem` | `1.5234375rem / 1.9043rem` | The single hero heading |
| Feature statement | `1.375rem / 1.7875rem` | `1.25rem / 1.625rem` | Section-leading product claims |

Landing headings use regular weight. Scale comes from placement and negative space, not heavy weight or oversized display type. A section may contain a muted continuation within the same heading, but it does not receive a separate eyebrow label.

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
- `app/research/index.module.css` and `app/components/public-article.module.css`: public research list and long-form article typography; content prose (`legal-*`) lives in `app/globals.css`.

## Known Drift

- Tailwind active-state overrides sometimes need `!` modifiers when base and state classes set the same property.
