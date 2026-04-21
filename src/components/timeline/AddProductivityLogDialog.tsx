import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductivityLogForm from './ProductivityLogForm';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AddProductivityLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  isWholesale?: boolean;
  isPackage?: boolean;
}

const AddProductivityLogDialog = ({ isOpen, onClose, leadId, isWholesale, isPackage }: AddProductivityLogDialogProps) => {
  // ✅ ใช้ leadId เป็น key เท่านั้น ไม่ใช้ Date.now() เพื่อให้ localStorage ทำงานได้ถูกต้อง
  const dialogKey = isOpen ? `dialog-${leadId}` : 'closed';

  // ดึงข้อมูลลูกค้า
  const { data: leadData } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const { data, error } = await supabase
        .from("leads")
        .select("full_name")
        .eq("id", leadId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!leadId && isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            ฟอร์มติดตามลูกค้า {leadData?.full_name && `คุณ${leadData.full_name}`}
          </DialogTitle>
          <DialogDescription>
            บันทึกข้อมูลการติดตามลีดรายนี้อย่างละเอียด โดยระบุรายละเอียดการติดตามและข้อมูลสำคัญต่างๆ
          </DialogDescription>
        </DialogHeader>

        {isOpen && (
          <ProductivityLogForm 
            key={dialogKey}
            leadId={leadId} 
            onSuccess={onClose} 
            isWholesale={isWholesale} 
            isPackage={isPackage}
            customerName={leadData?.full_name} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddProductivityLogDialog;
