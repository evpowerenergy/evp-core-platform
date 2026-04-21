import React, { useCallback } from 'react';
import { useProductivityLogForm } from "@/hooks/useProductivityLogForm";
import { useProductivityLogFormSubmission } from "@/hooks/useProductivityLogFormSubmission";
import ProductivityLogFormFields from "./form-sections/ProductivityLogFormFields";
import ProductivityLogFormActions from "./form-sections/ProductivityLogFormActions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCacheStrategy } from "@/lib/cacheStrategies";

interface ProductivityLogFormProps {
  leadId: number;
  onSuccess: () => void;
  isWholesale?: boolean;
  isPackage?: boolean;
  customerName?: string;
}

const ProductivityLogForm = ({ leadId, onSuccess, isWholesale, isPackage, customerName }: ProductivityLogFormProps) => {
  // ✅ ใช้ NO_CACHE strategy สำหรับ forms
  const noCacheStrategy = useCacheStrategy('NO_CACHE');
  
  // ฟังก์ชันช่วยแปลงรูปแบบวันที่สำหรับ input datetime-local
  const formatDateForInput = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      // ใช้ toISOString() เพื่อแปลงเป็น UTC แล้วตัด timezone ออก
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // แปลงเป็นรูปแบบ YYYY-MM-DDTHH:mm สำหรับ input datetime-local
      // ใช้ toISOString() แล้วตัดส่วน timezone และ seconds ออก
      const isoString = date.toISOString();
      // ตัดส่วน timezone และ seconds ออก: "2025-09-06T05:56:00.000Z" -> "2025-09-06T05:56"
      return isoString.substring(0, 16);
    } catch (error) {
      console.error('❌ Error formatting date:', error);
      return '';
    }
  };

  // ฟังก์ชันช่วยแปลงรูปแบบวันที่สำหรับ input type="date" (YYYY-MM-DD)
  const formatDateOnly = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // แปลงเป็น YYYY-MM-DD สำหรับ input type="date"
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('❌ Error formatting date:', error);
      return '';
    }
  };
  const { data: latestLog } = useQuery({
    queryKey: ["latest-productivity-log", leadId],
    queryFn: async () => {
      // ดึงข้อมูลจาก lead_productivity_logs
      const { data: logData, error: logError } = await supabase
        .from("lead_productivity_logs")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at_thai", { ascending: false })
        .limit(1);
      
      if (logError) {
        console.error('❌ Log query error:', logError);
        throw logError;
      }
      
      if (!logData || logData.length === 0) {
        return null;
      }
      
      const latestLogData = logData[0];
      
      // ดึงข้อมูล operation_status จาก leads
      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .select("operation_status")
        .eq("id", leadId)
        .single();
      
      if (leadError) {
        console.error('❌ Lead query error:', leadError);
        throw leadError;
      }
      
      // ดึงข้อมูลจาก quotations โดยใช้ productivity_log_id
      const { data: quotationData, error: quotationError } = await supabase
        .from("quotations")
        .select(`
          id,
          has_qt,
          has_inv,
          total_amount,
          payment_method,
          installment_percent,
          installment_amount,
          estimate_payment_date,
          installment_periods
        `)
        .eq("productivity_log_id", latestLogData.id);
      
      if (quotationError) {
        console.error('❌ Quotation query error:', quotationError);
        throw quotationError;
      }
      
      // ดึงข้อมูลจาก quotation_documents โดยใช้ productivity_log_id
      const { data: quotationDocumentsData, error: quotationDocumentsError } = await supabase
        .from("quotation_documents")
        .select(`
          id,
          document_type,
          document_number,
          amount,
          delivery_fee
        `)
        .eq("productivity_log_id", latestLogData.id);
      
      if (quotationDocumentsError) {
        console.error('❌ Quotation documents query error:', quotationDocumentsError);
        throw quotationDocumentsError;
      }
      
      // ดึงข้อมูลจาก appointments แยกตามประเภท
      const [engineerAppointments, followUpAppointments] = await Promise.all([
        // Engineer appointments
        supabase
          .from("appointments")
          .select(`
            id,
            date,
            location,
            building_details,
            installation_notes,
            appointment_type,
            note
          `)
          .eq("productivity_log_id", latestLogData.id)
          .eq("appointment_type", "engineer"),

        // Follow-up appointments
        supabase
          .from("appointments")
          .select(`
            id,
            date,
            appointment_type,
            note
          `)
          .eq("productivity_log_id", latestLogData.id)
          .eq("appointment_type", "follow-up")
      ]);

      if (engineerAppointments.error) {
        console.error('❌ Engineer appointments query error:', engineerAppointments.error);
        throw engineerAppointments.error;
      }

      if (followUpAppointments.error) {
        console.error('❌ Follow-up appointments query error:', followUpAppointments.error);
        throw followUpAppointments.error;
      }
      
      // ดึงข้อมูลสินค้าจาก lead_products โดยใช้ productivity_log_id
      const { data: leadProductsData, error: leadProductsError } = await supabase
        .from("lead_products")
        .select(`
          id,
          product_id,
          quantity,
          unit_price,
          cost_price,
          products(name, cost_price)
        `)
        .eq("productivity_log_id", latestLogData.id);
      
      if (leadProductsError) {
        console.error('❌ Lead products query error:', leadProductsError);
        throw leadProductsError;
      }
      
      const result = {
        ...latestLogData,
        operation_status: leadData?.operation_status || '',
        quotations: quotationData || [],
        quotation_documents: quotationDocumentsData || [],
        engineer_appointments: engineerAppointments.data || [],
        follow_up_appointments: followUpAppointments.data || [],
        lead_products: leadProductsData || []
      };
      
      
      return result;
    },
    enabled: !!leadId,
    ...noCacheStrategy, // ✅ ใช้ NO_CACHE strategy
  });

  // สร้าง storage key สำหรับฟอร์มนี้
  const storageKey = `productivity-log-form-${leadId}`;
  
  const { formData, setFormData, calculatedData, resetForm, initializeForm, clearStorage } = useProductivityLogForm(undefined, storageKey);
  
  // Wrap onSuccess เพื่อ clear storage เมื่อบันทึกสำเร็จ
  const handleSuccess = useCallback(() => {
    clearStorage();
    onSuccess();
  }, [clearStorage, onSuccess]);
  
  const { handleSubmit, handleClose, createLogMutation } = useProductivityLogFormSubmission(
    leadId, 
    formData, 
    resetForm, 
    handleSuccess,
    isPackage
  );

  // ใช้ state เพื่อ track ว่าได้ set ข้อมูลจาก log ล่าสุดแล้วหรือยัง
  const [hasInitialized, setHasInitialized] = React.useState(false);

  // Reset form และ flag เมื่อ component mount หรือ leadId เปลี่ยน
  React.useEffect(() => {
    clearStorage(); // Clear storage เมื่อ leadId เปลี่ยนเพื่อเริ่มต้นใหม่
    resetForm();
    setHasInitialized(false);
  }, [leadId, resetForm, clearStorage]);

  React.useEffect(() => {
    // ถ้า query ยังไม่เสร็จ (มี leadId แต่ latestLog ยังไม่มา) ให้รอ
    if (leadId && latestLog === undefined) {
      return;
    }
    
    if (latestLog && !hasInitialized) {
      // ✅ Logic ใหม่: ไม่โหลดข้อมูลเก่าทันที
      // ให้เริ่มต้นฟอร์มใหม่เสมอ และรอให้ผู้ใช้เลือก presentation_type ก่อน
      resetForm();
      setHasInitialized(true);
      return;
      
    } else if (latestLog === null && !hasInitialized) {
      // ถ้าไม่มี log ล่าสุด ให้ reset form เป็นค่าเริ่มต้น
      resetForm();
      setHasInitialized(true);
    }
  }, [latestLog, hasInitialized, initializeForm]);

  // ✅ Logic ใหม่: โหลดข้อมูลเก่าเมื่อผู้ใช้เลือก "การนำเสนอเก่า" และ clear เมื่อเปลี่ยนเป็น "การนำเสนอใหม่"
  React.useEffect(() => {
    // ถ้ายังไม่ได้เลือก presentation_type ให้ไม่ทำอะไร
    if (!formData.presentation_type) {
      return;
    }

    // ถ้าเลือกการนำเสนอใหม่ ให้ clear ฟอร์ม แต่เก็บ presentation_type และ lead_group ไว้
    if (formData.presentation_type === 'การนำเสนอใหม่') {
      const currentPresentationType = formData.presentation_type;
      const currentLeadGroup = formData.lead_group; // ✅ เก็บ lead_group ไว้
      resetForm();
      // ตั้งค่า presentation_type และ lead_group ใหม่หลังจาก reset
      setFormData(prev => ({ 
        ...prev, 
        presentation_type: currentPresentationType,
        lead_group: currentLeadGroup // ✅ คืนค่า lead_group เดิม
      }));
      return;
    }

    // ถ้าเลือกการนำเสนอเก่า และมี latestLog ให้โหลดข้อมูลเก่า
    if (latestLog && formData.presentation_type === 'การนำเสนอเก่า') {
      // เก็บค่าที่ผู้ใช้เลือกไว้ก่อน (ถ้ามี)
      const userSelectedLeadGroup = formData.lead_group;
      
      // ก๊อปปี้ข้อมูลจาก log ล่าสุด ยกเว้น next_follow_up และ lead_group เท่านั้น
      const { next_follow_up, lead_group, id, created_at, created_at_thai, quotations, quotation_documents, engineer_appointments, follow_up_appointments, lead_products, ...rest } = latestLog;
      
      // ดึงข้อมูลจาก quotation ถ้ามี
      const quotationData = quotations && quotations.length > 0 ? quotations[0] : {} as any;
      
      // ดึงข้อมูลจาก appointments แยกตามประเภท
      const engineerAppointment = engineer_appointments && engineer_appointments.length > 0 ? engineer_appointments[0] : {} as any;
      const followUpAppointment = follow_up_appointments && follow_up_appointments.length > 0 ? follow_up_appointments[0] : {} as any;
      
      // แยกเอกสารตามประเภทและรวม amount และ delivery_fee
      const quotationDocuments = (quotation_documents as any[])
        ?.filter((doc: any) => doc.document_type === 'quotation')
        .map((doc: any) => ({
          document_number: doc.document_number,
          amount: doc.amount,
          delivery_fee: doc.delivery_fee
        })) || [];
      
      const invoiceDocuments = (quotation_documents as any[])
        ?.filter((doc: any) => doc.document_type === 'invoice')
        .map((doc: any) => ({
          document_number: doc.document_number,
          amount: doc.amount,
          delivery_fee: doc.delivery_fee
        })) || [];

      const initData = {
        ...rest,
        // แปลง null เป็น empty string สำหรับ text fields
        contact_fail_reason: rest.contact_fail_reason || '',
        qt_fail_reason: rest.qt_fail_reason || '',
        cxl_reason: rest.cxl_reason || '',
        cxl_detail: rest.cxl_detail || '',
        next_follow_up_details: rest.next_follow_up_details || '',
        // ข้อมูลจาก quotation
        has_qt: quotationData.has_qt || false,
        has_inv: quotationData.has_inv || false,
        total_amount: quotationData.total_amount || null,
        payment_method: quotationData.payment_method || '',
        installment_type: quotationData.installment_type || 'full_payment',
        installment_percent: quotationData.installment_percent || null,
        installment_amount: quotationData.installment_amount || null,
        estimate_payment_date: formatDateOnly(quotationData.estimate_payment_date),
        installment_periods: quotationData.installment_periods || null,
        is_zero_down_payment: rest.is_zero_down_payment || false,
        down_payment_amount: rest.down_payment_amount || null,
        
        // ข้อมูลจาก Follow-up appointment (ถ้ามี)
        next_follow_up: formatDateForInput(followUpAppointment.date),
        
        // ข้อมูลจาก Engineer appointment
        site_visit_date: formatDateForInput(engineerAppointment.date),
        location: engineerAppointment.location || '',
        building_info: engineerAppointment.building_details || '',
        installation_notes: engineerAppointment.installation_notes || '',
        
        // แปลง null เป็น empty string สำหรับฟิลด์อื่นๆ
        note: rest.note || '',
        operation_status: rest.operation_status || '',
        contact_status: rest.contact_status || '',
        lead_group: userSelectedLeadGroup || lead_group || 'ลูกค้าเดิม', // ✅ ใช้ค่าที่ผู้ใช้เลือกไว้ก่อน หรือค่าจาก log ล่าสุด หรือ default เป็น "ลูกค้าเดิม"
        customer_category: rest.customer_category || '',
        presentation_type: 'การนำเสนอเก่า', // ✅ บังคับเป็น "การนำเสนอเก่า" เมื่อโหลดข้อมูลเก่า
        sale_chance_status: rest.sale_chance_status || '',
        cxl_group: rest.cxl_group || '',
        // ข้อมูลหมายเลขเอกสารจาก quotation_documents
        quotation_documents: quotationDocuments,
        invoice_documents: invoiceDocuments,
        // ข้อมูลสินค้าจาก lead_products (สำหรับ wholesale)
        selected_products: (lead_products || []).map((product: any) => ({
          product_id: product.product_id,
          quantity: product.quantity,
          unit_price: product.unit_price,
          product_name: product.products?.name || '',
          cost_price: product.cost_price || product.products?.cost_price || 0
        })),
        // ข้อมูลขนาด kW ที่สนใจ (สำหรับ package)
        interested_kw_size: rest.interested_kw_size || '',
      };
      
      // ใช้ initializeForm แทน setFormData
      initializeForm(initData);
    }
  }, [formData.presentation_type, latestLog, initializeForm]);

  // Debug: ตรวจสอบการเปลี่ยนแปลงของ formData

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ProductivityLogFormFields
        formData={formData}
        setFormData={setFormData}
        calculatedData={calculatedData}
        leadId={leadId}
        isWholesale={isWholesale}
        isPackage={isPackage}
      />

      <ProductivityLogFormActions
        onCancel={handleClose}
        isSubmitting={createLogMutation.isPending}
      />
    </form>
  );
};

export default ProductivityLogForm;
