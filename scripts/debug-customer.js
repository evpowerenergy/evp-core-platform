// Debug Script สำหรับค้นหาข้อมูลลูกค้า
import { supabase } from './src/integrations/supabase/client.js';

async function debugCustomer(phoneNumber) {
  console.log(`🔍 กำลังค้นหาข้อมูลลูกค้าเบอร์: ${phoneNumber}`);
  
  try {
    // 1. หาข้อมูล customer_services
    const { data: customerServices, error: csError } = await supabase
      .from('customer_services')
      .select('*')
      .eq('tel', phoneNumber);
    
    if (csError) throw csError;
    
    console.log('📋 ข้อมูล Customer Services:', customerServices);
    
    if (customerServices && customerServices.length > 0) {
      const customerId = customerServices[0].id;
      
      // 2. หาข้อมูล leads ที่เกี่ยวข้อง
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('customer_service_id', customerId);
      
      if (leadsError) throw leadsError;
      console.log('👥 ข้อมูล Leads:', leads);
      
      // 3. หาข้อมูล service appointments
      const { data: appointments, error: appError } = await supabase
        .from('service_appointments')
        .select('*')
        .eq('customer_service_id', customerId);
      
      if (appError) throw appError;
      console.log('📅 ข้อมูล Appointments:', appointments);
      
      // 4. หาข้อมูล productivity logs
      if (leads && leads.length > 0) {
        const leadId = leads[0].id;
        const { data: productivityLogs, error: prodError } = await supabase
          .from('lead_productivity_logs')
          .select('*')
          .eq('lead_id', leadId);
        
        if (prodError) throw prodError;
        console.log('📊 ข้อมูล Productivity Logs:', productivityLogs);
        
        // 5. หาข้อมูล quotations
        if (productivityLogs && productivityLogs.length > 0) {
          const logIds = productivityLogs.map(log => log.id);
          const { data: quotations, error: quoteError } = await supabase
            .from('quotations')
            .select('*')
            .in('productivity_log_id', logIds);
          
          if (quoteError) throw quoteError;
          console.log('💰 ข้อมูล Quotations:', quotations);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

// ใช้งาน
// debugCustomer('0812345678');

export { debugCustomer };
