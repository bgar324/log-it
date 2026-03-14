ALTER TABLE "public"."Exercise"
ALTER COLUMN "lastPerformedAt" TYPE DATE
USING CASE
  WHEN "lastPerformedAt" IS NULL THEN NULL
  ELSE "lastPerformedAt"::date
END;

ALTER TABLE "public"."WorkoutLog"
ALTER COLUMN "performedAt" DROP DEFAULT,
ALTER COLUMN "performedAt" TYPE DATE
USING "performedAt"::date,
ALTER COLUMN "performedAt" SET DEFAULT CURRENT_DATE;
