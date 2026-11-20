-- Add the declared Sunni-majority inheritance basis.
-- ADD VALUE cannot be executed inside a transaction block on older PostgreSQL
-- versions; Prisma applies this migration without wrapping enum additions.
ALTER TYPE "MadhhabKey" ADD VALUE IF NOT EXISTS 'SUNNI_MAJORITY';
