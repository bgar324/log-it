CREATE TABLE "public"."ExerciseSummary" (
    "userId" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "setCount" INTEGER NOT NULL DEFAULT 0,
    "totalReps" INTEGER NOT NULL DEFAULT 0,
    "bestWeightLb" DECIMAL NOT NULL DEFAULT 0,
    "lastPerformedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseSummary_pkey" PRIMARY KEY ("userId","normalizedName")
);

CREATE TABLE "public"."WorkoutCalendarDay" (
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "workoutCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutCalendarDay_pkey" PRIMARY KEY ("userId","date")
);

CREATE INDEX "ExerciseSummary_userId_lastPerformedAt_idx"
ON "public"."ExerciseSummary"("userId", "lastPerformedAt");

CREATE INDEX "WorkoutCalendarDay_userId_date_idx"
ON "public"."WorkoutCalendarDay"("userId", "date");

ALTER TABLE "public"."ExerciseSummary"
ADD CONSTRAINT "ExerciseSummary_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."WorkoutCalendarDay"
ADD CONSTRAINT "WorkoutCalendarDay_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
