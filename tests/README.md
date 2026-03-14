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

## How To Run

Run every test:

```bash
npm test
```

Run only the integrity suite:

```bash
npm run test:integrity
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

Prefer pure logic tests over UI snapshots. They are faster, more stable, and better at catching data integrity regressions.

## What Is Covered Today

- Core helpers and payload parsers.
- Workout export formatting.
- Integrity invariants for scheduling and workout math.
- Date-only workout storage and Pacific day boundaries.
- Feature-level workout service behavior:
  create, edit, delete, and duplicate.

## What Is Not Covered Yet

- Browser-driven UI flows in the logger.
- Full API + database integration against a live test database.

Those are the next layers if you want maximum confidence beyond service-level tests.
