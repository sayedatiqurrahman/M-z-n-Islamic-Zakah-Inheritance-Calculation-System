-- CreateEnum
CREATE TYPE "MadhhabKey" AS ENUM ('HANAFI', 'SHAFI', 'MALIKI', 'HANBALI');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'REFERENCE_REQUIRED', 'VERIFIED_BY_SCHOLAR', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ImplementationStatus" AS ENUM ('NOT_IMPLEMENTED', 'IN_PROGRESS', 'IMPLEMENTED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "RuleDomain" AS ENUM ('ZAKAH', 'INHERITANCE', 'SHARED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('QURAN', 'HADITH', 'CLASSICAL', 'CONTEMPORARY', 'INSTITUTIONAL');

-- CreateEnum
CREATE TYPE "AuthenticityStatus" AS ENUM ('SAHIH', 'HASAN', 'DAIF', 'MAWDU', 'DISPUTED', 'UNVERIFIED');

-- CreateEnum
CREATE TYPE "NisabMethod" AS ENUM ('GOLD', 'SILVER');

-- CreateEnum
CREATE TYPE "Metal" AS ENUM ('GOLD', 'SILVER');

-- CreateEnum
CREATE TYPE "PriceSource" AS ENUM ('LIVE', 'MANUAL');

-- CreateEnum
CREATE TYPE "ZakahAssetCategory" AS ENUM ('CASH_HOME', 'CASH_BANK', 'SAVINGS', 'CURRENT_ACCOUNT', 'FOREIGN_CURRENCY', 'DIGITAL_MONEY', 'GOLD_JEWELRY', 'GOLD_INVESTMENT', 'GOLD_BARS', 'GOLD_COINS', 'SILVER_JEWELRY', 'SILVER_INVESTMENT', 'SILVER_BARS', 'BUSINESS_MERCHANDISE', 'BUSINESS_INVENTORY', 'BUSINESS_RECEIVABLE', 'BUSINESS_CASH', 'SHARES_STOCKS', 'OTHER_INVESTMENT', 'OTHER_ASSET');

-- CreateEnum
CREATE TYPE "LiabilityType" AS ENUM ('IMMEDIATE_DEBT', 'BUSINESS_LIABILITY', 'OTHER_DEDUCTIBLE', 'LONG_TERM_LOAN', 'NON_DEDUCTIBLE');

-- CreateEnum
CREATE TYPE "HawlStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "HeirType" AS ENUM ('HUSBAND', 'WIFE', 'FATHER', 'MOTHER', 'PATERNAL_GRANDFATHER', 'PATERNAL_GRANDMOTHER', 'MATERNAL_GRANDMOTHER', 'SON', 'DAUGHTER', 'SONS_SON', 'SONS_DAUGHTER', 'FULL_BROTHER', 'FULL_SISTER', 'PATERNAL_BROTHER', 'PATERNAL_SISTER', 'MATERNAL_BROTHER', 'MATERNAL_SISTER', 'FULL_BROTHERS_SON', 'PATERNAL_BROTHERS_SON', 'PATERNAL_UNCLE', 'FULL_PATERNAL_UNCLE', 'OTHER_AGNATIC', 'DISTANT_KINDRED');

-- CreateEnum
CREATE TYPE "HeirStatus" AS ENUM ('ELIGIBLE', 'EXCLUDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "ExclusionKind" AS ENUM ('NONE', 'PARTIAL', 'COMPLETE');

-- CreateEnum
CREATE TYPE "ShareType" AS ENUM ('FIXED', 'RESIDUARY', 'DISTANT_KINDRED');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('NONE', 'AWL', 'RADD');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('ZAKAH', 'INHERITANCE');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('en', 'ar', 'bn');

-- CreateTable
CREATE TABLE "madhhab" (
    "id" TEXT NOT NULL,
    "key" "MadhhabKey" NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "madhhab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "methodology_version" (
    "id" TEXT NOT NULL,
    "madhhabId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "methodology_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiqh_rule" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "madhhabId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "domain" "RuleDomain" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceReference" TEXT,
    "externalUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "implementationStatus" "ImplementationStatus" NOT NULL DEFAULT 'NOT_IMPLEMENTED',
    "testCases" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiqh_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiqh_explanation" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "titleAr" TEXT,
    "titleEn" TEXT NOT NULL,
    "titleBn" TEXT,
    "definition" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "hanafiRuling" TEXT,
    "example" TEXT,
    "notes" TEXT,

    CONSTRAINT "fiqh_explanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiqh_topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleBn" TEXT NOT NULL,
    "body_en" TEXT NOT NULL,
    "body_ar" TEXT,
    "body_bn" TEXT,
    "definition" TEXT,
    "hanafiRuling" TEXT,
    "practicalExample" TEXT,
    "relatedScenario" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "referenceIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiqh_topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference" (
    "id" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "title" TEXT NOT NULL,
    "arabicTitle" TEXT,
    "author" TEXT,
    "volume" TEXT,
    "page" TEXT,
    "chapter" TEXT,
    "publisher" TEXT,
    "edition" TEXT,
    "passage" TEXT,
    "explanationEn" TEXT,
    "explanationBn" TEXT,
    "supportedRuleId" TEXT,
    "externalUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'REFERENCE_REQUIRED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quranic_evidence" (
    "id" TEXT NOT NULL,
    "surah" TEXT NOT NULL,
    "ayahNumber" INTEGER NOT NULL,
    "arabicText" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "translationSource" TEXT,
    "principle" TEXT,
    "ruleId" TEXT,
    "externalUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'REFERENCE_REQUIRED',

    CONSTRAINT "quranic_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hadith_evidence" (
    "id" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "book" TEXT,
    "chapter" TEXT,
    "hadithNumber" TEXT,
    "authenticity" "AuthenticityStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "arabicText" TEXT,
    "translation" TEXT NOT NULL,
    "ruling" TEXT,
    "ruleId" TEXT,
    "externalUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'REFERENCE_REQUIRED',

    CONSTRAINT "hadith_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nisab_configuration" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "method" "NisabMethod" NOT NULL DEFAULT 'SILVER',
    "goldWeightGrams" DECIMAL(65,30) NOT NULL DEFAULT 85,
    "silverWeightGrams" DECIMAL(65,30) NOT NULL DEFAULT 595,
    "goldPurity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "silverPurity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "rationale" TEXT,
    "sourceReference" TEXT,
    "externalUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'REFERENCE_REQUIRED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nisab_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_price" (
    "id" TEXT NOT NULL,
    "metal" "Metal" NOT NULL,
    "pricePerGram" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "isManual" BOOLEAN NOT NULL DEFAULT true,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zakah_calculation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "madhhabId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "nisabConfigId" TEXT,
    "marketPriceId" TEXT,
    "currency" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL,
    "nisabFirstReachedDate" TIMESTAMP(3),
    "previousZakahDate" TIMESTAMP(3),
    "hijriAssessmentDate" TEXT,
    "inputSnapshot" JSONB NOT NULL,
    "unsupportedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zakah_calculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zakah_asset" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "category" "ZakahAssetCategory" NOT NULL,
    "label" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "weightGrams" DECIMAL(65,30),
    "purity" DECIMAL(65,30),
    "marketValue" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "convertedValue" DECIMAL(65,30) NOT NULL,
    "ruleId" TEXT,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,

    CONSTRAINT "zakah_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zakah_liability" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "type" "LiabilityType" NOT NULL,
    "label" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "convertedValue" DECIMAL(65,30) NOT NULL,
    "deductible" BOOLEAN NOT NULL DEFAULT false,
    "ruleId" TEXT,
    "reason" TEXT,

    CONSTRAINT "zakah_liability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zakah_result" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "totalAssets" DECIMAL(65,30) NOT NULL,
    "totalDeductible" DECIMAL(65,30) NOT NULL,
    "netWealth" DECIMAL(65,30) NOT NULL,
    "nisabValue" DECIMAL(65,30) NOT NULL,
    "nisabReached" BOOLEAN NOT NULL,
    "hawlStatus" "HawlStatus" NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL DEFAULT 0.025,
    "zakahPayable" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,

    CONSTRAINT "zakah_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inheritance_case" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "madhhabId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "unsupportedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inheritance_case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deceased_person" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "name" TEXT,
    "gender" "Gender" NOT NULL,
    "dateOfDeath" TIMESTAMP(3) NOT NULL,
    "movableAssets" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "immovableAssets" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cashAndBank" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "businessAssets" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otherAssets" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "funeralExpenses" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "debts" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "wasiyyah" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otherObligations" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "heirConsentToWasiyyah" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL,

    CONSTRAINT "deceased_person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heir" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "HeirType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "status" "HeirStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "exclusionKind" "ExclusionKind" NOT NULL DEFAULT 'NONE',
    "excludedById" TEXT,
    "reason" TEXT,
    "principle" TEXT,
    "referenceUrl" TEXT,
    "ruleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "heir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inheritance_result" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "grossEstate" DECIMAL(65,30) NOT NULL,
    "funeralExpenses" DECIMAL(65,30) NOT NULL,
    "debts" DECIMAL(65,30) NOT NULL,
    "validBequests" DECIMAL(65,30) NOT NULL,
    "netDistributable" DECIMAL(65,30) NOT NULL,
    "adjustment" "AdjustmentType" NOT NULL DEFAULT 'NONE',
    "baseNumerator" INTEGER NOT NULL DEFAULT 1,
    "baseDenominator" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inheritance_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inheritance_share" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "heirId" TEXT NOT NULL,
    "shareType" "ShareType" NOT NULL,
    "numerator" INTEGER NOT NULL,
    "denominator" INTEGER NOT NULL,
    "adjustedNumerator" INTEGER NOT NULL,
    "adjustedDenominator" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "reasonRuleId" TEXT,
    "explanation" TEXT,

    CONSTRAINT "inheritance_share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculation_step" (
    "id" TEXT NOT NULL,
    "ownerType" "OwnerType" NOT NULL,
    "zakahCalculationId" TEXT,
    "inheritanceCaseId" TEXT,
    "step" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "calculation" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "fiqhPrinciple" TEXT,
    "reason" TEXT,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "references" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT[],
    "ruleId" TEXT,

    CONSTRAINT "calculation_step_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "madhhab_key_key" ON "madhhab"("key");

-- CreateIndex
CREATE INDEX "methodology_version_madhhabId_isActive_idx" ON "methodology_version"("madhhabId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "methodology_version_madhhabId_version_key" ON "methodology_version"("madhhabId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_userId_key" ON "user_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fiqh_rule_ruleId_key" ON "fiqh_rule"("ruleId");

-- CreateIndex
CREATE INDEX "fiqh_rule_versionId_domain_idx" ON "fiqh_rule"("versionId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "fiqh_explanation_ruleId_locale_key" ON "fiqh_explanation"("ruleId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "fiqh_topic_slug_key" ON "fiqh_topic"("slug");

-- CreateIndex
CREATE INDEX "fiqh_topic_category_published_idx" ON "fiqh_topic"("category", "published");

-- CreateIndex
CREATE INDEX "reference_type_idx" ON "reference"("type");

-- CreateIndex
CREATE UNIQUE INDEX "quranic_evidence_surah_ayahNumber_key" ON "quranic_evidence"("surah", "ayahNumber");

-- CreateIndex
CREATE INDEX "nisab_configuration_versionId_method_idx" ON "nisab_configuration"("versionId", "method");

-- CreateIndex
CREATE INDEX "market_price_metal_recordedAt_idx" ON "market_price"("metal", "recordedAt");

-- CreateIndex
CREATE INDEX "zakah_calculation_userId_createdAt_idx" ON "zakah_calculation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "zakah_asset_calculationId_idx" ON "zakah_asset"("calculationId");

-- CreateIndex
CREATE INDEX "zakah_liability_calculationId_idx" ON "zakah_liability"("calculationId");

-- CreateIndex
CREATE UNIQUE INDEX "zakah_result_calculationId_key" ON "zakah_result"("calculationId");

-- CreateIndex
CREATE INDEX "inheritance_case_userId_createdAt_idx" ON "inheritance_case"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "deceased_person_caseId_key" ON "deceased_person"("caseId");

-- CreateIndex
CREATE INDEX "heir_caseId_idx" ON "heir"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "inheritance_result_caseId_key" ON "inheritance_result"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "inheritance_share_heirId_key" ON "inheritance_share"("heirId");

-- CreateIndex
CREATE INDEX "inheritance_share_resultId_idx" ON "inheritance_share"("resultId");

-- CreateIndex
CREATE INDEX "calculation_step_ownerType_zakahCalculationId_idx" ON "calculation_step"("ownerType", "zakahCalculationId");

-- CreateIndex
CREATE INDEX "calculation_step_ownerType_inheritanceCaseId_idx" ON "calculation_step"("ownerType", "inheritanceCaseId");

-- AddForeignKey
ALTER TABLE "methodology_version" ADD CONSTRAINT "methodology_version_madhhabId_fkey" FOREIGN KEY ("madhhabId") REFERENCES "madhhab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiqh_rule" ADD CONSTRAINT "fiqh_rule_madhhabId_fkey" FOREIGN KEY ("madhhabId") REFERENCES "madhhab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiqh_rule" ADD CONSTRAINT "fiqh_rule_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "methodology_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiqh_explanation" ADD CONSTRAINT "fiqh_explanation_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "fiqh_rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference" ADD CONSTRAINT "reference_supportedRuleId_fkey" FOREIGN KEY ("supportedRuleId") REFERENCES "fiqh_rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quranic_evidence" ADD CONSTRAINT "quranic_evidence_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "fiqh_rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hadith_evidence" ADD CONSTRAINT "hadith_evidence_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "fiqh_rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisab_configuration" ADD CONSTRAINT "nisab_configuration_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "methodology_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zakah_calculation" ADD CONSTRAINT "zakah_calculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zakah_calculation" ADD CONSTRAINT "zakah_calculation_madhhabId_fkey" FOREIGN KEY ("madhhabId") REFERENCES "madhhab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zakah_calculation" ADD CONSTRAINT "zakah_calculation_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "methodology_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zakah_calculation" ADD CONSTRAINT "zakah_calculation_nisabConfigId_fkey" FOREIGN KEY ("nisabConfigId") REFERENCES "nisab_configuration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zakah_calculation" ADD CONSTRAINT "zakah_calculation_marketPriceId_fkey" FOREIGN KEY ("marketPriceId") REFERENCES "market_price"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zakah_asset" ADD CONSTRAINT "zakah_asset_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "zakah_calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zakah_liability" ADD CONSTRAINT "zakah_liability_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "zakah_calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zakah_result" ADD CONSTRAINT "zakah_result_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "zakah_calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inheritance_case" ADD CONSTRAINT "inheritance_case_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inheritance_case" ADD CONSTRAINT "inheritance_case_madhhabId_fkey" FOREIGN KEY ("madhhabId") REFERENCES "madhhab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inheritance_case" ADD CONSTRAINT "inheritance_case_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "methodology_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deceased_person" ADD CONSTRAINT "deceased_person_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "inheritance_case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heir" ADD CONSTRAINT "heir_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "inheritance_case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inheritance_result" ADD CONSTRAINT "inheritance_result_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "inheritance_case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inheritance_share" ADD CONSTRAINT "inheritance_share_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "inheritance_result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inheritance_share" ADD CONSTRAINT "inheritance_share_heirId_fkey" FOREIGN KEY ("heirId") REFERENCES "heir"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculation_step" ADD CONSTRAINT "calculation_step_zakahCalculationId_fkey" FOREIGN KEY ("zakahCalculationId") REFERENCES "zakah_calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculation_step" ADD CONSTRAINT "calculation_step_inheritanceCaseId_fkey" FOREIGN KEY ("inheritanceCaseId") REFERENCES "inheritance_case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculation_step" ADD CONSTRAINT "calculation_step_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "fiqh_rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
