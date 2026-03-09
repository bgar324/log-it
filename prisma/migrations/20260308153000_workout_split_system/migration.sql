-- CreateEnum
CREATE TYPE "public"."SplitWeekday" AS ENUM (
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
);

-- AlterTable
ALTER TABLE "public"."WorkoutLog"
ADD COLUMN "workoutType" TEXT,
ADD COLUMN "workoutTypeSlug" TEXT;

-- CreateTable
CREATE TABLE "public"."WorkoutSplit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Weekly Split',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkoutSplitDay" (
    "id" TEXT NOT NULL,
    "splitId" TEXT NOT NULL,
    "weekday" "public"."SplitWeekday" NOT NULL,
    "workoutType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSplitDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkoutSplitExercise" (
    "id" TEXT NOT NULL,
    "splitDayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "exerciseDisplayName" TEXT NOT NULL,
    "exerciseSlug" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSplitExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutLog_userId_workoutTypeSlug_idx"
ON "public"."WorkoutLog"("userId", "workoutTypeSlug");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSplit_userId_key" ON "public"."WorkoutSplit"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSplitDay_splitId_weekday_key"
ON "public"."WorkoutSplitDay"("splitId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSplitExercise_splitDayId_order_key"
ON "public"."WorkoutSplitExercise"("splitDayId", "order");

-- CreateIndex
CREATE INDEX "WorkoutSplitExercise_splitDayId_exerciseSlug_idx"
ON "public"."WorkoutSplitExercise"("splitDayId", "exerciseSlug");

-- AddForeignKey
ALTER TABLE "public"."WorkoutSplit"
ADD CONSTRAINT "WorkoutSplit_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutSplitDay"
ADD CONSTRAINT "WorkoutSplitDay_splitId_fkey"
FOREIGN KEY ("splitId") REFERENCES "public"."WorkoutSplit"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutSplitExercise"
ADD CONSTRAINT "WorkoutSplitExercise_splitDayId_fkey"
FOREIGN KEY ("splitDayId") REFERENCES "public"."WorkoutSplitDay"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
