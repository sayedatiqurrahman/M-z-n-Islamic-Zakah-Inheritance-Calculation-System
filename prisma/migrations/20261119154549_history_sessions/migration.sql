-- AlterTable
ALTER TABLE "inheritance_case" ADD COLUMN     "anonymousId" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "zakah_calculation" ADD COLUMN     "anonymousId" TEXT,
ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "anonymous_preference" (
    "id" TEXT NOT NULL,
    "anonymousId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "nisabMethod" "NisabMethod" NOT NULL DEFAULT 'SILVER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anonymous_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_preference_anonymousId_key" ON "anonymous_preference"("anonymousId");

-- CreateIndex
CREATE INDEX "inheritance_case_anonymousId_createdAt_idx" ON "inheritance_case"("anonymousId", "createdAt");

-- CreateIndex
CREATE INDEX "zakah_calculation_anonymousId_createdAt_idx" ON "zakah_calculation"("anonymousId", "createdAt");
