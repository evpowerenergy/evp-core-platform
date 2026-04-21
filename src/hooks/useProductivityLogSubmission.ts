import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { ProductivityLogFormData } from "./useProductivityLogForm";

export const useProductivityLogSubmission = (leadId: number, onSuccess: () => void) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createLogMutation = useMutation({
    mutationFn: async (data: ProductivityLogFormData) => {

      
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;
      
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
      

      
      // สร้าง log หลัก
      const { data: logResult, error: logError } = await supabase
        .from('lead_productivity_logs')
        .insert([{
          lead_id: leadId,
          status: data.operation_status,
          note: data.note, // รายละเอียดการติดตาม (ฟิลด์หลัก)
          next_follow_up: data.next_follow_up ? new Date(data.next_follow_up).toISOString() : null,
          next_follow_up_details: data.next_follow_up_details || null, // รายละเอียดการนัดติดตามครั้งถัดไป

          staff_id: currentUserId,
          // created_at will be set by database default (now())
          
          // Contact fields
          contact_status: data.contact_status || 'ติดต่อได้',
          contact_fail_reason: data.contact_fail_reason || null,
          
          // Category fields
          lead_group: data.lead_group || null,
          customer_category: data.customer_category || null,
          presentation_type: data.presentation_type || null,
          
          // kW size interest (Package only)
          interested_kw_size: data.interested_kw_size || null,
          
          // Site visit fields - เก็บไว้ใน log หลัก
          building_info: data.building_info || null,
          installation_notes: data.installation_notes || null,
          
          // Quotation fields
          can_issue_qt: data.can_issue_qt,
          qt_fail_reason: data.qt_fail_reason || null,
          
          // Sales opportunity
          sale_chance_percent: data.sale_chance_percent,
          sale_chance_status: data.sale_chance_status || null,
          credit_approval_status: data.credit_approval_status || null,
          
          // CXL fields
          cxl_group: data.cxl_group || null,
          cxl_detail: data.cxl_detail || null,
          cxl_reason: data.cxl_reason || null
        }])
        .select()
        .single();
      
      if (logError) {
        console.error('❌ Main log creation error:', logError);
        throw logError;
      }



      // Update lead's operation_status
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({ operation_status: data.operation_status })
        .eq('id', leadId);

      if (leadUpdateError) {
        console.error('⚠️ Lead update error:', leadUpdateError);
      } else {
  
      }

      // สร้าง appointment สำหรับการลงพื้นที่ (วิศวกร)
      const hasEngineerAppointmentData = (data.site_visit_date && data.site_visit_date.trim() !== '') || 
                                        (data.location && data.location.trim() !== '');

      if (hasEngineerAppointmentData) {

        const engineerAppointmentData = {
          productivity_log_id: logResult.id,
          date: data.site_visit_date ? new Date(data.site_visit_date).toISOString() : null,
          location: data.location || null,
          appointment_type: 'engineer',
          status: 'scheduled',
          building_details: data.building_info || null,
          installation_notes: data.installation_notes || null,
          note: 'การนัดหมายวิศวกรจากฟอร์มติดตามลูกค้า'
        };
        


        const { data: engineerAppointmentResult, error: engineerAppointmentError } = await supabase
          .from('appointments')
          .insert([engineerAppointmentData])
          .select();
        
        if (engineerAppointmentError) {
          console.error('❌ Engineer appointment creation error:', engineerAppointmentError);
          throw engineerAppointmentError;
        } else {
  
        }
      }

      // สร้าง appointment สำหรับการติดตามครั้งถัดไป
      if (data.next_follow_up && data.next_follow_up.trim() !== '') {

        const followUpAppointmentData = {
          productivity_log_id: logResult.id,
          date: data.next_follow_up ? new Date(data.next_follow_up).toISOString() : null,
          appointment_type: 'follow-up',
          status: 'scheduled',
          note: data.next_follow_up_details || 'การนัดติดตามครั้งถัดไป'
        };
        


        const { data: followUpAppointmentResult, error: followUpAppointmentError } = await supabase
          .from('appointments')
          .insert([followUpAppointmentData])
          .select();
        
        if (followUpAppointmentError) {
          console.error('❌ Follow-up appointment creation error:', followUpAppointmentError);
          throw followUpAppointmentError;
        } else {
  
        }
      }

      // บันทึกหมายเลขเอกสาร quotation_documents แยกต่างหาก
      const hasDocumentNumbers = (data.quotation_documents && data.quotation_documents.length > 0 && data.quotation_documents.some(doc => doc.document_number.trim() !== '')) ||
                                 (data.invoice_documents && data.invoice_documents.length > 0 && data.invoice_documents.some(doc => doc.document_number.trim() !== ''));

      if (hasDocumentNumbers) {

        const documentPromises = [];
        
        // บันทึกหมายเลขใบเสนอราคา
        if (data.quotation_documents && data.quotation_documents.length > 0) {
          data.quotation_documents.forEach(doc => {
            if (doc.document_number.trim()) {
              documentPromises.push(
                supabase.from('quotation_documents').insert({
                  productivity_log_id: logResult.id,
                  document_type: 'quotation',
                  document_number: doc.document_number.trim(),
                  amount: doc.amount || null,
                  delivery_fee: doc.delivery_fee || null
                })
              );
            }
          });
        }
        
        // บันทึกหมายเลข Invoice
        if (data.invoice_documents && data.invoice_documents.length > 0) {
          data.invoice_documents.forEach(doc => {
            if (doc.document_number.trim()) {
              documentPromises.push(
                supabase.from('quotation_documents').insert({
                  productivity_log_id: logResult.id,
                  document_type: 'invoice',
                  document_number: doc.document_number.trim(),
                  amount: doc.amount || null,
                  delivery_fee: doc.delivery_fee || null
                })
              );
            }
          });
        }
        
        // รันงานทั้งหมดพร้อมกัน
        if (documentPromises.length > 0) {
          try {
            await Promise.all(documentPromises);

          } catch (docError) {
            console.error('❌ Document creation error:', docError);
            throw docError; // throw error เพื่อให้ user รู้ว่าเกิดข้อผิดพลาด
          }
        }
      }

      // สร้าง quotation ถ้ามีข้อมูลเสนอราคา
      const hasQuotationData = data.has_qt || data.has_inv || data.total_amount;

      if (hasQuotationData) {

        const quotationData = {
          productivity_log_id: logResult.id,
          has_qt: data.has_qt || false,
          has_inv: data.has_inv || false,
          total_amount: data.total_amount || null,
          payment_method: data.payment_method || null,
          installment_percent: data.installment_type === 'percent' ? data.installment_percent : 
                               data.installment_type === 'full_payment' ? 100 : null,
          installment_amount: data.installment_type === 'amount' ? data.installment_amount : null,
          installment_periods: data.installment_type === 'full_payment' ? 1 : 
                              data.installment_periods || null,
          estimate_payment_date: data.estimate_payment_date || null,
        };
        
        const { data: quotationResult, error: quotationError } = await supabase
          .from('quotations')
          .insert([quotationData])
          .select();
        
        if (quotationError) {
          console.error('❌ Quotation creation error:', quotationError);
          throw quotationError;
        } else {

          // หมายเหตุ: การบันทึก quotation_documents ได้ทำไปแล้วข้างบน
          
          // สร้าง appointment สำหรับการชำระเงิน ถ้ามี estimate_payment_date
          if (data.estimate_payment_date && data.estimate_payment_date.trim() !== '') {
            const paymentAppointmentData = {
              productivity_log_id: logResult.id,
              date: data.estimate_payment_date ? new Date(data.estimate_payment_date).toISOString() : null,
              appointment_type: 'payment',
              status: 'scheduled',
              note: `ประมาณการชำระเงิน ${data.total_amount ? data.total_amount.toLocaleString() + ' บาท' : ''} ${data.payment_method ? '(' + data.payment_method + ')' : ''}`
            };
            
            const { data: paymentAppointmentResult, error: paymentAppointmentError } = await supabase
              .from('appointments')
              .insert([paymentAppointmentData])
              .select();
            
            if (paymentAppointmentError) {
              console.error('❌ Payment appointment creation error:', paymentAppointmentError);
              throw paymentAppointmentError;
            }
          }
        }
      }
      
      return logResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['my-leads'] });
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      toast({
        title: "สำเร็จ",
        description: "บันทึกข้อมูลการติดตามลูกค้าเรียบร้อยแล้ว",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error('❌ Form submission error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถบันทึกข้อมูลได้: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  return createLogMutation;
};