/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // Initialize Supabase client with environment variables (เหมือน API เดิม - ใช้ SERVICE_ROLE_KEY)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('[API] Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // POST: Create productivity log with all related data (เหมือน API เดิม)
    if (req.method === 'POST') {
      const body = await req.json();
      const { leadId, userId, formData } = body;

      if (!leadId || !userId || !formData) {
        return new Response(
          JSON.stringify({ error: 'leadId, userId, and formData are required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      // Step 1: Create main productivity log (เหมือน API เดิม - logic ตรงกันทุก field)
      const { data: logResult, error: logError } = await supabase
        .from('lead_productivity_logs')
        .insert([{
          lead_id: leadId,
          status: formData.operation_status,
          note: formData.note,
          next_follow_up: formData.next_follow_up ? new Date(formData.next_follow_up).toISOString() : null,
          next_follow_up_details: formData.next_follow_up_details || null,
          staff_id: userId,
          
          // Contact fields
          contact_status: formData.contact_status || 'ติดต่อได้',
          contact_fail_reason: formData.contact_fail_reason || null,
          
          // Category fields
          lead_group: formData.lead_group || null,
          customer_category: formData.customer_category || null,
          presentation_type: formData.presentation_type || null,
          
          // kW size interest (Package only)
          interested_kw_size: formData.interested_kw_size || null,
          
          // Site visit fields
          building_info: formData.building_info || null,
          installation_notes: formData.installation_notes || null,
          
          // Quotation fields
          can_issue_qt: formData.can_issue_qt,
          qt_fail_reason: formData.qt_fail_reason || null,
          
          // Sales opportunity
          sale_chance_percent: formData.sale_chance_percent,
          sale_chance_status: formData.sale_chance_status || null,
          credit_approval_status: formData.credit_approval_status || null,
          
          // CXL fields
          cxl_group: formData.cxl_group || null,
          cxl_detail: formData.cxl_detail || null,
          cxl_reason: formData.cxl_reason || null,
          
          // Zero Down Payment
          is_zero_down_payment: formData.is_zero_down_payment || false,
          
          // Down Payment Amount
          down_payment_amount: formData.down_payment_amount || null
        }])
        .select()
        .single();
      
      if (logError) {
        console.error('❌ Main log creation error:', logError);
        throw new Error(`Failed to create productivity log: ${logError.message}`);
      }

      // Step 2: Update lead's operation_status (เหมือน API เดิม)
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({ operation_status: formData.operation_status })
        .eq('id', leadId);

      if (leadUpdateError) {
        console.error('⚠️ Lead update error:', leadUpdateError);
        // Don't throw - this is non-critical
      }

      // Step 3: Create engineer appointment (if data exists) (เหมือน API เดิม)
      const hasEngineerAppointmentData = (formData.site_visit_date && formData.site_visit_date.trim() !== '') || 
                                        (formData.location && formData.location.trim() !== '');

      if (hasEngineerAppointmentData) {
        const engineerAppointmentData = {
          productivity_log_id: logResult.id,
          date: formData.site_visit_date ? new Date(formData.site_visit_date).toISOString() : null,
          location: formData.location || null,
          appointment_type: 'engineer',
          status: 'scheduled',
          building_details: formData.building_info || null,
          installation_notes: formData.installation_notes || null,
          note: 'การนัดหมายวิศวกรจากฟอร์มติดตามลูกค้า'
        };

        const { error: engineerAppointmentError } = await supabase
          .from('appointments')
          .insert([engineerAppointmentData])
          .select();
        
        if (engineerAppointmentError) {
          console.error('❌ Engineer appointment creation error:', engineerAppointmentError);
          throw new Error(`Failed to create engineer appointment: ${engineerAppointmentError.message}`);
        }
      }

      // Step 4: Create follow-up appointment (if data exists) (เหมือน API เดิม)
      if (formData.next_follow_up && formData.next_follow_up.trim() !== '') {
        const followUpAppointmentData = {
          productivity_log_id: logResult.id,
          date: formData.next_follow_up ? new Date(formData.next_follow_up).toISOString() : null,
          appointment_type: 'follow-up',
          status: 'scheduled',
          note: formData.next_follow_up_details || 'การนัดติดตามครั้งถัดไป'
        };

        const { error: followUpAppointmentError } = await supabase
          .from('appointments')
          .insert([followUpAppointmentData])
          .select();
        
        if (followUpAppointmentError) {
          console.error('❌ Follow-up appointment creation error:', followUpAppointmentError);
          throw new Error(`Failed to create follow-up appointment: ${followUpAppointmentError.message}`);
        }
      }

      // Step 5: Create quotation documents (if data exists) (เหมือน API เดิม)
      const hasDocumentNumbers = (formData.quotation_documents && formData.quotation_documents.length > 0 && formData.quotation_documents.some((doc: any) => doc.document_number.trim() !== '')) ||
                                 (formData.invoice_documents && formData.invoice_documents.length > 0 && formData.invoice_documents.some((doc: any) => doc.document_number.trim() !== ''));

      if (hasDocumentNumbers) {
        const documentPromises: any[] = [];
        
        // Save quotation documents (เหมือน API เดิม)
        if (formData.quotation_documents && formData.quotation_documents.length > 0) {
          for (const doc of formData.quotation_documents) {
            if (doc.document_number.trim()) {
              const promise = supabase.from('quotation_documents').insert({
                productivity_log_id: logResult.id,
                document_type: 'quotation',
                document_number: doc.document_number.trim(),
                amount: doc.amount || null,
                delivery_fee: doc.delivery_fee || null
              });
              documentPromises.push(promise);
            }
          }
        }
        
        // Save invoice documents (เหมือน API เดิม)
        if (formData.invoice_documents && formData.invoice_documents.length > 0) {
          for (const doc of formData.invoice_documents) {
            if (doc.document_number.trim()) {
              const promise = supabase.from('quotation_documents').insert({
                productivity_log_id: logResult.id,
                document_type: 'invoice',
                document_number: doc.document_number.trim(),
                amount: doc.amount || null,
                delivery_fee: doc.delivery_fee || null
              });
              documentPromises.push(promise);
            }
          }
        }
        
        // Run all document insertions in parallel (เหมือน API เดิม)
        if (documentPromises.length > 0) {
          try {
            await Promise.all(documentPromises);
          } catch (docError: any) {
            console.error('❌ Document creation error:', docError);
            throw new Error(`Failed to create documents: ${docError.message}`);
          }
        }
      }

      // Step 6: Create quotation (if data exists) (เหมือน API เดิม)
      const hasQuotationData = formData.has_qt || formData.has_inv || formData.total_amount;

      if (hasQuotationData) {
        const quotationData = {
          productivity_log_id: logResult.id,
          has_qt: formData.has_qt || false,
          has_inv: formData.has_inv || false,
          total_amount: formData.total_amount || null,
          payment_method: formData.payment_method || null,
          installment_percent: formData.installment_type === 'percent' ? formData.installment_percent : 
                               formData.installment_type === 'full_payment' ? 100 : null,
          installment_amount: formData.installment_type === 'amount' ? formData.installment_amount : null,
          installment_periods: formData.installment_type === 'full_payment' ? 1 : 
                              formData.installment_periods || null,
          estimate_payment_date: formData.estimate_payment_date || null,
        };
        
        const { error: quotationError } = await supabase
          .from('quotations')
          .insert([quotationData])
          .select();
        
        if (quotationError) {
          console.error('❌ Quotation creation error:', quotationError);
          throw new Error(`Failed to create quotation: ${quotationError.message}`);
        }
        
        // Step 7: Create payment appointment (if estimate_payment_date exists) (เหมือน API เดิม)
        if (formData.estimate_payment_date && formData.estimate_payment_date.trim() !== '') {
          const paymentAppointmentData = {
            productivity_log_id: logResult.id,
            date: formData.estimate_payment_date ? new Date(formData.estimate_payment_date).toISOString() : null,
            appointment_type: 'payment',
            status: 'scheduled',
            note: `ประมาณการชำระเงิน ${formData.total_amount ? formData.total_amount.toLocaleString() + ' บาท' : ''} ${formData.payment_method ? '(' + formData.payment_method + ')' : ''}`
          };
          
          const { error: paymentAppointmentError } = await supabase
            .from('appointments')
            .insert([paymentAppointmentData])
            .select();
          
          if (paymentAppointmentError) {
            console.error('❌ Payment appointment creation error:', paymentAppointmentError);
            throw new Error(`Failed to create payment appointment: ${paymentAppointmentError.message}`);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, data: logResult }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );

  } catch (error: any) {
    console.error('[API] Productivity Log Submission Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
