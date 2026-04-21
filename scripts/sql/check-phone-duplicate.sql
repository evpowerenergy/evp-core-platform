-- Script to check for duplicate phone numbers in leads table
-- Usage: Run this in Supabase SQL Editor

-- Check for the specific phone number: 0855601245
SELECT 
    id,
    tel,
    full_name,
    created_by,
    created_at,
    platform,
    category
FROM leads
WHERE tel LIKE '%0855601245%'
   OR tel LIKE '%855601245%'
   OR REPLACE(REPLACE(REPLACE(REPLACE(tel, ' ', ''), '-', ''), '(', ''), ')', '') = '0855601245'
   OR REPLACE(REPLACE(REPLACE(REPLACE(tel, ' ', ''), '-', ''), '(', ''), ')', '') = '855601245'
ORDER BY created_at DESC;

-- Check for all duplicate phone numbers (normalized)
WITH normalized_phones AS (
    SELECT 
        id,
        tel,
        full_name,
        created_by,
        created_at,
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(tel, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') AS normalized_tel
    FROM leads
    WHERE tel IS NOT NULL
)
SELECT 
    normalized_tel,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as lead_ids,
    STRING_AGG(full_name, ' | ') as names,
    STRING_AGG(created_by::text, ', ') as created_by_ids
FROM normalized_phones
GROUP BY normalized_tel
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, normalized_tel;

