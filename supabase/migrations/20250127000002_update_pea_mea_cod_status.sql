-- Migration: Update sub_status name for PEA/MEA COD
-- Date: 2025-01-27
-- Description: 
--   Update sub_status: "รอ PEA หรือ MEA นัดหมาย COD" → "อยู่ระหว่างดำเนินการบืนยันเข้าสู่ระบบ PEA หรือ MEA"

-- Update sub_status
UPDATE public.permit_requests
SET sub_status = 'อยู่ระหว่างดำเนินการบืนยันเข้าสู่ระบบ PEA หรือ MEA'
WHERE sub_status = 'รอ PEA หรือ MEA นัดหมาย COD';

