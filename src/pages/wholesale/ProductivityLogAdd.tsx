import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ProductivityLogForm from "@/components/timeline/ProductivityLogForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const WholesaleProductivityLogAdd = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const leadId = id ? parseInt(id, 10) : null;
  const isValidId = leadId && !isNaN(leadId);

  // ดึงข้อมูลลูกค้า
  const { data: leadData } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const { data, error } = await supabase
        .from("leads")
        .select("full_name, category")
        .eq("id", leadId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!leadId,
  });

  if (!isValidId) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-600 mt-2">ไม่พบข้อมูลลีดที่ระบุ</p>
          <Button 
            onClick={() => navigate('/wholesale')} 
            className="mt-4"
          >
            กลับสู่หน้าหลัก
          </Button>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    navigate(`/wholesale/leads/${leadId}/timeline`);
  };

  const handleCancel = () => {
    navigate(`/wholesale/leads/${leadId}/timeline`);
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับ
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ฟอร์มติดตามลูกค้า {leadData?.full_name && `คุณ${leadData.full_name}`}
          </h1>
          <p className="text-gray-600 mt-1">
            บันทึกข้อมูลการติดตามลีดรายนี้อย่างละเอียด โดยระบุรายละเอียดการติดตามและข้อมูลสำคัญต่างๆ
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <ProductivityLogForm 
          leadId={leadId} 
          onSuccess={handleSuccess} 
          isWholesale={leadData?.category === 'Wholesale' || leadData?.category === 'Wholesales'}
          customerName={leadData?.full_name} 
        />
      </div>
    </div>
  );
};

export default WholesaleProductivityLogAdd;