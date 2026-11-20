-- Extend the zakah asset category enum with livestock, crops and minerals.
-- ADD VALUE cannot be executed inside a transaction block on older PostgreSQL
-- versions; Prisma applies this migration without wrapping enum additions.
ALTER TYPE "ZakahAssetCategory" ADD VALUE IF NOT EXISTS 'LIVESTOCK_CAMEL';
ALTER TYPE "ZakahAssetCategory" ADD VALUE IF NOT EXISTS 'LIVESTOCK_CATTLE';
ALTER TYPE "ZakahAssetCategory" ADD VALUE IF NOT EXISTS 'LIVESTOCK_GOAT_SHEEP';
ALTER TYPE "ZakahAssetCategory" ADD VALUE IF NOT EXISTS 'CROP_WHEAT';
ALTER TYPE "ZakahAssetCategory" ADD VALUE IF NOT EXISTS 'CROP_BARLEY';
ALTER TYPE "ZakahAssetCategory" ADD VALUE IF NOT EXISTS 'CROP_DATES';
ALTER TYPE "ZakahAssetCategory" ADD VALUE IF NOT EXISTS 'CROP_GRAPES';
ALTER TYPE "ZakahAssetCategory" ADD VALUE IF NOT EXISTS 'CROP_OTHER';
ALTER TYPE "ZakahAssetCategory" ADD VALUE IF NOT EXISTS 'MINERALS_TREASURE';
