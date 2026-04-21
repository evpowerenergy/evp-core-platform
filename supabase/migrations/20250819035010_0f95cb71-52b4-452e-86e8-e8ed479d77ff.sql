-- เพิ่ม RLS policy สำหรับการลบลีดให้กับผู้ใช้ที่มีสิทธิ์
CREATE POLICY "authenticated_users_can_delete_leads" 
ON public.leads 
FOR DELETE 
USING (true);