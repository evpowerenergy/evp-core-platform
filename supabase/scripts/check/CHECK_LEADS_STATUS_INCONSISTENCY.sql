-- 🔍 ตรวจสอบ Leads ที่มีข้อมูลไม่สอดคล้องกันระหว่าง status และ sale_owner_id
-- วัตถุประสงค์: หา leads ที่มี sale_owner_id แต่ status = "รอรับ" (ซึ่งไม่ควรเป็น)

-- Query 1: Leads ที่มี sale_owner_id แต่ status = "รอรับ" (รายละเอียด)
SELECT 
  l.id as lead_id,
  l.full_name,
  l.display_name,
  l.tel,
  l.status,
  l.operation_status,
  l.sale_owner_id,
  st1.name as sale_owner_name,
  st1.email as sale_owner_email,
  l.post_sales_owner_id,
  st2.name as post_sales_owner_name,
  l.platform,
  l.category,
  l.created_at_thai,
  l.updated_at_thai,
  l.is_archived
FROM leads l
LEFT JOIN sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
LEFT JOIN sales_team_with_user_info st2 ON l.post_sales_owner_id = st2.id
WHERE l.sale_owner_id IS NOT NULL 
  AND l.status = 'รอรับ'
  AND l.is_archived = false
ORDER BY l.updated_at_thai DESC;

-- Query 2: สรุปจำนวน leads ที่ไม่สอดคล้องกัน แยกตาม Sale Owner
SELECT 
  l.sale_owner_id,
  st1.name as sale_owner_name,
  st1.email as sale_owner_email,
  COUNT(DISTINCT l.id) as total_inconsistent_leads,
  MIN(l.created_at_thai) as first_lead_date,
  MAX(l.updated_at_thai) as last_updated_date
FROM leads l
LEFT JOIN sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
WHERE l.sale_owner_id IS NOT NULL 
  AND l.status = 'รอรับ'
  AND l.is_archived = false
GROUP BY l.sale_owner_id, st1.name, st1.email
ORDER BY total_inconsistent_leads DESC;

-- Query 3: สรุปแบบย่อ (จำนวนรวม)
SELECT 
  COUNT(*) as total_inconsistent_leads,
  COUNT(DISTINCT sale_owner_id) as unique_sale_owners_affected
FROM leads
WHERE sale_owner_id IS NOT NULL 
  AND status = 'รอรับ'
  AND is_archived = false;

-- Query 4: ตรวจสอบ leads ที่มี sale_owner_id แต่ sale_owner_id ไม่มีใน sales_team_with_user_info
SELECT 
  l.id as lead_id,
  l.full_name,
  l.display_name,
  l.tel,
  l.status,
  l.sale_owner_id,
  l.created_at_thai,
  l.updated_at_thai
FROM leads l
WHERE l.sale_owner_id IS NOT NULL 
  AND l.sale_owner_id NOT IN (SELECT id FROM sales_team_with_user_info)
  AND l.is_archived = false
ORDER BY l.updated_at_thai DESC;

