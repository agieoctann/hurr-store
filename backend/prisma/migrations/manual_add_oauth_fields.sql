-- Migration: add_oauth_fields
-- Run this on Railway PostgreSQL if prisma migrate deploy fails
-- This adds provider and providerId fields to the User table
-- and makes passwordHash nullable (for OAuth users)

ALTER TABLE "User"
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "provider" TEXT,
  ADD COLUMN IF NOT EXISTS "providerId" TEXT;
