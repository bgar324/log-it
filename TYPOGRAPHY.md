# Typography System

## Critical: Tailwind v4 + Buttons

`globals.css` wraps `button, input, textarea, select { font: inherit }` inside `@layer base`.
This is **required**. Without it, unlayered CSS has higher cascade priority than `@layer utilities`,
meaning every Tailwind `text-[*]` class on a `<button>` is silently ignored. Font sizes on
`<a>` links work without this fix; `<button>` elements do not.

---

## Type Scale — 5 Tiers

| Size | Token | Role |
|------|-------|------|
| `0.65rem` | micro | Table column headers (`[&_th]`), calendar weekday labels, Prev/Next calendar buttons, search result section labels |
| `0.72rem` | small | Sidebar nav labels, KPI labels, meta/muted info lines, dropdown menu items, table cell meta, pagination controls, form field labels (dashboard) |
| `0.84rem` | body | Table cell data (`[&_td]`), mobile menu items, search inputs, sidebar action text |
| `1rem` | ui | Panel titles, section headings, split editor section title, log-workout action link |
| `clamp(...)` | display | Page titles — each page has its own clamp range (see below) |

Do not introduce sizes outside this scale. The `0.76rem` and `0.78rem` values that appear in
`workout-logger.styles.ts` and `workout-detail.styles.ts` are legacy; they are tolerated on those
pages but should not be used for new work.

---

## Display / Page Title Sizes

Each page controls its own hero title via `clamp()`:

| Page | Style key | Value |
|------|-----------|-------|
| Dashboard | `styles.title` | `clamp(1.55rem, 6.8vw, 2.2rem)` |
| Workout logger | `styles.title` | `clamp(1.8rem, 7vw, 2.35rem)` |
| Workout detail | `styles.title` | `clamp(1.35rem, 5vw, 1.95rem)` |
| Exercise detail | `styles.title` | `clamp(1.35rem, 5vw, 2rem)` |
| Landing / auth | `.title` (global CSS) | `clamp(1.85rem, 6.2vw, 2.2rem)` |
| Research | `styles.paperTitle` | `clamp(1.35rem, 5vw, 1.7rem)` |

---

## Font Weights

| Weight | Usage |
|--------|-------|
| `font-[520]` | Metric main values, brand logotype |
| `font-[540]` | Dashboard page title |
| `font-[560]` | Panel titles, exercise titles, set numbers (mobile), split editor title |
| `font-medium` | Table column headers (via `[&_th]:font-medium`) |
| normal (unset) | Everything else |

---

## Color Tokens for Text

| Token | Usage |
|-------|-------|
| `var(--text)` | Primary content |
| `var(--muted)` | Secondary / supporting labels |
| `color-mix(in_srgb,var(--text)_92%,var(--muted))` | Table cell data (slightly softened) |
| `color-mix(in_srgb,var(--text)_88%,var(--muted))` | Calendar day numbers |
| `color-mix(in_srgb,var(--text)_78%,#ae2d2d)` | Sign-out menu item |
| `#2f7b4d` / `#b13d48` | Success / error status text |

---

## Tracking Conventions

- `-0.05em` — brand logotype, KPI values
- `-0.02em` to `-0.03em` — page display titles
- `-0.015em` — panel titles, section headings (1rem tier)
- `0.08em` + `uppercase` — table column headers, form field labels, research notation keys
- `0.04em` — search result section labels
- none — body and secondary text

---

## Line-Height Conventions

- `leading-none` (1) — KPI values, calendar day numbers
- `leading-[1.05]` to `leading-[1.15]` — display titles
- `1.45` (body default via `globals.css`) — body text, paragraphs
- `1.6` — research body copy

---

## File Map

### `app/globals.css`
Plain CSS classes for the landing page, auth, and legal pages. No Tailwind utilities.
Key sizes: `.title` (clamp), `.subtitle` (0.95rem), `.btn` (0.92rem), `.tos` (0.76rem), `.label` (0.67rem).

### `app/dashboard/dashboard.styles.ts`
The main dashboard shell, sidebar, calendar, tables, KPI cards, and user menu.
All sizes follow the 5-tier scale. `navButton`, `sidebarAction`, `dashboardMenuItem` at `0.72rem`;
`calendarNavButton` at `0.65rem`.

### `app/dashboard/split-system.styles.ts`
Split planner and editor panel. Follows the same scale.
`splitDayWeekday`, `splitDayMeta`, `editorLabel`, `status` at `0.72rem`;
`splitDayStats`, `inlineButton`, `primaryButton` at `0.84rem`;
`searchResultsLabel` at `0.65rem`; `editorTitle` at `1.35rem`.

### `app/workouts/[workoutId]/workout-detail.styles.ts`
Workout detail view. All action buttons (Edit, Copy, Duplicate, Delete) share `actionBase`
at `text-[0.76rem]`. This is the reference "correct size" for pill-style action buttons.

### `app/workouts/new/workout-logger.styles.ts`
Workout logging form. Uses `text-base` → `min-[620px]:text-[0.9rem]` on inputs (touch-friendly).
Labels at `0.68rem`, exercise meta at `0.72rem`, set head labels at `0.64rem` uppercase.

### `app/exercises/[exerciseKey]/exercise-detail.styles.ts`
Exercise history and chart view. Follows the 5-tier scale.
Table uses `border-separate` with `[&_th]` at `0.68rem`, `[&_td]` at `0.82rem` (slight deviation — acceptable).

### `app/research/page.styles.ts`
Research/methodology page. Uses `0.86rem` body copy and `0.76rem` uppercase keys — intentionally
denser than the app UI. Do not apply dashboard scale here.

---

## Active State Override Pattern

Tailwind v4 generates utility CSS in property-alphabetical order. When a base class and a modifier
class set the same property (e.g. `bg-[var(--surface)]` + `bg-[var(--calendar-active-bg)]`), the
alphabetically-later value wins — which may be the wrong one.

**Fix**: prefix the modifier's conflicting utilities with `!` to force `!important`.

```ts
// dashboard.styles.ts
calendarDay: "... bg-[var(--surface)] border-[var(--dashboard-border)] ...",
calendarDayActive: "!bg-[var(--calendar-active-bg)] !border-[var(--calendar-active-border)] ...",
```

Apply this pattern to any element where a conditional class overrides a layout/base class property.