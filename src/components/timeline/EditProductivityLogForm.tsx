import React, { useCallback } from 'react';
import { useProductivityLogForm } from "@/hooks/useProductivityLogForm";
import { useEditProductivityLogSubmission } from "@/hooks/useEditProductivityLogSubmission";
import ProductivityLogFormFields from "./form-sections/ProductivityLogFormFields";
import ProductivityLogFormActions from "./form-sections/ProductivityLogFormActions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EditProductivityLogFormProps {
  logId: number;
  leadId: number;
  onSuccess: () => void;
  isWholesale?: boolean;
  isPackage?: boolean;
  customerName?: string;
}

const EditProductivityLogForm = ({ logId, leadId, onSuccess, isWholesale, isPackage, customerName }: EditProductivityLogFormProps) => {
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

  const { data: logData, error: logError, isLoading } = useQuery({
    queryKey: ["productivity-log", logId],
    queryFn: async () => {
      // ดึงข้อมูลจาก lead_productivity_logs
      const { data: logData, error: logError } = await supabase
        .from("lead_productivity_logs")
        .select("*")
        .eq("id", logId)
        .maybeSingle(); // ใช้ maybeSingle() แทน single() เพื่อจัดการกับ 0 rows
      
      if (logError) {
        console.error('❌ Log query error:', logError);
        throw logError;
      }
      
      // ตรวจสอบว่าพบข้อมูลหรือไม่
      if (!logData) {
        console.error('❌ No productivity log found with id:', logId);
        throw new Error(`ไม่พบข้อมูลการติดตามที่ ID: ${logId}`);
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
        .eq("productivity_log_id", logId);
      
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
        .eq("productivity_log_id", logId);
      
      if (quotationDocumentsError) {
        console.error('❌ Quotation documents query error:', quotationDocumentsError);
        throw quotationDocumentsError;
      }
      
      // ดึงข้อมูลจาก appointments โดยใช้ productivity_log_id
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .select(`
          id,
          date,
          location,
          building_details,
          installation_notes
        `)
        .eq("productivity_log_id", logId);
      
      if (appointmentError) {
        console.error('❌ Appointment query error:', appointmentError);
        throw appointmentError;
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
        .eq("productivity_log_id", logId);
      
      if (leadProductsError) {
        console.error('❌ Lead products query error:', leadProductsError);
        throw leadProductsError;
      }
      
      const result = {
        ...logData,
        quotations: quotationData || [],
        quotation_documents: quotationDocumentsData || [],
        appointments: appointmentData || [],
        lead_products: leadProductsData || []
      };
      
      return result;
    },
    enabled: !!logId,
    staleTime: 0, // ไม่ใช้ cache เพื่อให้ดึงข้อมูลใหม่ทุกครั้ง
    gcTime: 0,
  });

  // สร้าง storage key สำหรับฟอร์มแก้ไขนี้
  const storageKey = `edit-productivity-log-form-${logId}`;
  
  const { formData, setFormData, calculatedData, resetForm, initializeForm, clearStorage } = useProductivityLogForm(undefined, storageKey);
  
  // Wrap onSuccess เพื่อ clear storage เมื่อบันทึกสำเร็จ
  const handleSuccess = useCallback(() => {
    clearStorage();
    onSuccess();
  }, [clearStorage, onSuccess]);
  
  const { handleSubmit, handleClose, updateLogMutation } = useEditProductivityLogSubmission(
    logId,
    leadId, 
    formData, 
    resetForm, 
    handleSuccess,
    isPackage
  );

  // ใช้ state เพื่อ track ว่าได้ set ข้อมูลจาก log แล้วหรือยัง
  const [hasInitialized, setHasInitialized] = React.useState(false);

  // เช็คว่ามีข้อมูลใน localStorage หรือไม่
  const hasStoredData = React.useMemo(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return !!stored;
    } catch (error) {
      return false;
    }
  }, [storageKey]);

  // ใช้ ref เพื่อเก็บ logId ก่อนหน้า
  const prevLogIdRef = React.useRef(logId);

  // Reset form และ flag เฉพาะเมื่อ logId เปลี่ยน
  React.useEffect(() => {
    // ถ้า logId เปลี่ยนจากค่าก่อนหน้า ให้ clear storage และ reset
    if (prevLogIdRef.current !== logId) {
      clearStorage();
      resetForm();
      setHasInitialized(false);
      prevLogIdRef.current = logId;
    }
  }, [logId, clearStorage, resetForm]);

  React.useEffect(() => {
    // ⚠️ สำคัญ: ถ้ามีข้อมูลใน localStorage แล้ว ไม่ต้องโหลดจาก API เพื่อป้องกัน override ข้อมูลที่ผู้ใช้กรอก
    if (hasStoredData) {
      console.log('✅ [Edit Form] ใช้ข้อมูลจาก localStorage (ป้องกัน override)');
      setHasInitialized(true);
      return;
    }

    // ถ้า query ยังไม่เสร็จ (มี logId แต่ logData ยังไม่มา) ให้รอ
    if (logId && logData === undefined) {
      return;
    }
    
    if (logData && !hasInitialized) {
      console.log('✅ [Edit Form] โหลดข้อมูลจาก API (ครั้งแรก)');
      
      // ใช้ข้อมูลจาก log ที่ต้องการแก้ไข
      const { id, created_at, created_at_thai, quotations, quotation_documents, appointments, lead_products, ...rest } = logData;
      
      // ดึงข้อมูลจาก quotation ถ้ามี
      const quotationData = quotations && quotations.length > 0 ? quotations[0] : {} as any;
      
      // ดึงข้อมูลจาก appointment ถ้ามี
      const appointmentData = appointments && appointments.length > 0 ? appointments[0] : {} as any;
      
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
        next_follow_up: formatDateForInput(rest.next_follow_up),
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
        // ข้อมูลจาก appointment
        site_visit_date: formatDateForInput(appointmentData.date),
        location: appointmentData.location || '',
        building_info: appointmentData.building_details || '',
        installation_notes: appointmentData.installation_notes || '',
        // แปลง null เป็น empty string สำหรับฟิลด์อื่นๆ
        note: rest.note || '',
        operation_status: rest.status || '',
        contact_status: rest.contact_status || '',
        lead_group: rest.lead_group || '',
        customer_category: rest.customer_category || '',
        sale_chance_status: rest.sale_chance_status || '',
        credit_approval_status: rest.credit_approval_status || '',
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
      setHasInitialized(true);
    } else if (logData === null && !hasInitialized) {
      // ถ้าไม่มี log ให้ reset form เป็นค่าเริ่มต้น
      resetForm();
      setHasInitialized(true);
    }
  }, [logData, hasInitialized, hasStoredData, initializeForm]);

  // แสดง loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // แสดง error state
  if (logError) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-gray-600 mb-4">
            {logError.message || 'ไม่สามารถโหลดข้อมูลการติดตามได้'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

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
        isSubmitting={updateLogMutation.isPending}
      />
    </form>
  );
};

export default EditProductivityLogForm;