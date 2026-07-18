-- Repair any historical races before making the single-active-split invariant
-- database-enforced. The most recently updated split remains active.
WITH ranked_splits AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userId"
      ORDER BY "updatedAt" DESC, "id" DESC
    ) AS row_number
  FROM "public"."WorkoutSplit"
  WHERE "isActive" = true
)
UPDATE "public"."WorkoutSplit" split
SET "isActive" = false
FROM ranked_splits ranked
WHERE split."id" = ranked."id"
  AND ranked.row_number > 1;

-- PostgreSQL partial unique index: each user may have zero or one active split.
CREATE UNIQUE INDEX "WorkoutSplit_one_active_per_user"
ON "public"."WorkoutSplit"("userId")
WHERE "isActive" = true;
