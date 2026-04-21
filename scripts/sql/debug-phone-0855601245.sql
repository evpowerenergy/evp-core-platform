-- Debug script to check phone number 0855601245 in database
-- Run this in Supabase SQL Editor

-- 1. Check exact match
SELECT 
    id,
    tel,
    full_name,
    created_by,
    created_at,
    LENGTH(tel) as tel_length,
    tel = '0855601245' as exact_match
FROM leads
WHERE tel = '0855601245'
ORDER BY created_at DESC;

-- 2. Check with LIKE (in case there are spaces or special characters)
SELECT 
    id,
    tel,
    full_name,
    created_by,
    created_at,
    LENGTH(tel) as tel_length,
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(tel, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') as normalized_tel
FROM leads
WHERE tel LIKE '%0855601245%'
   OR tel LIKE '%855601245%'
ORDER BY created_at DESC;

-- 3. Check all normalized versions
WITH normalized_leads AS (
    SELECT 
        id,
        tel,
        full_name,
        created_by,
        created_at,
        TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(tel, ' ', ''), '-', ''), '(', ''), ')', ''), '+', ''), '.', '')) as normalized_tel
    FROM leads
    WHERE tel IS NOT NULL
)
SELECT 
    id,
    tel,
    normalized_tel,
    full_name,
    created_by,
    created_at,
    normalized_tel = '0855601245' as matches_0855601245,
    normalized_tel = '855601245' as matches_855601245
FROM normalized_leads
WHERE normalized_tel = '0855601245'
   OR normalized_tel = '855601245'
   OR normalized_tel LIKE '%0855601245%'
   OR normalized_tel LIKE '%855601245%'
ORDER BY created_at DESC;

-- 4. Show all phone numbers that normalize to 0855601245
SELECT 
    id,
    tel,
    TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(tel, ' ', ''), '-', ''), '(', ''), ')', ''), '+', ''), '.', '')) as normalized_tel,
    full_name,
    created_by,
    created_at
FROM leads
WHERE tel IS NOT NULL
  AND TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(tel, ' ', ''), '-', ''), '(', ''), ')', ''), '+', ''), '.')) = '0855601245'
ORDER BY created_at DESC;

