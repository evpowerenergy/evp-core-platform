-- 🔍 ตรวจสอบ Leads ที่ sale_owner_id ตรงกับ post_sales_owner_id (คนเดียวกัน)
-- วัตถุประสงค์: หา leads ที่มี sale owner กับ post sales owner เป็นคนเดียวกัน

-- Query 1: Leads ที่มี sale_owner_id ตรงกับ post_sales_owner_id (รายละเอียด)
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
  l.customer_service_id,
  cs.sale_follow_up_assigned_to as customer_service_assigned_to,
  st3.name as customer_service_assigned_name
FROM leads l
LEFT JOIN sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
LEFT JOIN sales_team_with_user_info st2 ON l.post_sales_owner_id = st2.id
LEFT JOIN customer_services cs ON l.customer_service_id = cs.id
LEFT JOIN sales_team_with_user_info st3 ON cs.sale_follow_up_assigned_to = st3.id
WHERE l.sale_owner_id IS NOT NULL 
  AND l.post_sales_owner_id IS NOT NULL
  AND l.sale_owner_id = l.post_sales_owner_id
ORDER BY l.updated_at_thai DESC;

-- Query 2: สรุปจำนวน leads ที่ตรงกัน แยกตาม Sale Owner
SELECT 
  l.sale_owner_id,
  st1.name as sale_owner_name,
  st1.email as sale_owner_email,
  COUNT(DISTINCT l.id) as total_leads_with_same_owner,
  COUNT(DISTINCT CASE WHEN l.operation_status = 'ติดตามหลังการขาย' THEN l.id END) as leads_follow_up,
  COUNT(DISTINCT CASE WHEN l.status = 'กำลังติดตาม' THEN l.id END) as leads_active,
  COUNT(DISTINCT CASE WHEN l.status = 'ปิดการขายแล้ว' THEN l.id END) as leads_closed,
  MIN(l.created_at_thai) as first_lead_date,
  MAX(l.updated_at_thai) as last_updated_date
FROM leads l
LEFT JOIN sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
WHERE l.sale_owner_id IS NOT NULL 
  AND l.post_sales_owner_id IS NOT NULL
  AND l.sale_owner_id = l.post_sales_owner_id
GROUP BY l.sale_owner_id, st1.name, st1.email
ORDER BY total_leads_with_same_owner DESC;

-- Query 3: สรุปจำนวน leads ที่ตรงกัน แยกตาม operation_status
SELECT 
  l.operation_status,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT l.sale_owner_id) as unique_sale_owners
FROM leads l
WHERE l.sale_owner_id IS NOT NULL 
  AND l.post_sales_owner_id IS NOT NULL
  AND l.sale_owner_id = l.post_sales_owner_id
GROUP BY l.operation_status
ORDER BY total_leads DESC;

-- Query 4: สรุปจำนวน leads ที่ตรงกัน แยกตาม status
SELECT 
  l.status,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT l.sale_owner_id) as unique_sale_owners
FROM leads l
WHERE l.sale_owner_id IS NOT NULL 
  AND l.post_sales_owner_id IS NOT NULL
  AND l.sale_owner_id = l.post_sales_owner_id
GROUP BY l.status
ORDER BY total_leads DESC;

-- Query 5: สรุปแบบย่อ (จำนวนรวม)
SELECT 
  COUNT(*) as total_leads_with_same_owner,
  COUNT(DISTINCT sale_owner_id) as unique_sale_owners,
  COUNT(CASE WHEN operation_status = 'ติดตามหลังการขาย' THEN 1 END) as leads_follow_up,
  COUNT(CASE WHEN status = 'กำลังติดตาม' THEN 1 END) as leads_active,
  COUNT(CASE WHEN status = 'ปิดการขายแล้ว' THEN 1 END) as leads_closed
FROM leads
WHERE sale_owner_id IS NOT NULL 
  AND post_sales_owner_id IS NOT NULL
  AND sale_owner_id = post_sales_owner_id;

-- Query 6: ตรวจสอบเฉพาะ leads ที่ operation_status = 'ติดตามหลังการขาย' และตรงกัน
SELECT 
  l.id as lead_id,
  l.full_name,
  l.tel,
  l.operation_status,
  l.status,
  l.sale_owner_id,
  st1.name as sale_owner_name,
  l.post_sales_owner_id,
  st2.name as post_sales_owner_name,
  l.created_at_thai,
  l.updated_at_thai,
  l.customer_service_id,
  cs.sale_follow_up_assigned_to as customer_service_assigned_to,
  CASE 
    WHEN l.sale_owner_id = cs.sale_follow_up_assigned_to 
    THEN '✅ ตรงกัน'
    ELSE '⚠️ ไม่ตรงกัน'
  END as validation_status
FROM leads l
LEFT JOIN sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
LEFT JOIN sales_team_with_user_info st2 ON l.post_sales_owner_id = st2.id
LEFT JOIN customer_services cs ON l.customer_service_id = cs.id
WHERE l.operation_status = 'ติดตามหลังการขาย'
  AND l.sale_owner_id IS NOT NULL 
  AND l.post_sales_owner_id IS NOT NULL
  AND l.sale_owner_id = l.post_sales_owner_id
ORDER BY l.updated_at_thai DESC;

-- Query 7: เปรียบเทียบ: ตรงกัน vs ไม่ตรงกัน (สรุป)
SELECT 
  'ตรงกัน (คนเดียวกัน)' as category,
  COUNT(*) as count
FROM leads
WHERE sale_owner_id IS NOT NULL 
  AND post_sales_owner_id IS NOT NULL
  AND sale_owner_id = post_sales_owner_id

UNION ALL

SELECT 
  'ไม่ตรงกัน (คนละคน)' as category,
  COUNT(*) as count
FROM leads
WHERE sale_owner_id IS NOT NULL 
  AND post_sales_owner_id IS NOT NULL
  AND sale_owner_id != post_sales_owner_id

ORDER BY count DESC;

