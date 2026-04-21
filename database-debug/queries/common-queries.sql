-- =============================================================================
-- Common SQL Queries for Database Debugging
-- วัตถุประสงค์: SQL queries ที่ใช้บ่อยสำหรับ debug และวิเคราะห์ข้อมูล
-- =============================================================================

-- 1. ค้นหาข้อมูลลูกค้าตามชื่อ
-- =============================================================================
SELECT 
  id,
  customer_group,
  tel,
  province,
  status,
  installation_date,
  service_visit_1,
  service_visit_2,
  service_visit_3,
  created_at,
  updated_at
FROM customer_services 
WHERE customer_group ILIKE '%ฟอนดี้%'
ORDER BY updated_at DESC;

-- 2. วิเคราะห์ข้อมูลตามจังหวัด
-- =============================================================================
SELECT 
  province,
  COUNT(*) as customer_count,
  COUNT(CASE WHEN service_visit_1 = true THEN 1 END) as visit_1_completed,
  COUNT(CASE WHEN service_visit_2 = true THEN 1 END) as visit_2_completed,
  COUNT(CASE WHEN service_visit_3 = true THEN 1 END) as visit_3_completed
FROM customer_services 
WHERE province IS NOT NULL
GROUP BY province
ORDER BY customer_count DESC;

-- 3. วิเคราะห์ข้อมูลตามสถานะ
-- =============================================================================
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customer_services), 2) as percentage
FROM customer_services 
GROUP BY status
ORDER BY count DESC;

-- 4. วิเคราะห์ Service Visits
-- =============================================================================
SELECT 
  'Service Visit 1' as visit_type,
  COUNT(CASE WHEN service_visit_1 = true THEN 1 END) as completed,
  COUNT(CASE WHEN service_visit_1 = false THEN 1 END) as pending,
  ROUND(COUNT(CASE WHEN service_visit_1 = true THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
FROM customer_services
UNION ALL
SELECT 
  'Service Visit 2' as visit_type,
  COUNT(CASE WHEN service_visit_2 = true THEN 1 END) as completed,
  COUNT(CASE WHEN service_visit_2 = false THEN 1 END) as pending,
  ROUND(COUNT(CASE WHEN service_visit_2 = true THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
FROM customer_services
UNION ALL
SELECT 
  'Service Visit 3' as visit_type,
  COUNT(CASE WHEN service_visit_3 = true THEN 1 END) as completed,
  COUNT(CASE WHEN service_visit_3 = false THEN 1 END) as pending,
  ROUND(COUNT(CASE WHEN service_visit_3 = true THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
FROM customer_services;

-- 5. วิเคราะห์ข้อมูลตามวันที่ติดตั้ง
-- =============================================================================
SELECT 
  DATE_TRUNC('month', installation_date) as month,
  COUNT(*) as installations,
  COUNT(CASE WHEN service_visit_1 = true THEN 1 END) as visit_1_completed,
  COUNT(CASE WHEN service_visit_2 = true THEN 1 END) as visit_2_completed
FROM customer_services 
WHERE installation_date IS NOT NULL
GROUP BY DATE_TRUNC('month', installation_date)
ORDER BY month DESC;

-- 6. วิเคราะห์ข้อมูลตามช่าง
-- =============================================================================
SELECT 
  service_visit_1_technician,
  COUNT(*) as total_customers,
  COUNT(CASE WHEN service_visit_1 = true THEN 1 END) as visit_1_completed,
  COUNT(CASE WHEN service_visit_2 = true THEN 1 END) as visit_2_completed
FROM customer_services 
WHERE service_visit_1_technician IS NOT NULL
GROUP BY service_visit_1_technician
ORDER BY total_customers DESC;

-- 7. วิเคราะห์ข้อมูลตามความจุ (kW)
-- =============================================================================
SELECT 
  CASE 
    WHEN capacity_kw <= 5 THEN '1-5 kW'
    WHEN capacity_kw <= 10 THEN '6-10 kW'
    WHEN capacity_kw <= 20 THEN '11-20 kW'
    WHEN capacity_kw <= 50 THEN '21-50 kW'
    ELSE '50+ kW'
  END as capacity_range,
  COUNT(*) as customer_count,
  AVG(capacity_kw) as avg_capacity
FROM customer_services 
WHERE capacity_kw IS NOT NULL
GROUP BY 
  CASE 
    WHEN capacity_kw <= 5 THEN '1-5 kW'
    WHEN capacity_kw <= 10 THEN '6-10 kW'
    WHEN capacity_kw <= 20 THEN '11-20 kW'
    WHEN capacity_kw <= 50 THEN '21-50 kW'
    ELSE '50+ kW'
  END
ORDER BY MIN(capacity_kw);

-- 8. วิเคราะห์ข้อมูลตาม Follow-up
-- =============================================================================
SELECT 
  sale_follow_up_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customer_services), 2) as percentage
FROM customer_services 
WHERE sale_follow_up_status IS NOT NULL
GROUP BY sale_follow_up_status
ORDER BY count DESC;

-- 9. วิเคราะห์ข้อมูลตามเขต
-- =============================================================================
SELECT 
  district,
  province,
  COUNT(*) as customer_count
FROM customer_services 
WHERE district IS NOT NULL AND province IS NOT NULL
GROUP BY district, province
ORDER BY customer_count DESC
LIMIT 20;

-- 10. วิเคราะห์ข้อมูลตาม Sale
-- =============================================================================
SELECT 
  sale,
  COUNT(*) as customer_count,
  COUNT(CASE WHEN service_visit_1 = true THEN 1 END) as visit_1_completed,
  COUNT(CASE WHEN service_visit_2 = true THEN 1 END) as visit_2_completed,
  ROUND(COUNT(CASE WHEN service_visit_1 = true THEN 1 END) * 100.0 / COUNT(*), 2) as visit_1_rate
FROM customer_services 
WHERE sale IS NOT NULL
GROUP BY sale
ORDER BY customer_count DESC;

-- =============================================================================
-- การใช้งาน
-- =============================================================================
-- 1. คัดลอก query ที่ต้องการ
-- 2. วางใน Supabase SQL Editor
-- 3. กด Run
-- 4. ดูผลลัพธ์

-- =============================================================================
-- หมายเหตุ
-- =============================================================================
-- - ใช้ ILIKE สำหรับการค้นหาแบบ case-insensitive
-- - ใช้ COUNT() กับ CASE WHEN สำหรับการนับแบบมีเงื่อนไข
-- - ใช้ ROUND() สำหรับการปัดเศษ
-- - ใช้ DATE_TRUNC() สำหรับการจัดกลุ่มตามเวลา
