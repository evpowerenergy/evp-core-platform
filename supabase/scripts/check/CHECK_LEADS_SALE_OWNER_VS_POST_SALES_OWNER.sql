-- 🔍 ตรวจสอบ Leads ที่ sale_owner_id ไม่ตรงกับ post_sales_owner_id
-- วัตถุประสงค์: หา leads ที่มี sale owner กับ post sales owner เป็นคนละคนกัน

-- Query 1: Leads ที่มีทั้ง sale_owner_id และ post_sales_owner_id แต่ไม่ตรงกัน
SELECT 
  l.id as lead_id,
  l.full_name,
  l.tel,
  l.operation_status,
  l.status,
  l.platform,
  l.category,
  l.sale_owner_id,
  st1.name as sale_owner_name,
  l.post_sales_owner_id,
  st2.name as post_sales_owner_name,
  l.created_at_thai,
  l.updated_at_thai,
  CASE 
    WHEN l.sale_owner_id IS NOT NULL AND l.post_sales_owner_id IS NOT NULL 
      AND l.sale_owner_id != l.post_sales_owner_id 
    THEN '⚠️ ไม่ตรงกัน (คนละคน)'
    WHEN l.sale_owner_id IS NULL AND l.post_sales_owner_id IS NOT NULL 
    THEN '✅ มีแค่ post_sales_owner_id'
    WHEN l.sale_owner_id IS NOT NULL AND l.post_sales_owner_id IS NULL 
    THEN '✅ มีแค่ sale_owner_id'
    WHEN l.sale_owner_id IS NOT NULL AND l.post_sales_owner_id IS NOT NULL 
      AND l.sale_owner_id = l.post_sales_owner_id 
    THEN '✅ ตรงกัน (คนเดียวกัน)'
    ELSE '❓ ไม่มีทั้งสอง'
  END as status_description
FROM leads l
LEFT JOIN sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
LEFT JOIN sales_team_with_user_info st2 ON l.post_sales_owner_id = st2.id
WHERE l.sale_owner_id IS NOT NULL 
  AND l.post_sales_owner_id IS NOT NULL
  AND l.sale_owner_id != l.post_sales_owner_id
ORDER BY l.updated_at_thai DESC;

-- Query 2: สรุปจำนวน leads แบ่งตามกรณี
SELECT 
  CASE 
    WHEN sale_owner_id IS NOT NULL AND post_sales_owner_id IS NOT NULL 
      AND sale_owner_id != post_sales_owner_id 
    THEN 'ไม่ตรงกัน (คนละคน)'
    WHEN sale_owner_id IS NULL AND post_sales_owner_id IS NOT NULL 
    THEN 'มีแค่ post_sales_owner_id'
    WHEN sale_owner_id IS NOT NULL AND post_sales_owner_id IS NULL 
    THEN 'มีแค่ sale_owner_id'
    WHEN sale_owner_id IS NOT NULL AND post_sales_owner_id IS NOT NULL 
      AND sale_owner_id = post_sales_owner_id 
    THEN 'ตรงกัน (คนเดียวกัน)'
    ELSE 'ไม่มีทั้งสอง'
  END as category,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM leads
WHERE sale_owner_id IS NOT NULL OR post_sales_owner_id IS NOT NULL
GROUP BY 
  CASE 
    WHEN sale_owner_id IS NOT NULL AND post_sales_owner_id IS NOT NULL 
      AND sale_owner_id != post_sales_owner_id 
    THEN 'ไม่ตรงกัน (คนละคน)'
    WHEN sale_owner_id IS NULL AND post_sales_owner_id IS NOT NULL 
    THEN 'มีแค่ post_sales_owner_id'
    WHEN sale_owner_id IS NOT NULL AND post_sales_owner_id IS NULL 
    THEN 'มีแค่ sale_owner_id'
    WHEN sale_owner_id IS NOT NULL AND post_sales_owner_id IS NOT NULL 
      AND sale_owner_id = post_sales_owner_id 
    THEN 'ตรงกัน (คนเดียวกัน)'
    ELSE 'ไม่มีทั้งสอง'
  END
ORDER BY count DESC;

-- Query 3: ตรวจสอบเฉพาะ leads ที่ operation_status = 'ติดตามหลังการขาย'
SELECT 
  l.id as lead_id,
  l.full_name,
  l.tel,
  l.operation_status,
  l.sale_owner_id,
  st1.name as sale_owner_name,
  l.post_sales_owner_id,
  st2.name as post_sales_owner_name,
  l.created_at_thai,
  l.updated_at_thai,
  cs.sale_follow_up_assigned_to as customer_service_assigned_to,
  st3.name as customer_service_assigned_name
FROM leads l
LEFT JOIN sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
LEFT JOIN sales_team_with_user_info st2 ON l.post_sales_owner_id = st2.id
LEFT JOIN customer_services cs ON l.customer_service_id = cs.id
LEFT JOIN sales_team_with_user_info st3 ON cs.sale_follow_up_assigned_to = st3.id
WHERE l.operation_status = 'ติดตามหลังการขาย'
  AND (
    (l.sale_owner_id IS NOT NULL AND l.post_sales_owner_id IS NOT NULL 
     AND l.sale_owner_id != l.post_sales_owner_id)
    OR
    (l.post_sales_owner_id IS NOT NULL AND cs.sale_follow_up_assigned_to IS NOT NULL
     AND l.post_sales_owner_id != cs.sale_follow_up_assigned_to)
  )
ORDER BY l.updated_at_thai DESC;

-- Query 4: สรุปจำนวน leads ที่ไม่ตรงกัน แยกตาม Sale Owner
SELECT 
  l.sale_owner_id,
  st1.name as sale_owner_name,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE 
    WHEN l.post_sales_owner_id IS NOT NULL 
      AND l.sale_owner_id != l.post_sales_owner_id 
    THEN l.id 
  END) as leads_with_different_post_sales_owner,
  COUNT(DISTINCT CASE 
    WHEN l.post_sales_owner_id IS NOT NULL 
      AND l.sale_owner_id = l.post_sales_owner_id 
    THEN l.id 
  END) as leads_with_same_post_sales_owner
FROM leads l
LEFT JOIN sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
WHERE l.sale_owner_id IS NOT NULL
  AND l.post_sales_owner_id IS NOT NULL
GROUP BY l.sale_owner_id, st1.name
HAVING COUNT(DISTINCT CASE 
  WHEN l.post_sales_owner_id IS NOT NULL 
    AND l.sale_owner_id != l.post_sales_owner_id 
  THEN l.id 
END) > 0
ORDER BY leads_with_different_post_sales_owner DESC;

-- Query 5: ตรวจสอบเฉพาะ leads ที่ไม่ตรงกัน (สรุปแบบย่อ)
SELECT 
  COUNT(*) as total_leads_with_both_owners,
  COUNT(CASE WHEN sale_owner_id != post_sales_owner_id THEN 1 END) as leads_with_different_owners,
  COUNT(CASE WHEN sale_owner_id = post_sales_owner_id THEN 1 END) as leads_with_same_owner
FROM leads
WHERE sale_owner_id IS NOT NULL 
  AND post_sales_owner_id IS NOT NULL;

