-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN "bmrCalories" INTEGER;

-- AlterTable
ALTER TABLE "public"."WorkoutSet" ADD COLUMN "durationSeconds" INTEGER;

-- CreateTable
CREATE TABLE "public"."NutritionEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "calories" INTEGER NOT NULL DEFAULT 0,
    "proteinGrams" DECIMAL(8,1) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BodyWeightEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weightLb" DECIMAL(8,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyWeightEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NutritionEntry_userId_date_idx" ON "public"."NutritionEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionEntry_userId_date_key" ON "public"."NutritionEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "BodyWeightEntry_userId_date_idx" ON "public"."BodyWeightEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BodyWeightEntry_userId_date_key" ON "public"."BodyWeightEntry"("userId", "date");

-- AddForeignKey
ALTER TABLE "public"."NutritionEntry" ADD CONSTRAINT "NutritionEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BodyWeightEntry" ADD CONSTRAINT "BodyWeightEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
