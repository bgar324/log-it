-- AlterTable
ALTER TABLE "public"."ExerciseSummary" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."WorkoutCalendarDay" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."WorkoutLog" ALTER COLUMN "totalWeightLb" SET DATA TYPE DECIMAL,
ALTER COLUMN "performedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."WorkoutSet" ALTER COLUMN "weightLb" SET DATA TYPE DECIMAL;
