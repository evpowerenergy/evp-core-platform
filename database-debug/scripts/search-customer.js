// Script สำหรับค้นหาข้อมูลลูกค้าชื่อ "ฟอนดี้" ในตาราง customer_services
import { createClient } from '@supabase/supabase-js';

// ใช้ production database
const supabaseUrl = 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0ZmphcGZkenJ4bWJ4YmFyZmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjQyMTYsImV4cCI6MjA2NTU0MDIxNn0.0XlLe68v56-aT1nZL3xrU504OH9Q3YYr_Mz4SrVbMvQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function searchCustomerByName() {
  console.log('🔍 กำลังค้นหาข้อมูลลูกค้าชื่อ "ฟอนดี้" ในตาราง customer_services...');
  
  try {
    // ค้นหาข้อมูลลูกค้าที่มีชื่อ "ฟอนดี้" ในตาราง customer_services
    const { data: customers, error } = await supabase
      .from('customer_services')
      .select('*')
      .ilike('customer_group', '%ฟอนดี้%');
    
    if (error) {
      console.error('❌ เกิดข้อผิดพลาด:', error);
      return;
    }
    
    if (!customers || customers.length === 0) {
      console.log('❌ ไม่พบข้อมูลลูกค้าชื่อ "ฟอนดี้" ในตาราง customer_services');
      
      // ลองค้นหาในตารางอื่น
      console.log('\n🔍 ลองค้นหาในตาราง leads...');
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .ilike('full_name', '%ฟอนดี้%');
      
      if (leadsError) {
        console.error('❌ เกิดข้อผิดพลาดในการค้นหา leads:', leadsError);
        return;
      }
      
      if (leads && leads.length > 0) {
        console.log('✅ พบข้อมูลในตาราง leads:');
        console.log(JSON.stringify(leads, null, 2));
      } else {
        console.log('❌ ไม่พบข้อมูลลูกค้าชื่อ "ฟอนดี้" ในตาราง leads');
      }
      
      return;
    }
    
    console.log('✅ พบข้อมูลลูกค้าชื่อ "ฟอนดี้":');
    console.log(JSON.stringify(customers, null, 2));
    
    // แสดงข้อมูลเพิ่มเติมสำหรับลูกค้าแต่ละคน
    for (const customer of customers) {
      console.log(`\n📋 ข้อมูลลูกค้า ID: ${customer.id}`);
      console.log(`   - กลุ่มลูกค้า: ${customer.customer_group}`);
      console.log(`   - เบอร์โทร: ${customer.tel}`);
      console.log(`   - จังหวัด: ${customer.province}`);
      console.log(`   - สถานะ: ${customer.status}`);
      console.log(`   - วันที่ติดตั้ง: ${customer.installation_date}`);
      
      // หาข้อมูลนัดหมายบริการ
      const { data: appointments, error: appError } = await supabase
        .from('service_appointments')
        .select('*')
        .eq('customer_service_id', customer.id);
      
      if (!appError && appointments && appointments.length > 0) {
        console.log(`   - จำนวนนัดหมาย: ${appointments.length}`);
        appointments.forEach((appointment, index) => {
          console.log(`     ${index + 1}. วันที่: ${appointment.appointment_date}, ประเภท: ${appointment.service_type}, สถานะ: ${appointment.status}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

// รันการค้นหา
searchCustomerByName();
