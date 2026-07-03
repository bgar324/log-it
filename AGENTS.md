# Logit Agent Guide

Logit is a Next.js App Router workout journal backed by Prisma and PostgreSQL. Read these files before broad changes:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for routes, data flow, Prisma models, auth, caching, and test layout.
- [docs/PRODUCT.md](docs/PRODUCT.md) for durable product behavior and constraints.
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) and [docs/TYPOGRAPHY.md](docs/TYPOGRAPHY.md) for UI conventions.
- [docs/DECISIONS.md](docs/DECISIONS.md) for durable implementation decisions.

Implementation defaults:

- Treat Logit as a mobile-first native app that happens to ship on the web. Design and build every surface phone-first, then scale up to desktop density. Prefer app-like affordances (full-width primary actions, generous touch targets, `[touch-action:manipulation]`, native input modes, subtle motion) over web-page conventions. When a layout choice trades desktop polish against phone feel, favor the phone.
- Keep persisted workout weights in pounds; convert only at input/output boundaries.
- Use `requireSessionUser()` for protected pages and `getSessionUser()` for API/auth branching.
- Put workout write behavior in `lib/workouts/*`, split behavior in `lib/workout-splits/*`, and dashboard loading behavior in `app/dashboard/data*`.
- After workout mutations, keep exercise/calendar read models and cache tags in sync.
- Prefer existing style objects and CSS variables over introducing new visual systems.
- Run focused tests with `npm test`, `npm run test:features`, or `npm run test:integrity` when changing data behavior.

## Documentation upkeep

When a change introduces durable architecture, conventions, routes, data model behavior, or product decisions, update the relevant docs. Do not document temporary implementation details.
