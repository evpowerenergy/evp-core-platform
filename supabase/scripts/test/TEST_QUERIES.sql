-- =============================================================================
-- TEST QUERIES - Query ตัวอย่างสำหรับทดสอบและใช้งาน
-- คัดลอกแต่ละ query ไปรันทีละอันใน Supabase SQL Editor
-- =============================================================================

-- ============ QUERY 1: ดูภาพรวมทั้งหมด ============
-- ดูจำนวนลูกค้าแต่ละสถานะ
SELECT 
  service_status_calculated,
  COUNT(*) as จำนวน
FROM customer_services
WHERE installation_date IS NOT NULL
GROUP BY service_status_calculated
ORDER BY จำนวน DESC;

-- ============ QUERY 2: ลูกค้าที่บริการครบแล้ว (สำหรับ Sale Follow-up) ============
-- เรียงตามที่บริการครบนานที่สุด
SELECT 
  customer_group as ชื่อลูกค้า,
  tel as เบอร์โทร,
  province as จังหวัด,
  installation_date as วันติดตั้ง,
  service_visit_2_date as วันบริการครั้งที่2,
  days_since_installation as ติดตั้งไปกี่วัน,
  days_after_service_complete as บริการครบไปกี่วัน,
  sale_follow_up_status as สถานะติดตาม
FROM customer_services
WHERE service_visit_1 = true 
  AND service_visit_2 = true
ORDER BY days_after_service_complete DESC
LIMIT 50;

-- ============ QUERY 3: ลูกค้าที่ควรติดตามด่วน ============
-- บริการครบไปมากกว่า 90 วัน และยังไม่ได้ติดตาม
SELECT 
  customer_group as ชื่อลูกค้า,
  tel as เบอร์โทร,
  sale as เซลล์,
  days_after_service_complete as บริการครบไปกี่วัน,
  sale_follow_up_status as สถานะติดตาม,
  CASE 
    WHEN sale_follow_up_status IS NULL OR sale_follow_up_status = 'not_started' THEN '🔴 ยังไม่ได้ติดตาม'
    WHEN sale_follow_up_status = 'pending' THEN '🟡 รอดำเนินการ'
    WHEN sale_follow_up_status = 'completed' THEN '🟢 ติดตามแล้ว'
    ELSE sale_follow_up_status
  END as สถานะ
FROM customer_services
WHERE service_visit_1 = true 
  AND service_visit_2 = true
  AND days_after_service_complete > 90
  AND (sale_follow_up_status IS NULL 
       OR sale_follow_up_status != 'completed')
ORDER BY days_after_service_complete DESC;

-- ============ QUERY 4: สถิติตามจังหวัด ============
SELECT 
  province as จังหวัด,
  COUNT(*) as ทั้งหมด,
  COUNT(*) FILTER (WHERE service_visit_1 = true AND service_visit_2 = true) as บริการครบแล้ว,
  ROUND(AVG(days_after_service_complete) FILTER (WHERE service_visit_1 = true AND service_visit_2 = true)) as เฉลี่ยบริการครบไปกี่วัน
FROM customer_services
WHERE installation_date IS NOT NULL
GROUP BY province
ORDER BY ทั้งหมด DESC;

-- ============ QUERY 5: ลูกค้าที่เกินกำหนด Service 1 ============
SELECT 
  customer_group as ชื่อลูกค้า,
  tel as เบอร์โทร,
  province as จังหวัด,
  days_since_installation as ติดตั้งไปกี่วัน,
  days_until_service_1_due as เกินกำหนดกี่วัน,
  service_status_calculated as สถานะ
FROM customer_services
WHERE service_visit_1 = false
  AND days_until_service_1_due < 0
ORDER BY days_until_service_1_due ASC
LIMIT 30;

-- ============ QUERY 6: ลูกค้าที่เกินกำหนด Service 2 ============
SELECT 
  customer_group as ชื่อลูกค้า,
  tel as เบอร์โทร,
  province as จังหวัด,
  days_since_installation as ติดตั้งไปกี่วัน,
  days_until_service_2_due as เกินกำหนดกี่วัน,
  service_status_calculated as สถานะ
FROM customer_services
WHERE service_visit_1 = true
  AND service_visit_2 = false
  AND days_until_service_2_due < 0
ORDER BY days_until_service_2_due ASC
LIMIT 30;

-- ============ QUERY 7: Dashboard สรุปภาพรวม ============
SELECT 
  'ติดตั้งแล้วทั้งหมด' as หัวข้อ,
  COUNT(*) as จำนวน
FROM customer_services
WHERE installation_date IS NOT NULL

UNION ALL

SELECT 
  'รอ Service ครั้งที่ 1',
  COUNT(*)
FROM customer_services
WHERE service_visit_1 = false AND installation_date IS NOT NULL

UNION ALL

SELECT 
  'เกินกำหนด Service ครั้งที่ 1',
  COUNT(*)
FROM customer_services
WHERE service_status_calculated = 'service_1_overdue'

UNION ALL

SELECT 
  'รอ Service ครั้งที่ 2',
  COUNT(*)
FROM customer_services
WHERE service_visit_1 = true AND service_visit_2 = false

UNION ALL

SELECT 
  'เกินกำหนด Service ครั้งที่ 2',
  COUNT(*)
FROM customer_services
WHERE service_status_calculated = 'service_2_overdue'

UNION ALL

SELECT 
  'บริการครบแล้ว',
  COUNT(*)
FROM customer_services
WHERE service_visit_1 = true AND service_visit_2 = true

UNION ALL

SELECT 
  'ควรติดตาม (บริการครบ > 90 วัน)',
  COUNT(*)
FROM customer_services
WHERE service_visit_1 = true 
  AND service_visit_2 = true
  AND days_after_service_complete > 90;

-- ============ QUERY 8: Top 10 ที่บริการครบนานที่สุด ============
SELECT 
  ROW_NUMBER() OVER (ORDER BY days_after_service_complete DESC) as อันดับ,
  customer_group as ชื่อลูกค้า,
  tel as เบอร์โทร,
  sale as เซลล์,
  province as จังหวัด,
  days_after_service_complete as บริการครบไปกี่วัน,
  ROUND(days_after_service_complete::numeric / 30, 1) as ประมาณเดือน,
  sale_follow_up_status as สถานะติดตาม
FROM customer_services
WHERE service_visit_1 = true 
  AND service_visit_2 = true
ORDER BY days_after_service_complete DESC
LIMIT 10;

-- ============ QUERY 9: สถิติตาม Sale ============
SELECT 
  sale as เซลล์,
  COUNT(*) FILTER (WHERE service_visit_1 = true AND service_visit_2 = true) as บริการครบ,
  COUNT(*) FILTER (WHERE days_after_service_complete > 90) as ควรติดตาม,
  COUNT(*) FILTER (WHERE sale_follow_up_status = 'completed') as ติดตามแล้ว,
  ROUND(
    COUNT(*) FILTER (WHERE sale_follow_up_status = 'completed')::numeric * 100.0 / 
    NULLIF(COUNT(*) FILTER (WHERE service_visit_1 = true AND service_visit_2 = true), 0),
    1
  ) as เปอร์เซ็นต์ติดตาม
FROM customer_services
WHERE installation_date IS NOT NULL
  AND sale IS NOT NULL
GROUP BY sale
ORDER BY บริการครบ DESC;

-- ============ QUERY 10: Export สำหรับ Sale Follow-up ============
-- Query นี้เหมาะสำหรับ export ไป Excel
SELECT 
  customer_group as "ชื่อลูกค้า",
  tel as "เบอร์โทร",
  province as "จังหวัด",
  district as "อำเภอ",
  sale as "เซลล์",
  TO_CHAR(installation_date, 'DD/MM/YYYY') as "วันติดตั้ง",
  TO_CHAR(service_visit_2_date, 'DD/MM/YYYY') as "วันบริการครั้งที่2",
  days_after_service_complete as "บริการครบไปกี่วัน",
  CASE 
    WHEN days_after_service_complete > 90 THEN 'ควรติดตามด่วน'
    WHEN days_after_service_complete > 60 THEN 'ควรติดตาม'
    ELSE 'ปกติ'
  END as "ระดับความเร่งด่วน",
  COALESCE(sale_follow_up_status, 'ยังไม่ได้ติดตาม') as "สถานะติดตาม",
  TO_CHAR(sale_follow_up_date, 'DD/MM/YYYY') as "วันที่นัดติดตาม",
  sale_follow_up_details as "รายละเอียด"
FROM customer_services
WHERE service_visit_1 = true 
  AND service_visit_2 = true
ORDER BY days_after_service_complete DESC;

-- =============================================================================
-- ✅ เสร็จสิ้น! คัดลอก query ที่ต้องการไปใช้งาน
-- =============================================================================

