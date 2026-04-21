-- Rename customer_name column to requester_name in permit_requests table
-- เพื่อเปลี่ยนชื่อ column จาก "ชื่อลูกค้า" เป็น "ชื่อผู้ขอ"

ALTER TABLE public.permit_requests 
RENAME COLUMN customer_name TO requester_name;

-- Update comment for the renamed column
COMMENT ON COLUMN public.permit_requests.requester_name IS 'ชื่อผู้ขออนุญาต';
