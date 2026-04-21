// Script สำหรับตรวจสอบ view definition
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0ZmphcGZkenJ4bWJ4YmFyZmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjQyMTYsImV4cCI6MjA2NTU0MDIxNn0.0XlLe68v56-aT1nZL3xrU504OH9Q3YYr_Mz4SrVbMvQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkViewDefinition() {
  console.log('🔍 กำลังตรวจสอบ view definition...');
  
  try {
    // ตรวจสอบ view definition
    const { data: viewData, error: viewError } = await supabase
      .rpc('get_view_definition', { view_name: 'customer_services_extended' });
    
    if (viewError) {
      console.error('❌ เกิดข้อผิดพลาด:', viewError);
      return;
    }
    
    console.log('✅ View definition:');
    console.log(JSON.stringify(viewData, null, 2));
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

checkViewDefinition();
