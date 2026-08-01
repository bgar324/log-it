# Test Suites

This project uses a small TypeScript + Node test harness for deterministic logic tests.

## How It Works

1. `scripts/run-tests.mjs` deletes `.tests-dist/`.
2. `tsc -p tsconfig.test.json` compiles `tests/**/*.ts` and the referenced `lib/` modules into `.tests-dist/`.
3. Node's built-in test runner executes the compiled `.test.js` files.

The tests are intentionally focused on application integrity:
- payload normalization
- split scheduling rules
- weight conversion and totals
- export formatting
- date handling and weekly ordering

These are the parts of the app that can silently corrupt data if they regress.

## Folder Layout

- `tests/*.test.ts`
  General regression tests for core helpers and payload parsers.
- `tests/suites/features/*.test.ts`
  Feature-level tests for the actual workout flows behind create, edit, delete, and duplicate.
- `tests/suites/integrity/*.test.ts`
  Higher-pressure invariants that challenge end-to-end business logic across multiple modules.
- `tests/suites/rendering/*.test.tsx`
  Component tests that mount real React trees in jsdom and assert on the DOM.

## Rendering Suite

Everything above tests logic that returns values. The rendering suite covers the
regressions that logic tests structurally cannot see: a lazily loaded chart that
mounts nothing, a reveal button that never appears, a list showing the wrong
slice. `tsc` and `eslint` pass on all of those.

Support modules, imported in this order:

- `dom.ts` installs jsdom globals as a side effect, and must load before
  `react-dom`. It also fakes a fixed element box and a synchronous
  `ResizeObserver`, without which recharts refuses to mount in a layout-less DOM.
- `alias.ts` teaches CommonJS the `@/*` path mapping. `tsc` resolves the alias
  for types but leaves the emitted `require()` calls alone.
- `render.ts` is a small mount helper: `all`, `findByText`, `click`, `rerender`,
  `unmount`.

Components under test must be listed in `include` in `tsconfig.test.json`.

See `CLAUDE.md` for which changes are expected to come with a rendering test.

## How To Run

Run every test:

```bash
npm test
```

Run only the integrity suite:

```bash
npm run test:integrity
```

Run only the rendering suite:

```bash
npm run test:rendering
```

Run only the feature suite:

```bash
npm run test:features
```

## Adding More Integrity Tests

Put new files in `tests/suites/integrity/` when the test validates a critical invariant, for example:
- workout totals matching exported data
- no duplicate weekdays after split reordering
- date-only workout inputs preserving the intended schedule
- Pacific day-boundary handling

Prefer pure logic tests over UI snapshots. They are faster, more stable, and better at catching data integrity regressions. Reach for the rendering suite only when the regression is something a user would see rather than something a value would get wrong — see `CLAUDE.md` for that boundary.

## What Is Covered Today

- Core helpers and payload parsers.
- Workout export formatting.
- Integrity invariants for scheduling and workout math.
- Date-only workout storage and Pacific day boundaries.
- Feature-level workout service behavior:
  create, edit, delete, and duplicate.

- Component rendering for the dashboard workout history and nutrition charts,
  including lazy-loading boundaries and the recharts import split.

## What Is Not Covered Yet

- Browser-driven UI flows in the logger.
- Real layout and paint. jsdom has no layout engine, so a chart can mount an SVG
  here and still be invisible in a browser. These tests catch "it rendered
  nothing", not "it looks wrong".
- Full API + database integration against a live test database.

Those are the next layers if you want maximum confidence beyond service-level tests.
