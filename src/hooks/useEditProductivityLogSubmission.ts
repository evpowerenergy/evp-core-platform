import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { validateProductivityLogForm } from "@/utils/productivityLogValidation";
import { ProductivityLogFormData } from "./useProductivityLogForm";

export const useEditProductivityLogSubmission = (
  logId: number,
  leadId: number, 
  formData: ProductivityLogFormData, 
  resetForm: () => void, 
  onSuccess: () => void,
  isPackage: boolean = false
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateLogMutation = useMutation({
    mutationFn: async (data: ProductivityLogFormData) => {

      // Validate form data
      const errors = validateProductivityLogForm(data, isPackage);
      if (errors.length > 0) {
        throw new Error(errors.join('\n'));
      }

      // อัปเดตข้อมูลใน lead_productivity_logs
      const { data: updatedLog, error: logError } = await supabase
        .from('lead_productivity_logs')
        .update({
          status: data.operation_status,
          note: data.note || null,
          next_follow_up: data.next_follow_up || null,
          next_follow_up_details: data.next_follow_up_details || null,
          contact_status: data.contact_status || null,
          contact_fail_reason: data.contact_fail_reason || null,
          lead_group: data.lead_group || null,
          customer_category: data.customer_category || null,
          presentation_type: data.presentation_type || null,
          interested_kw_size: data.interested_kw_size || null,
          building_info: data.building_info || null,
          installation_notes: data.installation_notes || null,
          can_issue_qt: data.can_issue_qt,
          qt_fail_reason: data.qt_fail_reason || null,
          sale_chance_percent: data.sale_chance_percent,
          sale_chance_status: data.sale_chance_status || null,
          credit_approval_status: data.credit_approval_status || null,
          cxl_group: data.cxl_group || null,
          cxl_reason: data.cxl_reason || null,
          cxl_detail: data.cxl_detail || null,
          is_zero_down_payment: data.is_zero_down_payment || false,
          down_payment_amount: data.down_payment_amount || null,
        })
        .eq('id', logId)
        .select()
        .single();

      if (logError) {
        console.error('❌ Error updating productivity log:', logError);
        throw logError;
      }

      // อัปเดต lead's operation_status เพื่อให้ database trigger ทำงาน
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({ operation_status: data.operation_status })
        .eq('id', leadId);

      if (leadUpdateError) {
        console.error('⚠️ Lead update error:', leadUpdateError);
        // ไม่ throw error เพราะการอัปเดต lead status ไม่ใช่ส่วนสำคัญของการแก้ไข log
      }

      // อัปเดตข้อมูล quotations ถ้ามี
      if (data.has_qt || data.has_inv || data.total_amount) {
        // ตรวจสอบว่ามีข้อมูล quotations อยู่แล้วหรือไม่
        const { data: existingQuotations, error: checkError } = await supabase
          .from('quotations')
          .select('id')
          .eq('productivity_log_id', logId);

        if (checkError) {
          console.error('❌ Error checking existing quotations:', checkError);
        }

        if (existingQuotations && existingQuotations.length > 0) {
          // อัปเดตข้อมูลที่มีอยู่แล้ว
          const { error: updateError } = await supabase
            .from('quotations')
            .update({
              has_qt: data.has_qt,
              has_inv: data.has_inv,
              total_amount: data.total_amount,
              payment_method: data.payment_method || null,
              installment_percent: data.installment_percent,
              installment_amount: data.installment_amount,
              estimate_payment_date: data.estimate_payment_date || null,
              installment_periods: data.installment_periods,
            })
            .eq('productivity_log_id', logId);

          if (updateError) {
            console.error('❌ Error updating existing quotation:', updateError);
            throw updateError;
          }
        } else {
          // สร้างข้อมูลใหม่ถ้ายังไม่มี
          const { error: insertError } = await supabase
            .from('quotations')
            .insert({
              productivity_log_id: logId,
              has_qt: data.has_qt,
              has_inv: data.has_inv,
              total_amount: data.total_amount,
              payment_method: data.payment_method || null,
              installment_percent: data.installment_percent,
              installment_amount: data.installment_amount,
              estimate_payment_date: data.estimate_payment_date || null,
              installment_periods: data.installment_periods,
            });

          if (insertError) {
            console.error('❌ Error creating new quotation:', insertError);
            throw insertError;
          }
        }
      } else {
        // ถ้าไม่มีข้อมูล quotation ให้ลบข้อมูลเก่าออก
        const { error: deleteError } = await supabase
          .from('quotations')
          .delete()
          .eq('productivity_log_id', logId);

        if (deleteError) {
          console.error('❌ Error deleting quotations:', deleteError);
        }
      }

      // อัปเดตข้อมูล quotation_documents
      const hasQuotationDocuments = data.quotation_documents && data.quotation_documents.length > 0;
      const hasInvoiceDocuments = data.invoice_documents && data.invoice_documents.length > 0;
      
      if (hasQuotationDocuments || hasInvoiceDocuments) {
        // ดึงข้อมูลเอกสารที่มีอยู่แล้ว
        const { data: existingDocuments, error: checkDocError } = await supabase
          .from('quotation_documents')
          .select('id, document_type, document_number')
          .eq('productivity_log_id', logId);

        if (checkDocError) {
          console.error('❌ Error checking existing documents:', checkDocError);
        }

        // สร้าง map ของเอกสารที่มีอยู่แล้ว
        const existingDocsMap = new Map();
        if (existingDocuments) {
          existingDocuments.forEach(doc => {
            const key = `${doc.document_type}_${doc.document_number}`;
            existingDocsMap.set(key, doc);
          });
        }

        // อัปเดตหรือเพิ่มเอกสาร quotation
        for (const quotationDoc of data.quotation_documents) {
          if (quotationDoc.document_number.trim()) {
            const key = `quotation_${quotationDoc.document_number.trim()}`;
            const existingDoc = existingDocsMap.get(key);

            if (existingDoc) {
              // อัปเดตเอกสารที่มีอยู่แล้ว
              const { error: updateError } = await supabase
                .from('quotation_documents')
                .update({
                  document_number: quotationDoc.document_number.trim(),
                  amount: quotationDoc.amount || null,
                  delivery_fee: quotationDoc.delivery_fee || null,
                })
                .eq('id', existingDoc.id);

              if (updateError) {
                console.error('❌ Error updating quotation document:', updateError);
                throw updateError;
              }
            } else {
              // เพิ่มเอกสารใหม่
              const { error: insertError } = await supabase
                .from('quotation_documents')
                .insert({
                  productivity_log_id: logId,
                  document_type: 'quotation',
                  document_number: quotationDoc.document_number.trim(),
                  amount: quotationDoc.amount || null,
                  delivery_fee: quotationDoc.delivery_fee || null,
                });

              if (insertError) {
                console.error('❌ Error creating quotation document:', insertError);
                throw insertError;
              }
            }
          }
        }

        // อัปเดตหรือเพิ่มเอกสาร invoice
        for (const invoiceDoc of data.invoice_documents) {
          if (invoiceDoc.document_number.trim()) {
            const key = `invoice_${invoiceDoc.document_number.trim()}`;
            const existingDoc = existingDocsMap.get(key);

            if (existingDoc) {
              // อัปเดตเอกสารที่มีอยู่แล้ว
              const { error: updateError } = await supabase
                .from('quotation_documents')
                .update({
                  document_number: invoiceDoc.document_number.trim(),
                  amount: invoiceDoc.amount || null,
                  delivery_fee: invoiceDoc.delivery_fee || null,
                })
                .eq('id', existingDoc.id);

              if (updateError) {
                console.error('❌ Error updating invoice document:', updateError);
                throw updateError;
              }
            } else {
              // เพิ่มเอกสารใหม่
              const { error: insertError } = await supabase
                .from('quotation_documents')
                .insert({
                  productivity_log_id: logId,
                  document_type: 'invoice',
                  document_number: invoiceDoc.document_number.trim(),
                  amount: invoiceDoc.amount || null,
                  delivery_fee: invoiceDoc.delivery_fee || null,
                });

              if (insertError) {
                console.error('❌ Error creating invoice document:', insertError);
                throw insertError;
              }
            }
          }
        }

        // ลบเอกสารเก่าที่ไม่ได้ใช้แล้ว
        const currentDocKeys = new Set();
        data.quotation_documents.forEach(doc => {
          if (doc.document_number.trim()) currentDocKeys.add(`quotation_${doc.document_number.trim()}`);
        });
        data.invoice_documents.forEach(doc => {
          if (doc.document_number.trim()) currentDocKeys.add(`invoice_${doc.document_number.trim()}`);
        });

        // ลบเอกสารที่ไม่ได้อยู่ในรายการปัจจุบัน
        if (existingDocuments) {
          for (const existingDoc of existingDocuments) {
            const key = `${existingDoc.document_type}_${existingDoc.document_number}`;
            if (!currentDocKeys.has(key)) {
              const { error: deleteError } = await supabase
                .from('quotation_documents')
                .delete()
                .eq('id', existingDoc.id);

              if (deleteError) {
                console.error('❌ Error deleting unused document:', deleteError);
              }
            }
          }
        }
      } else {
        // ถ้าไม่มีเอกสารให้ลบข้อมูลเก่าออก
        const { error: deleteError } = await supabase
          .from('quotation_documents')
          .delete()
          .eq('productivity_log_id', logId);

        if (deleteError) {
          console.error('❌ Error deleting documents:', deleteError);
        }
      }

      // อัปเดตข้อมูล appointments - Engineer Appointment
      if (data.site_visit_date || data.location) {
        // ตรวจสอบว่ามีข้อมูล appointments อยู่แล้วหรือไม่
        const { data: existingAppointments, error: checkAppError } = await supabase
          .from('appointments')
          .select('id')
          .eq('productivity_log_id', logId)
          .eq('appointment_type', 'engineer');

        if (checkAppError) {
          console.error('❌ Error checking existing appointments:', checkAppError);
        }

        if (existingAppointments && existingAppointments.length > 0) {
          // อัปเดตข้อมูลที่มีอยู่แล้ว
          const { error: updateError } = await supabase
            .from('appointments')
            .update({
              date: data.site_visit_date ? new Date(data.site_visit_date).toISOString() : null,
              location: data.location || null,
              building_details: data.building_info || null,
              installation_notes: data.installation_notes || null,
              appointment_type: 'engineer',
            })
            .eq('id', existingAppointments[0].id);

          if (updateError) {
            console.error('❌ Error updating existing engineer appointment:', updateError);
            throw updateError;
          }
        } else {
          // สร้างข้อมูลใหม่ถ้ายังไม่มี
          const { error: insertError } = await supabase
            .from('appointments')
            .insert({
              productivity_log_id: logId,
              date: data.site_visit_date ? new Date(data.site_visit_date).toISOString() : null,
              location: data.location || null,
              building_details: data.building_info || null,
              installation_notes: data.installation_notes || null,
              appointment_type: 'engineer',
              status: 'scheduled',
              note: 'การนัดหมายวิศวกรจากฟอร์มติดตามลูกค้า'
            });

          if (insertError) {
            console.error('❌ Error creating new engineer appointment:', insertError);
            throw insertError;
          }
        }
      } else {
        // ถ้าไม่มีข้อมูล engineer appointment ให้ลบ appointment เก่าออก (ถ้ามี)
        const { error: deleteError } = await supabase
          .from('appointments')
          .delete()
          .eq('productivity_log_id', logId)
          .eq('appointment_type', 'engineer');

        if (deleteError) {
          console.error('❌ Error deleting engineer appointment:', deleteError);
          // ไม่ throw error เพราะอาจจะไม่มี appointment อยู่แล้ว
        }
      }

      // อัปเดตข้อมูล appointments - Follow-up Appointment
      if (data.next_follow_up && data.next_follow_up.trim() !== '') {
        // ตรวจสอบว่ามีข้อมูล follow-up appointments อยู่แล้วหรือไม่
        const { data: existingFollowUpAppointments, error: checkFollowUpError } = await supabase
          .from('appointments')
          .select('id')
          .eq('productivity_log_id', logId)
          .eq('appointment_type', 'follow-up');

        if (checkFollowUpError) {
          console.error('❌ Error checking existing follow-up appointments:', checkFollowUpError);
        }

        if (existingFollowUpAppointments && existingFollowUpAppointments.length > 0) {
          // อัปเดตข้อมูลที่มีอยู่แล้ว
          const { error: updateError } = await supabase
            .from('appointments')
            .update({
              date: new Date(data.next_follow_up).toISOString(),
              note: data.next_follow_up_details || 'การนัดติดตามครั้งถัดไป',
              appointment_type: 'follow-up',
            })
            .eq('id', existingFollowUpAppointments[0].id);

          if (updateError) {
            console.error('❌ Error updating existing follow-up appointment:', updateError);
            throw updateError;
          }
        } else {
          // สร้างข้อมูลใหม่ถ้ายังไม่มี
          const { error: insertError } = await supabase
            .from('appointments')
            .insert({
              productivity_log_id: logId,
              date: new Date(data.next_follow_up).toISOString(),
              appointment_type: 'follow-up',
              status: 'scheduled',
              note: data.next_follow_up_details || 'การนัดติดตามครั้งถัดไป'
            });

          if (insertError) {
            console.error('❌ Error creating new follow-up appointment:', insertError);
            throw insertError;
          }
        }
      } else {
        // ถ้าไม่มีข้อมูล follow-up appointment ให้ลบ appointment เก่าออก (ถ้ามี)
        const { error: deleteError } = await supabase
          .from('appointments')
          .delete()
          .eq('productivity_log_id', logId)
          .eq('appointment_type', 'follow-up');

        if (deleteError) {
          console.error('❌ Error deleting follow-up appointment:', deleteError);
          // ไม่ throw error เพราะอาจจะไม่มี appointment อยู่แล้ว
        }
      }

      // อัปเดตข้อมูลสินค้าสำหรับ wholesale
      if (data.selected_products && data.selected_products.length > 0) {
        // ตรวจสอบว่ามีข้อมูลสินค้าอยู่แล้วหรือไม่
        const { data: existingProducts, error: checkProductsError } = await supabase
          .from('lead_products')
          .select('id, product_id')
          .eq('productivity_log_id', logId);

        if (checkProductsError) {
          console.error('❌ Error checking existing products:', checkProductsError);
        }

        // สร้าง map ของสินค้าที่มีอยู่แล้ว
        const existingProductsMap = new Map();
        if (existingProducts) {
          existingProducts.forEach(prod => {
            existingProductsMap.set(prod.product_id, prod);
          });
        }

        // อัปเดตหรือเพิ่มสินค้า
        for (const product of data.selected_products) {
          if (product.product_id && product.quantity > 0) {
            const existingProduct = existingProductsMap.get(product.product_id);

            if (existingProduct) {
              // อัปเดตสินค้าที่มีอยู่แล้ว
              const { error: updateError } = await supabase
                .from('lead_products')
                .update({
                  quantity: product.quantity,
                  unit_price: product.unit_price || 0,
                  cost_price: product.cost_price || 0,
                })
                .eq('id', existingProduct.id);

              if (updateError) {
                console.error('❌ Error updating existing product:', updateError);
                throw updateError;
              }
            } else {
              // เพิ่มสินค้าใหม่
              const { error: insertError } = await supabase
                .from('lead_products')
                .insert({
                  productivity_log_id: logId,
                  lead_id: leadId,
                  product_id: product.product_id,
                  quantity: product.quantity,
                  unit_price: product.unit_price || 0,
                  cost_price: product.cost_price || 0,
                });

              if (insertError) {
                console.error('❌ Error creating new product:', insertError);
                throw insertError;
              }
            }
          }
        }

        // ลบสินค้าเก่าที่ไม่ได้อยู่ในรายการปัจจุบัน
        const currentProductIds = new Set(
          data.selected_products
            .filter(p => p.product_id && p.quantity > 0)
            .map(p => p.product_id)
        );

        if (existingProducts) {
          for (const existingProduct of existingProducts) {
            if (!currentProductIds.has(existingProduct.product_id)) {
              const { error: deleteError } = await supabase
                .from('lead_products')
                .delete()
                .eq('id', existingProduct.id);

              if (deleteError) {
                console.error('❌ Error deleting unused product:', deleteError);
              }
            }
          }
        }
      } else {
        // ถ้าไม่มีสินค้าให้ลบข้อมูลเก่าออก
        const { error: deleteError } = await supabase
          .from('lead_products')
          .delete()
          .eq('productivity_log_id', logId);

        if (deleteError) {
          console.error('❌ Error deleting products:', deleteError);
        }
      }

      return updatedLog;
    },
    onSuccess: () => {
      toast({
        title: "สำเร็จ",
        description: "อัปเดตข้อมูลการติดตามเรียบร้อยแล้ว",
      });
      
      // รีเฟรชข้อมูล
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', leadId] });
      queryClient.invalidateQueries({ queryKey: ['productivity-log', logId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] }); // รีเฟรช appointments เพื่อให้ notification system อัปเดต
      
      resetForm();
      onSuccess();
    },
    onError: (error: any) => {
      console.error('❌ Error updating productivity log:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถอัปเดตข้อมูลการติดตามได้",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateLogMutation.mutateAsync(formData);
  };

  const handleClose = () => {
    resetForm();
    onSuccess();
  };

  return {
    handleSubmit,
    handleClose,
    updateLogMutation,
  };
};