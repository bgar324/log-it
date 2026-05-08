ALTER TABLE "public"."WorkoutSplit"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false;

UPDATE "public"."WorkoutSplit"
SET "isActive" = true;

DROP INDEX IF EXISTS "public"."WorkoutSplit_userId_key";

CREATE INDEX "WorkoutSplit_userId_isActive_idx"
ON "public"."WorkoutSplit"("userId", "isActive");

CREATE INDEX "WorkoutSplit_userId_updatedAt_idx"
ON "public"."WorkoutSplit"("userId", "updatedAt");
