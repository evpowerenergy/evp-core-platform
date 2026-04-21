-- Migration: Add marketing, back_office, and engineer roles
-- Date: 2025-01-16
-- Description: Add missing roles that are used in the frontend but not yet in the database enum

-- Note: PostgreSQL doesn't support IF NOT EXISTS for ALTER TYPE ADD VALUE
-- If you get an error that the value already exists, it means the migration was already run (which is fine)

-- 1. Add marketing role to the enum type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'marketing' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    ) THEN
        ALTER TYPE "public"."app_role" ADD VALUE 'marketing';
    END IF;
END $$;

-- 2. Add back_office role to the enum type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'back_office' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    ) THEN
        ALTER TYPE "public"."app_role" ADD VALUE 'back_office';
    END IF;
END $$;

-- 3. Add engineer role to the enum type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'engineer' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    ) THEN
        ALTER TYPE "public"."app_role" ADD VALUE 'engineer';
    END IF;
END $$;

-- Note: These roles are already configured in the frontend permissions system:
-- - marketing: can access Marketing system
-- - back_office: can access Inventory system
-- - engineer: can access Service Tracking system

