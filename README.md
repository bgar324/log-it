# Logit

Logit is a lightweight workout journal built with Next.js App Router and Prisma.
It focuses on fast workout entry, exercise history, and progress views without
turning the product into a full social or coaching platform.

## Stack

- Next.js 16
- React 19
- Prisma + PostgreSQL
- Recharts

## Core Features

- Email/password auth with signed session cookies
- Workout logging with autosave on create
- Exercise suggestions and previous-session comparison while logging
- Dashboard views for weekly activity, history, and exercise progress
- Exercise detail pages with top-set and estimated 1RM trends
- Profile-level weight unit preference (`LB` or `KG`)
- Workout detail actions for edit, duplicate, and delete

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create env files with your Postgres connection details:

```bash
cp .env.local .env
```

3. Apply migrations:

```bash
npm run db:deploy
```

4. Start the dev server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Database Workflow

Use Prisma migrations as the default workflow:

```bash
npm run db:migrate
npm run db:deploy
npm run db:status
```

`npm run prisma:push` is still available for quick local prototyping, but the
tracked migration history should be the source of truth.

If you already have an existing database that matches the current schema and
need to baseline it against this repo, mark the baseline migration as applied:

```bash
npx prisma migrate resolve --applied 20260308120000_baseline
```

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run db:migrate
npm run db:deploy
npm run db:status
```

## Testing

The repo uses a lightweight TypeScript-to-Node test flow for pure modules:

```bash
npm run test
```

Current coverage focuses on:

- weight conversion helpers
- workout payload normalization and validation

## Product Notes

- All persisted workout weights are stored in pounds for consistency.
- User-facing weight display and workout entry respect the profile preference.
- Duplicating a workout creates a new workout at the current time and opens it
  in the edit flow.

## Deployment

Before deploying, make sure:

1. `AUTH_SECRET` is set.
2. `DATABASE_URL` and `DIRECT_URL` point at the correct Postgres instance.
3. `npm run db:deploy` has been run for the target environment.
4. `npm run build` passes locally.
