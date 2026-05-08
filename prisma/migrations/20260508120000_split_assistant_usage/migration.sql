-- CreateTable
CREATE TABLE "SplitAssistantUsage" (
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "generatedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitAssistantUsage_pkey" PRIMARY KEY ("userId","date")
);

-- CreateIndex
CREATE INDEX "SplitAssistantUsage_date_idx" ON "SplitAssistantUsage"("date");

-- AddForeignKey
ALTER TABLE "SplitAssistantUsage" ADD CONSTRAINT "SplitAssistantUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
