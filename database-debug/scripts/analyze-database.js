// Script สำหรับวิเคราะห์โครงสร้าง database ทั้งหมด
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0ZmphcGZkenJ4bWJ4YmFyZmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjQyMTYsImV4cCI6MjA2NTU0MDIxNn0.0XlLe68v56-aT1nZL3xrU504OH9Q3YYr_Mz4SrVbMvQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
  console.log('🔍 กำลังวิเคราะห์โครงสร้าง Database...\n');
  
  try {
    // 1. ดูตารางทั้งหมด
    console.log('📋 === ตารางทั้งหมด ===');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_all_tables');
    
    if (tablesError) {
      // ใช้วิธีอื่นถ้า function ไม่มี
      console.log('⚠️  ไม่สามารถใช้ function get_all_tables ได้');
    } else {
      console.log(JSON.stringify(tables, null, 2));
    }
    
    // 2. ดูข้อมูลตารางหลัก
    console.log('\n📊 === ข้อมูลตารางหลัก ===');
    
    // customer_services
    const { data: customerServices, error: csError } = await supabase
      .from('customer_services')
      .select('*')
      .limit(1);
    
    if (!csError && customerServices && customerServices.length > 0) {
      console.log('✅ ตาราง customer_services:');
      console.log(`   - จำนวนคอลัมน์: ${Object.keys(customerServices[0]).length}`);
      console.log(`   - คอลัมน์หลัก: ${Object.keys(customerServices[0]).join(', ')}`);
    }
    
    // leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
    
    if (!leadsError && leads && leads.length > 0) {
      console.log('✅ ตาราง leads:');
      console.log(`   - จำนวนคอลัมน์: ${Object.keys(leads[0]).length}`);
      console.log(`   - คอลัมน์หลัก: ${Object.keys(leads[0]).join(', ')}`);
    }
    
    // service_appointments
    const { data: appointments, error: appError } = await supabase
      .from('service_appointments')
      .select('*')
      .limit(1);
    
    if (!appError && appointments && appointments.length > 0) {
      console.log('✅ ตาราง service_appointments:');
      console.log(`   - จำนวนคอลัมน์: ${Object.keys(appointments[0]).length}`);
      console.log(`   - คอลัมน์หลัก: ${Object.keys(appointments[0]).join(', ')}`);
    }
    
    // 3. ดูจำนวนข้อมูลในแต่ละตาราง
    console.log('\n📈 === จำนวนข้อมูลในแต่ละตาราง ===');
    
    const tablesToCheck = [
      'customer_services',
      'leads', 
      'service_appointments',
      'lead_productivity_logs',
      'quotations',
      'products',
      'users',
      'sales_team_with_user_info'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`   - ${tableName}: ${count} รายการ`);
        } else {
          console.log(`   - ${tableName}: ไม่สามารถเข้าถึงได้`);
        }
      } catch (err) {
        console.log(`   - ${tableName}: ไม่พบตาราง`);
      }
    }
    
    // 4. ดู RLS (Row Level Security)
    console.log('\n🔒 === Row Level Security ===');
    try {
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('get_rls_policies');
      
      if (rlsError) {
        console.log('⚠️  ไม่สามารถดู RLS policies ได้');
      } else {
        console.log(JSON.stringify(rlsData, null, 2));
      }
    } catch (err) {
      console.log('⚠️  ไม่สามารถเข้าถึง RLS information ได้');
    }
    
    // 5. ดู Triggers
    console.log('\n⚡ === Database Triggers ===');
    try {
      const { data: triggers, error: triggerError } = await supabase
        .rpc('get_triggers');
      
      if (triggerError) {
        console.log('⚠️  ไม่สามารถดู triggers ได้');
      } else {
        console.log(JSON.stringify(triggers, null, 2));
      }
    } catch (err) {
      console.log('⚠️  ไม่สามารถเข้าถึง trigger information ได้');
    }
    
    // 6. ดู Functions
    console.log('\n🔧 === Database Functions ===');
    try {
      const { data: functions, error: funcError } = await supabase
        .rpc('get_functions');
      
      if (funcError) {
        console.log('⚠️  ไม่สามารถดู functions ได้');
      } else {
        console.log(JSON.stringify(functions, null, 2));
      }
    } catch (err) {
      console.log('⚠️  ไม่สามารถเข้าถึง function information ได้');
    }
    
    // 7. ดู Views
    console.log('\n👁️ === Database Views ===');
    try {
      const { data: views, error: viewsError } = await supabase
        .rpc('get_views');
      
      if (viewsError) {
        console.log('⚠️  ไม่สามารถดู views ได้');
      } else {
        console.log(JSON.stringify(views, null, 2));
      }
    } catch (err) {
      console.log('⚠️  ไม่สามารถเข้าถึง view information ได้');
    }
    
    // 8. ทดสอบ trigger ที่มีอยู่
    console.log('\n🧪 === ทดสอบ Triggers ===');
    
    // ดูว่า trigger ทำงานหรือไม่
    try {
      const { data: triggerTest, error: triggerTestError } = await supabase
        .from('service_appointments')
        .select('*')
        .limit(1);
      
      if (!triggerTestError && triggerTest && triggerTest.length > 0) {
        console.log('✅ ตาราง service_appointments มีข้อมูล');
        console.log(`   - ตัวอย่างข้อมูล: ${JSON.stringify(triggerTest[0], null, 2)}`);
      }
    } catch (err) {
      console.log('⚠️  ไม่สามารถเข้าถึง service_appointments ได้');
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

// รันการวิเคราะห์
analyzeDatabase();
