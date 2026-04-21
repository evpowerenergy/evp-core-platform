// Script สำหรับดูโครงสร้าง database แบบละเอียด
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0ZmphcGZkenJ4bWJ4YmFyZmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjQyMTYsImV4cCI6MjA2NTU0MDIxNn0.0XlLe68v56-aT1nZL3xrU504OH9Q3YYr_Mz4SrVbMvQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabaseStructure() {
  console.log('🔍 กำลังวิเคราะห์โครงสร้าง Database...\n');
  
  try {
    // 1. ดูตารางทั้งหมดที่มีข้อมูล
    console.log('📋 === ตารางที่มีข้อมูล ===');
    
    const tablesToCheck = [
      'customer_services',
      'leads', 
      'service_appointments',
      'lead_productivity_logs',
      'quotations',
      'products',
      'users',
      'sales_team_with_user_info',
      'permit_requests',
      'conversations',
      'bookings',
      'resources',
      'office_equipment',
      'platforms',
      'suppliers',
      'purchase_orders',
      'purchase_order_items',
      'inventory_units',
      'sales_docs',
      'sales_doc_items',
      'sales_doc_item_units',
      'stock_movements',
      'ads_campaigns',
      'appointments',
      'credit_evaluation',
      'customers',
      'n8n_chat_histories',
      'openai_costs',
      'chat_state'
    ];
    
    const tableStats = [];
    
    for (const tableName of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error && count > 0) {
          tableStats.push({ name: tableName, count });
          console.log(`   ✅ ${tableName}: ${count} รายการ`);
        }
      } catch (err) {
        // ตารางไม่มีหรือไม่สามารถเข้าถึงได้
      }
    }
    
    // 2. ดูโครงสร้างตารางหลัก
    console.log('\n📊 === โครงสร้างตารางหลัก ===');
    
    // customer_services
    if (tableStats.find(t => t.name === 'customer_services')) {
      console.log('\n🏢 ตาราง customer_services:');
      const { data: sampleData, error } = await supabase
        .from('customer_services')
        .select('*')
        .limit(1);
      
      if (!error && sampleData && sampleData.length > 0) {
        const columns = Object.keys(sampleData[0]);
        console.log(`   - จำนวนคอลัมน์: ${columns.length}`);
        console.log(`   - คอลัมน์หลัก:`);
        columns.forEach((col, index) => {
          console.log(`     ${index + 1}. ${col}`);
        });
        
        // ดูข้อมูลตัวอย่าง
        console.log('\n   📝 ข้อมูลตัวอย่าง:');
        console.log(`     - ID: ${sampleData[0].id}`);
        console.log(`     - กลุ่มลูกค้า: ${sampleData[0].customer_group}`);
        console.log(`     - เบอร์โทร: ${sampleData[0].tel}`);
        console.log(`     - จังหวัด: ${sampleData[0].province}`);
        console.log(`     - สถานะ: ${sampleData[0].status}`);
        console.log(`     - วันที่ติดตั้ง: ${sampleData[0].installation_date}`);
        console.log(`     - Service Visit 1: ${sampleData[0].service_visit_1}`);
        console.log(`     - Service Visit 2: ${sampleData[0].service_visit_2}`);
        console.log(`     - Service Visit 3: ${sampleData[0].service_visit_3}`);
        console.log(`     - Service Visit 4: ${sampleData[0].service_visit_4}`);
        console.log(`     - Service Visit 5: ${sampleData[0].service_visit_5}`);
      }
    }
    
    // users
    if (tableStats.find(t => t.name === 'users')) {
      console.log('\n👥 ตาราง users:');
      const { data: sampleData, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (!error && sampleData && sampleData.length > 0) {
        const columns = Object.keys(sampleData[0]);
        console.log(`   - จำนวนคอลัมน์: ${columns.length}`);
        console.log(`   - คอลัมน์หลัก: ${columns.join(', ')}`);
      }
    }
    
    // 3. ดูข้อมูลสถิติ
    console.log('\n📈 === สถิติข้อมูล ===');
    console.log(`   - จำนวนตารางที่มีข้อมูล: ${tableStats.length}`);
    console.log(`   - ตารางที่มีข้อมูลมากที่สุด: ${tableStats.sort((a, b) => b.count - a.count)[0]?.name} (${tableStats.sort((a, b) => b.count - a.count)[0]?.count} รายการ)`);
    
    // 4. ดูข้อมูลล่าสุด
    console.log('\n🕒 === ข้อมูลล่าสุด ===');
    
    const { data: latestCustomers, error: latestError } = await supabase
      .from('customer_services')
      .select('id, customer_group, tel, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (!latestError && latestCustomers) {
      console.log('   ลูกค้าที่อัปเดตล่าสุด:');
      latestCustomers.forEach((customer, index) => {
        console.log(`     ${index + 1}. ${customer.customer_group} (${customer.tel}) - ${customer.updated_at}`);
      });
    }
    
    // 5. ดูข้อมูลตามจังหวัด
    console.log('\n🗺️ === ข้อมูลตามจังหวัด ===');
    
    const { data: provinceStats, error: provinceError } = await supabase
      .from('customer_services')
      .select('province')
      .not('province', 'is', null);
    
    if (!provinceError && provinceStats) {
      const provinceCount = {};
      provinceStats.forEach(item => {
        provinceCount[item.province] = (provinceCount[item.province] || 0) + 1;
      });
      
      console.log('   จำนวนลูกค้าตามจังหวัด:');
      Object.entries(provinceCount)
        .sort(([,a], [,b]) => b - a)
        .forEach(([province, count]) => {
          console.log(`     - ${province}: ${count} รายการ`);
        });
    }
    
    // 6. ดูข้อมูลตามสถานะ
    console.log('\n📊 === ข้อมูลตามสถานะ ===');
    
    const { data: statusStats, error: statusError } = await supabase
      .from('customer_services')
      .select('status')
      .not('status', 'is', null);
    
    if (!statusError && statusStats) {
      const statusCount = {};
      statusStats.forEach(item => {
        statusCount[item.status] = (statusCount[item.status] || 0) + 1;
      });
      
      console.log('   จำนวนลูกค้าตามสถานะ:');
      Object.entries(statusCount)
        .sort(([,a], [,b]) => b - a)
        .forEach(([status, count]) => {
          console.log(`     - ${status}: ${count} รายการ`);
        });
    }
    
    // 7. ดูข้อมูล Service Visits
    console.log('\n🔧 === สถิติ Service Visits ===');
    
    const { data: serviceStats, error: serviceError } = await supabase
      .from('customer_services')
      .select('service_visit_1, service_visit_2, service_visit_3, service_visit_4, service_visit_5');
    
    if (!serviceError && serviceStats) {
      const visit1Completed = serviceStats.filter(s => s.service_visit_1 === true).length;
      const visit2Completed = serviceStats.filter(s => s.service_visit_2 === true).length;
      const visit3Completed = serviceStats.filter(s => s.service_visit_3 === true).length;
      const visit4Completed = serviceStats.filter(s => s.service_visit_4 === true).length;
      const visit5Completed = serviceStats.filter(s => s.service_visit_5 === true).length;
      
      console.log(`   - Service Visit 1 เสร็จแล้ว: ${visit1Completed} รายการ`);
      console.log(`   - Service Visit 2 เสร็จแล้ว: ${visit2Completed} รายการ`);
      console.log(`   - Service Visit 3 เสร็จแล้ว: ${visit3Completed} รายการ`);
      console.log(`   - Service Visit 4 เสร็จแล้ว: ${visit4Completed} รายการ`);
      console.log(`   - Service Visit 5 เสร็จแล้ว: ${visit5Completed} รายการ`);
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

// รันการวิเคราะห์
analyzeDatabaseStructure();
