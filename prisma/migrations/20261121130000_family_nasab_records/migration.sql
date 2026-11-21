-- Family / Nasab records (owner-scoped, privacy-first)

CREATE TYPE "IdentityVerificationStatus" AS ENUM ('UNDECLARED', 'SELF_DECLARED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED');
CREATE TYPE "FamilyRelationType" AS ENUM ('PARENT_OF', 'SPOUSE_OF', 'SIBLING_OF', 'GUARDIAN_OF', 'OTHER');

CREATE TABLE "family_person" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" "Gender",
    "dateOfBirth" TIMESTAMP(3),
    "dateOfDeath" TIMESTAMP(3),
    "isDeceased" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "relationToOwner" TEXT,
    "notes" TEXT,
    "nidEncrypted" TEXT,
    "nidLast4" TEXT,
    "deathCertificateEncrypted" TEXT,
    "deathCertificateLast4" TEXT,
    "identityVerificationStatus" "IdentityVerificationStatus" NOT NULL DEFAULT 'UNDECLARED',
    "identityVerifiedAt" TIMESTAMP(3),
    "identityVerificationNote" TEXT,
    "linkedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_person_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "family_relationship" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "fromPersonId" TEXT NOT NULL,
    "toPersonId" TEXT NOT NULL,
    "relationType" "FamilyRelationType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_relationship_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "family_person_ownerUserId_createdAt_idx" ON "family_person"("ownerUserId", "createdAt");
CREATE INDEX "family_person_ownerUserId_fullName_idx" ON "family_person"("ownerUserId", "fullName");
CREATE INDEX "family_person_ownerUserId_isDeceased_idx" ON "family_person"("ownerUserId", "isDeceased");

CREATE UNIQUE INDEX "family_relationship_ownerUserId_fromPersonId_toPersonId_relationType_key" ON "family_relationship"("ownerUserId", "fromPersonId", "toPersonId", "relationType");
CREATE INDEX "family_relationship_ownerUserId_idx" ON "family_relationship"("ownerUserId");
CREATE INDEX "family_relationship_fromPersonId_idx" ON "family_relationship"("fromPersonId");
CREATE INDEX "family_relationship_toPersonId_idx" ON "family_relationship"("toPersonId");

ALTER TABLE "family_person" ADD CONSTRAINT "family_person_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_relationship" ADD CONSTRAINT "family_relationship_fromPersonId_fkey" FOREIGN KEY ("fromPersonId") REFERENCES "family_person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_relationship" ADD CONSTRAINT "family_relationship_toPersonId_fkey" FOREIGN KEY ("toPersonId") REFERENCES "family_person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
