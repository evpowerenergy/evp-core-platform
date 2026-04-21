-- ============================================
-- Query สำหรับตรวจสอบ Roles และ Users ใน Supabase UI
-- ============================================

-- ============================================
-- 1. ตรวจสอบ Roles ทั้งหมดที่มีใน enum type
-- ============================================
SELECT 
    e.enumlabel as role_name,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'app_role'
ORDER BY e.enumsortorder;

-- ============================================
-- 2. ตรวจสอบ User ที่มี role marketing
-- ============================================
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.department,
    u.auth_user_id,
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ มี auth_user_id ถูกต้อง'
        ELSE '❌ ไม่มี auth_user_id หรือ auth user ไม่ถูกต้อง'
    END as auth_status
FROM public.users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.role = 'marketing';

-- ============================================
-- 3. ตรวจสอบ User ที่มี role back_office หรือ engineer
-- ============================================
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.department,
    u.auth_user_id,
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ มี auth_user_id ถูกต้อง'
        ELSE '❌ ไม่มี auth_user_id หรือ auth user ไม่ถูกต้อง'
    END as auth_status
FROM public.users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.role IN ('back_office', 'engineer');

-- ============================================
-- 4. ตรวจสอบ User ที่ role เป็น NULL หรือไม่ถูกต้อง
-- ============================================
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.auth_user_id,
    au.id as auth_user_id_from_auth_users,
    CASE 
        WHEN u.role IS NULL THEN '❌ Role เป็น NULL'
        WHEN u.auth_user_id IS NULL THEN '⚠️ ไม่มี auth_user_id'
        WHEN au.id IS NULL THEN '⚠️ auth_user_id ไม่ตรงกับ auth.users'
        ELSE '✅ OK'
    END as status
FROM public.users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.role IS NULL 
   OR u.auth_user_id IS NULL 
   OR au.id IS NULL;

-- ============================================
-- 5. ตรวจสอบ User ที่มี role แต่ auth_user_id ไม่ตรงกับ auth.users
-- ============================================
SELECT 
    u.id,
    u.email,
    u.role,
    u.auth_user_id,
    au.email as auth_email,
    au.id as correct_auth_user_id,
    CASE 
        WHEN au.id IS NULL THEN '❌ ไม่พบ user ใน auth.users'
        WHEN u.auth_user_id != au.id THEN '⚠️ auth_user_id ไม่ตรง'
        ELSE '✅ OK'
    END as status
FROM public.users u
LEFT JOIN auth.users au ON u.email = au.email
WHERE u.role IS NOT NULL
  AND (u.auth_user_id IS NULL OR u.auth_user_id != au.id OR au.id IS NULL);

-- ============================================
-- 6. ตรวจสอบ Users ทั้งหมดพร้อม Role และ Auth Status
-- ============================================
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.department,
    u.auth_user_id,
    au.id as auth_users_id,
    au.email as auth_email,
    CASE 
        WHEN u.role IS NULL THEN '❌ No Role'
        WHEN u.auth_user_id IS NULL THEN '⚠️ No Auth User ID'
        WHEN au.id IS NULL THEN '⚠️ Auth User Not Found'
        WHEN u.auth_user_id != au.id THEN '⚠️ Auth ID Mismatch'
        ELSE '✅ OK'
    END as status
FROM public.users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
ORDER BY u.role NULLS LAST, u.email;

-- ============================================
-- 7. ตรวจสอบว่า role 'marketing' อยู่ใน enum หรือยัง
-- ============================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'marketing' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
        ) THEN '✅ Role "marketing" มีอยู่ใน enum แล้ว'
        ELSE '❌ Role "marketing" ยังไม่มีใน enum (ต้องรัน migration)'
    END as marketing_role_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'back_office' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
        ) THEN '✅ Role "back_office" มีอยู่ใน enum แล้ว'
        ELSE '❌ Role "back_office" ยังไม่มีใน enum (ต้องรัน migration)'
    END as back_office_role_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'engineer' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
        ) THEN '✅ Role "engineer" มีอยู่ใน enum แล้ว'
        ELSE '❌ Role "engineer" ยังไม่มีใน enum (ต้องรัน migration)'
    END as engineer_role_status;






