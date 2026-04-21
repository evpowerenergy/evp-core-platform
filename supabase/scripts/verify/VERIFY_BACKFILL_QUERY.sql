-- 🔍 ตรวจสอบโครงสร้างสำหรับ Backfill Query
-- วัตถุประสงค์: ตรวจสอบว่า Backfill query ถูกต้องหรือไม่

-- =============================================================================
-- 1. ตรวจสอบโครงสร้างตาราง
-- =============================================================================

-- 1.1 ตรวจสอบ lead_productivity_logs
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lead_productivity_logs'
  AND column_name IN ('id', 'staff_id', 'sale_id')
ORDER BY column_name;

-- 1.2 ตรวจสอบ users
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('id', 'auth_user_id')
ORDER BY column_name;

-- 1.3 ตรวจสอบ sales_team_with_user_info
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sales_team_with_user_info'
  AND column_name IN ('id', 'user_id', 'status')
ORDER BY column_name;

-- =============================================================================
-- 2. ตรวจสอบ Foreign Keys
-- =============================================================================

-- 2.1 ตรวจสอบ Foreign Key ของ users.auth_user_id
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'auth_user_id';

-- 2.2 ตรวจสอบ Foreign Key ของ sales_team_with_user_info.user_id
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'sales_team_with_user_info'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

-- =============================================================================
-- 3. ทดสอบ Backfill Query (แบบทดสอบ - ไม่ UPDATE จริง)
-- =============================================================================

-- 3.1 ตรวจสอบจำนวน logs ที่ต้อง backfill
SELECT 
  COUNT(*) as total_logs,
  COUNT(CASE WHEN staff_id IS NOT NULL THEN 1 END) as logs_with_staff_id,
  COUNT(CASE WHEN sale_id IS NOT NULL THEN 1 END) as logs_with_sale_id,
  COUNT(CASE WHEN staff_id IS NOT NULL AND sale_id IS NULL THEN 1 END) as logs_to_backfill
FROM public.lead_productivity_logs;

-- 3.2 ตรวจสอบ logs ที่สามารถ backfill ได้ (มี staff_id แต่ไม่มี sale_id)
SELECT 
  COUNT(*) as can_backfill
FROM public.lead_productivity_logs lpl
JOIN public.users u ON lpl.staff_id = u.auth_user_id
JOIN public.sales_team_with_user_info st ON u.id = st.user_id
WHERE lpl.sale_id IS NULL
  AND lpl.staff_id IS NOT NULL
  AND st.status = 'active';

-- 3.3 แสดงตัวอย่าง logs ที่จะถูก backfill (ไม่ UPDATE จริง)
SELECT 
  lpl.id as log_id,
  lpl.staff_id,
  u.auth_user_id,
  u.id as user_id,
  st.id as sales_team_id,
  st.user_id as sales_team_user_id,
  st.name as sales_team_name,
  st.status as sales_team_status
FROM public.lead_productivity_logs lpl
JOIN public.users u ON lpl.staff_id = u.auth_user_id
JOIN public.sales_team_with_user_info st ON u.id = st.user_id
WHERE lpl.sale_id IS NULL
  AND lpl.staff_id IS NOT NULL
  AND st.status = 'active'
LIMIT 10;

-- =============================================================================
-- 4. ทดสอบ Backfill Query (จริง - ต้องระวัง!)
-- =============================================================================

-- ⚠️ อย่ารัน query นี้จนกว่าจะยืนยันว่า query ถูกต้องแล้ว!
-- ⚠️ แนะนำให้รันใน transaction และ rollback ก่อน

/*
BEGIN;

-- Backfill query ที่ถูกต้อง (ไม่ต้อง join auth.users)
UPDATE public.lead_productivity_logs lpl
SET sale_id = st.id
FROM public.users u
JOIN public.sales_team_with_user_info st ON u.id = st.user_id
WHERE lpl.staff_id = u.auth_user_id  -- ← ตรงกับ users.auth_user_id
  AND lpl.sale_id IS NULL
  AND st.status = 'active'  -- ← เฉพาะ active sales
  AND st.id IS NOT NULL;

-- ตรวจสอบผลลัพธ์
SELECT 
  COUNT(*) as updated_count,
  COUNT(DISTINCT sale_id) as unique_sales
FROM public.lead_productivity_logs
WHERE sale_id IS NOT NULL;

-- ถ้ายืนยันว่าถูกต้องแล้ว ให้ COMMIT
-- COMMIT;

-- ถ้ายังไม่แน่ใจ ให้ ROLLBACK
-- ROLLBACK;
*/

-- =============================================================================
-- 5. ตรวจสอบว่า auth.users จำเป็นหรือไม่
-- =============================================================================

-- คำตอบ: ❌ ไม่จำเป็น!
-- เพราะ:
-- 1. lead_productivity_logs.staff_id = auth.users.id (UUID)
-- 2. users.auth_user_id = auth.users.id (UUID) - ตรงกัน!
-- 3. users.id = UUID (primary key)
-- 4. sales_team_with_user_info.user_id = users.id - ตรงกัน!

-- ดังนั้น Backfill query ต้อง:
-- lead_productivity_logs.staff_id = users.auth_user_id (ตรงกัน!)
-- users.id = sales_team_with_user_info.user_id (ตรงกัน!)
-- sales_team_with_user_info.id = sale_id (ที่ต้องการ)

-- ไม่ต้อง join auth.users เพราะ:
-- - users.auth_user_id = auth.users.id อยู่แล้ว
-- - เราใช้ users.auth_user_id ตรงๆ ไม่ต้องไปหา auth.users.id

