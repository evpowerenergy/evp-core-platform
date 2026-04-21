// Database Debug Configuration
// ไฟล์ config สำหรับการเชื่อมต่อ Supabase

// อ่านจาก environment variables หรือใช้ fallback
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0ZmphcGZkenJ4bWJ4YmFyZmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjQyMTYsImV4cCI6MjA2NTU0MDIxNn0.0XlLe68v56-aT1nZL3xrU504OH9Q3YYr_Mz4SrVbMvQ';

export const SUPABASE_CONFIG = {
  // Production Database
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  
  // Database Settings
  settings: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'ev-power-energy-crm-debug'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
};

// Tables to analyze
export const TABLES_TO_ANALYZE = [
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

// Common search patterns
export const SEARCH_PATTERNS = {
  customer: {
    byName: (name) => `customer_group ILIKE '%${name}%'`,
    byPhone: (phone) => `tel = '${phone}'`,
    byProvince: (province) => `province = '${province}'`,
    byStatus: (status) => `status = '${status}'`
  },
  leads: {
    byName: (name) => `full_name ILIKE '%${name}%'`,
    byPhone: (phone) => `tel = '${phone}'`,
    byStatus: (status) => `status = '${status}'`
  }
};

// Export functions
export const createSupabaseClient = async () => {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, SUPABASE_CONFIG.settings);
};

export const logError = (error, context = '') => {
  console.error(`❌ เกิดข้อผิดพลาด${context ? ` ใน ${context}` : ''}:`, error);
};

export const logSuccess = (message, data = null) => {
  console.log(`✅ ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

export const logInfo = (message) => {
  console.log(`ℹ️  ${message}`);
};

export const logWarning = (message) => {
  console.log(`⚠️  ${message}`);
};
