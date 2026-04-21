import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://ttfjapfdzrxmbxbarfbn.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ ไม่พบตัวแปร SUPABASE_SERVICE_ROLE_KEY ใน environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function debugInventoryUnits() {
  try {
    const { data, error } = await supabase
      .from('inventory_units')
      .select('id, product_id, serial_no, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ เกิดข้อผิดพลาด:', error);
      process.exit(1);
    }

    console.log(`✅ พบข้อมูล inventory_units ทั้งหมด ${data.length} รายการ\n`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาด:', err);
    process.exit(1);
  }
}

debugInventoryUnits();

